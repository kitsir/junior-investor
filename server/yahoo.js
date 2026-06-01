// Direct Yahoo Finance fetch — no cookie/crumb needed for v8 chart endpoints
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function yf(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`Yahoo ${res.status} ${url.split('?')[0]}`)
  return res.json()
}

// Try query1 first, fallback to query2 (different Yahoo server, avoids rate-limit blocks)
async function yfFetch(path) {
  try {
    return await yf(`https://query1.finance.yahoo.com${path}`)
  } catch (e1) {
    console.warn(`query1 failed (${e1.message}), trying query2...`)
    return await yf(`https://query2.finance.yahoo.com${path}`)
  }
}

export async function getQuote(ticker) {
  const data = await yfFetch(`/v8/finance/chart/${ticker}?interval=1d&range=1d&includePrePost=false`)
  const meta = data.chart.result[0].meta
  const prev = meta.previousClose || meta.chartPreviousClose || meta.regularMarketPrice
  return {
    ticker: meta.symbol,
    name: meta.longName || meta.shortName || ticker,
    price: meta.regularMarketPrice,
    open: meta.regularMarketOpen || meta.regularMarketPrice,
    high: meta.regularMarketDayHigh,
    low: meta.regularMarketDayLow,
    prevClose: prev,
    volume: meta.regularMarketVolume,
    change: meta.regularMarketPrice - prev,
    changePct: ((meta.regularMarketPrice - prev) / prev) * 100,
    week52High: meta.fiftyTwoWeekHigh,
    week52Low: meta.fiftyTwoWeekLow,
    currency: meta.currency,
    exchange: meta.fullExchangeName || meta.exchangeName,
    marketCap: null,
    trailingPE: null,
    eps: null,
  }
}

// Stooq fallback — free historical data, no auth, very reliable
// Works for US stocks: AAPL→aapl.us, BRK-B→brk.b.us, TSLA→tsla.us
async function getChartStooq(ticker, range = '1y') {
  const RANGE_TO_DAYS = { '1mo': 31, '3mo': 92, '6mo': 183, '1y': 365, '2y': 730, '5y': 1825 }
  const days = RANGE_TO_DAYS[range] || 365

  // BRK-B → brk.b.us  |  AAPL → aapl.us
  const stooqTicker = ticker.replace(/-/g, '.').toLowerCase() + '.us'

  const end = new Date()
  const start = new Date(Date.now() - days * 86400000)
  const fmt = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

  const url = `https://stooq.com/q/d/l/?s=${stooqTicker}&d1=${fmt(start)}&d2=${fmt(end)}&i=d`
  const res = await fetch(url, { headers: { ...HEADERS, Accept: 'text/csv,text/plain,*/*' } })
  if (!res.ok) throw new Error(`Stooq ${res.status}`)
  const text = await res.text()

  // Stooq returns "No data" page or Polish error on bad ticker
  if (!text.includes(',') || text.toLowerCase().includes('no data') || text.length < 50) {
    throw new Error(`Stooq: no data for ${stooqTicker}`)
  }

  const lines = text.trim().split('\n').slice(1) // skip CSV header
  if (!lines.length) throw new Error('Stooq: empty response')

  return lines.map(line => {
    const [date, open, high, low, close, volume] = line.split(',')
    if (!date || !close) return null
    const t = Math.floor(new Date(date).getTime() / 1000)
    return { time: t, open: +open, high: +high, low: +low, close: +close, volume: +(volume || 0) }
  }).filter(b => b && b.open && b.close && !isNaN(b.time) && b.time > 0)
}

export async function getChart(ticker, range = '1y', interval = '1d') {
  const RANGE_TO_DAYS = { '1mo': 31, '3mo': 92, '6mo': 183, '1y': 365, '2y': 730, '5y': 1825 }
  const days = RANGE_TO_DAYS[range] || 365
  const p1 = Math.floor((Date.now() - days * 86400000) / 1000)
  const p2 = Math.floor(Date.now() / 1000)

  // 1st: Yahoo Finance (query1 → query2 fallback)
  try {
    const data = await yfFetch(`/v8/finance/chart/${ticker}?interval=${interval}&period1=${p1}&period2=${p2}&includePrePost=false`)
    const r = data.chart.result[0]
    const times = r.timestamp || []
    const q = r.indicators.quote[0]
    return times.map((t, i) => ({
      time: t, open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i], volume: q.volume[i] || 0,
    })).filter(b => b.open && b.close)
  } catch (yahooErr) {
    console.warn(`Yahoo chart failed for ${ticker}: ${yahooErr.message}`)
    // 2nd: Stooq fallback (US stocks — no exchange dot-suffix like .BK, .L)
    // Allow tickers with hyphen (BRK-B) which are US class shares
    const isUSStock = !ticker.includes('.') || ticker.includes('-')
    if (isUSStock) {
      console.log(`Trying Stooq for ${ticker}...`)
      return await getChartStooq(ticker, range)
    }
    throw yahooErr
  }
}

