import { Router } from 'express'
import pool from '../db.js'
import { getQuote, getChart, getFundamentals, search } from '../yahoo.js'

const router = Router()
const CACHE_TTL_MIN = 15

function isCacheValid(updatedAt) {
  return (Date.now() - new Date(updatedAt).getTime()) / 60000 < CACHE_TTL_MIN
}

async function getCache(key, type) {
  const { rows } = await pool.query(
    'SELECT data, updated_at FROM cache WHERE ticker = $1 AND type = $2', [key, type]
  )
  const row = rows[0]
  if (row && isCacheValid(row.updated_at)) return JSON.parse(row.data)
  return null
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
  try {
    const quote = await getQuote(ticker)
    res.json({ success: true, quote })
  } catch (err) {
    console.error(`Quote error for ${ticker}:`, err.message)
    res.status(502).json({ success: false, error: err.message })
  }
})

router.get('/:ticker/chart', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const { range = '1y', interval = '1d' } = req.query
  const cacheKey = `${ticker}_${range}_${interval}`
  const cached = await getCache(cacheKey, 'chart')
  if (cached) return res.json({ success: true, bars: cached, cached: true })
  try {
    const bars = await getChart(ticker, range, interval)
    await setCache(cacheKey, 'chart', bars)
    res.json({ success: true, bars })
  } catch (err) {
    console.error(`Chart error for ${ticker}:`, err.message)
    res.status(502).json({ success: false, error: err.message })
  }
})

router.get('/:ticker/fundamentals', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const cached = await getCache(ticker, 'fundamentals')
  if (cached) return res.json({ success: true, fundamentals: cached, cached: true })
  try {
    const fundamentals = await getFundamentals(ticker)
    await setCache(ticker, 'fundamentals', fundamentals)
    res.json({ success: true, fundamentals })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message })
  }
})

export default router
