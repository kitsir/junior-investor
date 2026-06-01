import { Router } from 'express'
import pool from '../db.js'
import { getQuote, getChart, getFundamentals, search } from '../yahoo.js'

const router = Router()
const TTL = {
  quote: 2,
  chart: 15,
  fundamentals: 1440 // 24 hours
}

async function getCacheRow(key, type) {
  const { rows } = await pool.query(
    'SELECT data, updated_at FROM cache WHERE ticker = $1 AND type = $2', [key, type]
  )
  return rows[0]
}

async function setCache(key, type, data) {
  await pool.query(`
    INSERT INTO cache (ticker, type, data, updated_at) VALUES ($1, $2, $3, NOW())
    ON CONFLICT (ticker, type) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
  `, [key, type, JSON.stringify(data)])
}

router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q) return res.json({ success: true, results: [] })
  try {
    const results = await search(q)
    res.json({ success: true, results })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message })
  }
})

router.get('/:ticker/quote', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const cached = await getCacheRow(ticker, 'quote')
  const isFresh = cached && (Date.now() - new Date(cached.updated_at).getTime()) / 60000 < TTL.quote
  
  if (isFresh) return res.json({ success: true, quote: JSON.parse(cached.data), cached: true })
  
  try {
    const quote = await getQuote(ticker)
    await setCache(ticker, 'quote', quote)
    res.json({ success: true, quote })
  } catch (err) {
    if (cached) return res.json({ success: true, quote: JSON.parse(cached.data), cached: true, stale: true })
    console.error(`Quote error for ${ticker}:`, err.message)
    res.status(502).json({ success: false, error: err.message })
  }
})

router.get('/:ticker/chart', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const { range = '1y', interval = '1d' } = req.query
  const cacheKey = `${ticker}_${range}_${interval}`
  
  const cached = await getCacheRow(cacheKey, 'chart')
  const isFresh = cached && (Date.now() - new Date(cached.updated_at).getTime()) / 60000 < TTL.chart
  
  if (isFresh) return res.json({ success: true, bars: JSON.parse(cached.data), cached: true })
  
  try {
    const bars = await getChart(ticker, range, interval)
    await setCache(cacheKey, 'chart', bars)
    res.json({ success: true, bars })
  } catch (err) {
    if (cached) return res.json({ success: true, bars: JSON.parse(cached.data), cached: true, stale: true })
    console.error(`Chart error for ${ticker}:`, err.message)
    res.status(502).json({ success: false, error: err.message })
  }
})

router.get('/:ticker/fundamentals', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const cached = await getCacheRow(ticker, 'fundamentals')
  // Valid cache = not expired AND has real data (marketCap present = not a poison/error entry)
  const parsedCache = cached ? JSON.parse(cached.data) : null
  const isFresh = cached
    && (Date.now() - new Date(cached.updated_at).getTime()) / 60000 < TTL.fundamentals
    && parsedCache?.marketCap != null

  if (isFresh) return res.json({ success: true, fundamentals: parsedCache, cached: true })
  
  try {
    const fundamentals = await getFundamentals(ticker)
    await setCache(ticker, 'fundamentals', fundamentals)
    res.json({ success: true, fundamentals })
  } catch (err) {
    if (cached) return res.json({ success: true, fundamentals: JSON.parse(cached.data), cached: true, stale: true })
    res.status(502).json({ success: false, error: err.message })
  }
})

export default router