// Convert Yahoo Finance ticker format to TradingView Scanner format:
//   BRK-B  → BRK.B  (class share: hyphen → dot)
//   PTT.BK → PTT    (exchange suffix: strip after dot)
//   AAPL   → AAPL   (no change)
function toTVTicker(ticker) {
  if (ticker.includes('-')) {
    return ticker.replace(/-/g, '.')
  }
  if (ticker.includes('.')) {
    return ticker.split('.')[0]
  }
  return ticker
}

export async function getFundamentals(ticker) {
  try {
    const columns = [
      'name',                              // d[0]  ticker symbol
      'description',                       // d[1]  company full name
      'market_cap_basic',                  // d[2]
      'price_earnings_ttm',               // d[3]
      'price_book_ratio',                  // d[4]
      'price_sales_current',               // d[5]
      'enterprise_value_ebitda_ttm',       // d[6]
      'gross_margin',                      // d[7]
      'net_margin_ttm',                    // d[8]
      'return_on_equity',                  // d[9]
      'return_on_assets',                  // d[10]
      'total_revenue',                     // d[11]
      'revenue_growth_yoy',               // d[12]
      'earnings_per_share_basic_ttm',      // d[13]
      'total_debt',                        // d[14]
      'cash_n_short_term_invest',          // d[15]
      'current_ratio',                     // d[16]
      'debt_to_equity',                    // d[17]
      'dividend_yield_recent',             // d[18]
      'beta_1_year',                       // d[19]
      'total_shares_outstanding',          // d[20]
      'number_of_employees',               // d[21]
      'sector',                            // d[22]
      'industry',                          // d[23]
      'operating_margin',                  // d[24]
      'earnings_per_share_forecast_next_fy', // d[25]
      'earnings_per_share_diluted_yoy',    // d[26] earnings growth YoY
      'price_book_fq',                     // d[27] P/B quarterly (fallback)
    ]

    const tvTicker = toTVTicker(ticker)

    const body = {
      filter: [{ left: 'name', operation: 'equal', right: tvTicker }],
      sort: { sortBy: 'average_volume_10d_calc', sortOrder: 'desc' },
      columns: columns
    }

    const res = await fetch('https://scanner.tradingview.com/global/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!res.ok) throw new Error(`TV API ${res.status}`)
    const json = await res.json()
    if (!json.data || json.data.length === 0) throw new Error(`Not found in TV Scanner: ${tvTicker}`)

    const d = json.data[0].d
    const v = (val, isPct = false) => (val != null && val !== '') ? (isPct ? val / 100 : val) : null

    let forwardEps = v(d[25])
    let forwardPE = null
    try {
      const quote = await getQuote(ticker)
      if (quote.price && forwardEps) forwardPE = quote.price / forwardEps
    } catch (_) {}

    return {
      ticker: ticker,
      name: d[1] || ticker,
      sector: d[22],
      industry: d[23],
      description: 'Data provided by TradingView Scanner API.',
      marketCap: v(d[2]),
      trailingPE: v(d[3]),
      forwardPE: forwardPE,
      priceToBook: v(d[4]),
      priceToSales: v(d[5]),
      enterpriseToEbitda: v(d[6]),
      pegRatio: null,
      grossMargins: v(d[7], true),
      profitMargins: v(d[8], true),
      operatingMargins: v(d[24], true),
      returnOnEquity: v(d[9], true),
      returnOnAssets: v(d[10], true),
      totalRevenue: v(d[11]),
      revenueGrowth: v(d[12], true),
      earningsGrowth: null,
      eps: v(d[13]),
      forwardEps: forwardEps,
      ebitda: null,
      totalDebt: v(d[14]),
      currentRatio: v(d[16]),
      totalCash: v(d[15]),
      debtToEquity: v(d[17]),
      bookValue: null,
      freeCashflow: null,
      operatingCashflow: null,
      dividendRate: null,
      dividendYield: v(d[18], true),
      beta: v(d[19]),
      sharesOutstanding: v(d[20]),
      earningsGrowth: v(d[26], true),      // EPS YoY growth from TV Scanner
      priceToBookQtr: v(d[27]),            // P/B quarterly fallback
      targetMeanPrice: null,
      analystRating: null,
      numberOfAnalysts: null,
      employees: v(d[21])
    }
  } catch (err) {
    console.error(`Fundamentals error for ${ticker}:`, err.message)
    return { ticker, name: ticker, marketCap: null, description: `Error fetching fundamentals: ${err.message}` }
  }
}

export async function search(q) {
  const data = await yfFetch(`/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=0&quotesCount=8`)
  return (data.quotes || [])
    .filter(r => r.quoteType === 'EQUITY')
    .map(r => ({ ticker: r.symbol, name: r.shortname || r.longname, exchange: r.exchDisp }))
}

export async function getQuoteSimple(ticker) {
  const data = await yfFetch(`/v8/finance/chart/${ticker}?interval=1d&range=1d`)
  return data.chart.result[0].meta.regularMarketPrice || 0
}
