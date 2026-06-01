// ─── Support & Resistance ───────────────────────────────────────────────────

/**
 * หา swing high/low จาก OHLCV bars แล้ว cluster เป็น S/R levels
 * @param {Array} bars  - [{ time, open, high, low, close, volume }]
 * @param {Object} opts - { lookback: 10, clusterPct: 0.015, maxLevels: 8 }
 * @returns {Array} levels - [{ price, type, touches, strength, recency }]
 */
export function findSupportResistanceLevels(bars, opts = {}) {
  const { lookback = 10, clusterPct = 0.015, maxLevels = 8 } = opts
  if (!bars || bars.length < lookback * 2 + 1) return []

  const candidates = []

  for (let i = lookback; i < bars.length - lookback; i++) {
    const window = bars.slice(i - lookback, i + lookback + 1)
    const center = bars[i]

    // Swing high (resistance)
    const isSwingHigh = window.every((b, idx) => idx === lookback || b.high <= center.high)
    if (isSwingHigh) {
      candidates.push({
        price: center.high,
        type: 'resistance',
        idx: i,
        recency: i / bars.length,
        volume: center.volume,
      })
    }

    // Swing low (support)
    const isSwingLow = window.every((b, idx) => idx === lookback || b.low >= center.low)
    if (isSwingLow) {
      candidates.push({
        price: center.low,
        type: 'support',
        idx: i,
        recency: i / bars.length,
        volume: center.volume,
      })
    }
  }

  // Cluster nearby levels
  const clusters = []
  const sorted = [...candidates].sort((a, b) => a.price - b.price)

  for (const c of sorted) {
    const existing = clusters.find(cl => Math.abs(cl.price - c.price) / cl.price < clusterPct)
    if (existing) {
      existing.price = (existing.price * existing.touches + c.price) / (existing.touches + 1)
      existing.touches++
      existing.recency = Math.max(existing.recency, c.recency)
      existing.volume += c.volume
    } else {
      clusters.push({ ...c, touches: 1 })
    }
  }

  // Score = touches * 0.5 + recency * 0.3 + normalized_volume * 0.2
  const maxVol = Math.max(...clusters.map(c => c.volume))
  clusters.forEach(c => {
    c.strength = Math.round(
      (c.touches / Math.max(...clusters.map(x => x.touches))) * 50 +
      c.recency * 30 +
      (c.volume / maxVol) * 20
    )
  })

  return clusters
    .sort((a, b) => b.strength - a.strength)
    .slice(0, maxLevels)
    .sort((a, b) => b.price - a.price)
}

/**
 * แยก S/R levels เป็น resistance (เหนือราคา) และ support (ใต้ราคา)
 * กรองเฉพาะ levels ที่อยู่ภายใน ±20% ของราคาปัจจุบัน
 */
export function splitLevels(levels, currentPrice, proximityPct = 0.20) {
  const lo = currentPrice * (1 - proximityPct)
  const hi = currentPrice * (1 + proximityPct)
  const nearby = levels.filter(l => l.price >= lo && l.price <= hi)
  const resistance = nearby.filter(l => l.price > currentPrice * 1.001)
  const support = nearby.filter(l => l.price < currentPrice * 0.999)
  return { resistance, support }
}

// ─── Price Targets ────────────────────────────────────────────────────────────

/**
 * คำนวณ price target 3 ระดับ จาก fundamental metrics
 * @param {Object} f - fundamentals object
 * @param {number} currentPrice
 * @returns {{ conservative, base, optimistic, analystTarget }}
 */
export function calculatePriceTargets(f, currentPrice) {
  const results = {}

  // Conservative: Graham Number = √(22.5 × EPS × BookValue/share)
  if (f.eps > 0 && f.bookValue > 0) {
    results.conservative = Math.sqrt(22.5 * f.eps * f.bookValue)
  }

  // Base: Forward EPS × sector-avg P/E (20x)
  if (f.forwardEps > 0) {
    results.base = f.forwardEps * 20
  }

  // Optimistic: PEG-based (EPS × growth rate, capped at 35)
  if (f.forwardEps > 0 && f.earningsGrowth != null) {
    const growthPct = Math.min(Math.abs(f.earningsGrowth) * 100, 35)
    results.optimistic = f.forwardEps * Math.max(growthPct, 10)
  }

  // Analyst consensus
  if (f.targetMeanPrice) {
    results.analystTarget = f.targetMeanPrice
    results.analystHigh = f.targetHighPrice
    results.analystLow = f.targetLowPrice
  }

  // Add upside %
  Object.keys(results).forEach(key => {
    if (typeof results[key] === 'number') {
      results[`${key}Upside`] = ((results[key] - currentPrice) / currentPrice) * 100
    }
  })

  return results
}

// ─── Fundamental Score ────────────────────────────────────────────────────────

/**
 * คำนวณ fundamental score 0-100 จาก 4 หมวด
 * @param {Object} f - fundamentals object
 * @returns {{ total, profitability, growth, value, health, breakdown }}
 */
