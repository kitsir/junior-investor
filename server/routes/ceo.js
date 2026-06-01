import { Router } from 'express'
import { getQuoteSimple } from '../yahoo.js'

const router = Router()

const POSITIONS = [
  { ticker: 'ARM',  shares: 5.5164, costPerShare: 127.6437, name: 'Arm Holdings' },
  { ticker: 'AMZN', shares: 3.9913, costPerShare: 213.5034, name: 'Amazon' },
  { ticker: 'TSM',  shares: 1.6793, costPerShare: 259.9635, name: 'Taiwan Semiconductor' },
  { ticker: 'NVDA', shares: 3.1845, costPerShare: 172.6380, name: 'NVIDIA' },
  { ticker: 'META', shares: 0.8026, costPerShare: 602.0000, name: 'Meta Platforms' },
  { ticker: 'LLY',  shares: 0.8795, costPerShare: 283.8097, name: 'Eli Lilly' },
  { ticker: 'UNH',  shares: 0.9627, costPerShare: 177.3340, name: 'UnitedHealth' },
  { ticker: 'JNJ',  shares: 0.0087, costPerShare: 177.3340, name: 'Johnson & Johnson' },
]

// GET /api/ceo
router.get('/', async (req, res) => {
  try {
    const tickers = POSITIONS.map(p => p.ticker)
    const quotes = await Promise.allSettled(tickers.map(t => getQuoteSimple(t)))

    const priceMap = {}
    quotes.forEach((r, i) => {
      if (r.status === 'fulfilled') priceMap[tickers[i]] = r.value || 0
    })

    let totalCost = 0
    let totalValue = 0

    const positions = POSITIONS.map(p => {
      const price = priceMap[p.ticker] || 0
      const cost = p.shares * p.costPerShare
      const value = p.shares * price
      const gain = value - cost
      const gainPct = cost > 0 ? (gain / cost) * 100 : 0
      totalCost += cost
      totalValue += value
      return { ...p, price, cost, value, gain, gainPct }
    })

    // Sort by current value descending, compute weight
    positions.sort((a, b) => b.value - a.value)
    positions.forEach(p => { p.weight = totalValue > 0 ? (p.value / totalValue) * 100 : 0 })

    const totalGain = totalValue - totalCost
    const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

    res.json({
      success: true,
      portfolio: {
        name: 'CEO Portfolio',
        description: 'พอร์ตตัวอย่าง · อัพเดตตามราคาตลาดจริง',
        totalCost,
        totalValue,
        totalGain,
        totalGainPct,
        positions,
      }
    })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message })
  }
})

export default router