export function calculateFundamentalScore(f) {
  const breakdown = {}

  // 1. Profitability (0-25)
  let profit = 0
  if (f.returnOnEquity != null) {
    if (f.returnOnEquity > 0.25) profit += 10
    else if (f.returnOnEquity > 0.15) profit += 7
    else if (f.returnOnEquity > 0.08) profit += 4
    else if (f.returnOnEquity > 0) profit += 1
  }
  if (f.profitMargins != null) {
    if (f.profitMargins > 0.20) profit += 10
    else if (f.profitMargins > 0.10) profit += 7
    else if (f.profitMargins > 0.05) profit += 4
    else if (f.profitMargins > 0) profit += 1
  }
  if (f.returnOnAssets != null) {
    if (f.returnOnAssets > 0.10) profit += 5
    else if (f.returnOnAssets > 0.05) profit += 3
    else if (f.returnOnAssets > 0) profit += 1
  }
  breakdown.profitability = Math.min(profit, 25)

  // 2. Growth (0-25)
  let growth = 0
  if (f.revenueGrowth != null) {
    if (f.revenueGrowth > 0.25) growth += 13
    else if (f.revenueGrowth > 0.15) growth += 9
    else if (f.revenueGrowth > 0.05) growth += 5
    else if (f.revenueGrowth > 0) growth += 2
  }
  // Earnings growth: use TV YoY data, fall back to implied from TTM→Forward EPS
  const egSource = f.earningsGrowth ?? f.impliedEpsGrowth ?? null
  if (egSource != null) {
    if (egSource > 0.25) growth += 12
    else if (egSource > 0.15) growth += 8
    else if (egSource > 0.05) growth += 4
    else if (egSource > 0) growth += 2
  }
  breakdown.growth = Math.min(growth, 25)

  // 3. Value (0-25)
  // Use the BETTER (lower) of trailing vs forward P/E — fairer for growth stocks
  let value = 0
  const trailingValid = f.trailingPE != null && f.trailingPE > 0
  const forwardValid  = f.forwardPE  != null && f.forwardPE  > 0
  let pe = null
  if (trailingValid && forwardValid) pe = Math.min(f.trailingPE, f.forwardPE)
  else if (trailingValid) pe = f.trailingPE
  else if (forwardValid)  pe = f.forwardPE
  if (pe != null) {
    if (pe < 12)   value += 12
    else if (pe < 20)  value += 9
    else if (pe < 30)  value += 6
    else if (pe < 50)  value += 4
    else if (pe < 80)  value += 3
    else if (pe < 120) value += 2
    else               value += 1  // very high P/E = 1 pt (data present, just expensive)
  }
  // P/B: use TTM, fall back to quarterly
  const pb = f.priceToBook ?? f.priceToBookQtr ?? null
  if (pb != null && pb > 0) {
    if (pb < 1.5)  value += 8
    else if (pb < 3)   value += 5
    else if (pb < 6)   value += 3
    else if (pb < 10)  value += 2
    else if (pb < 20)  value += 1  // high P/B growth stocks still get 1 pt
  }
  if (f.enterpriseToEbitda != null && f.enterpriseToEbitda > 0) {
    if (f.enterpriseToEbitda < 10)  value += 5
    else if (f.enterpriseToEbitda < 18)  value += 3
    else if (f.enterpriseToEbitda < 28)  value += 1
  }
  breakdown.value = Math.min(value, 25)

  // 4. Financial Health (0-25)
  let health = 0
  if (f.debtToEquity != null) {
    if (f.debtToEquity < 30) health += 12
    else if (f.debtToEquity < 80) health += 8
    else if (f.debtToEquity < 150) health += 4
  }
  if (f.currentRatio != null) {
    if (f.currentRatio > 2.5) health += 8
    else if (f.currentRatio > 1.8) health += 6
    else if (f.currentRatio > 1.2) health += 3
    else if (f.currentRatio > 1.0) health += 1
  }
  if (f.freeCashflow != null && f.freeCashflow > 0) health += 5
  breakdown.health = Math.min(health, 25)

  const total = breakdown.profitability + breakdown.growth + breakdown.value + breakdown.health

  return { total, ...breakdown }
}

// ─── Momentum Analysis ────────────────────────────────────────────────────────

/**
 * คำนวณ price momentum จาก OHLCV bars
 */
export function calculateMomentum(bars) {
  if (!bars || bars.length < 2) return {}
  const last = bars[bars.length - 1].close
  const get = (daysAgo) => {
    const idx = bars.length - 1 - daysAgo
    return idx >= 0 ? bars[idx].close : null
  }
  const ret = (daysAgo) => {
    const p = get(daysAgo)
    return p ? ((last - p) / p) * 100 : null
  }

  const high52 = Math.max(...bars.slice(-252).map(b => b.high))
  const low52 = Math.min(...bars.slice(-252).map(b => b.low))

  return {
    '1m': ret(21),
    '3m': ret(63),
    '6m': ret(126),
    '1y': ret(252),
    fromHigh52: ((last - high52) / high52) * 100,
    fromLow52: ((last - low52) / low52) * 100,
    positionIn52wk: Math.round(((last - low52) / (high52 - low52)) * 100),
  }
}

// ─── Average Volume ───────────────────────────────────────────────────────────

export function avgVolume(bars, days = 20) {
  if (!bars || bars.length < days) return null
  const recent = bars.slice(-days)
  return recent.reduce((s, b) => s + b.volume, 0) / days
}
