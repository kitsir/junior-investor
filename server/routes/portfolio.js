import { Router } from 'express'
import pool from '../db.js'
import { optionalAuth } from '../middleware/auth.js'
import { getQuoteSimple } from '../yahoo.js'

const router = Router()

async function enrichWithPrices(positions) {
  const tickers = [...new Set(positions.map(p => p.ticker))]
  const quotes = await Promise.allSettled(tickers.map(t => getQuoteSimple(t)))
  const priceMap = {}
  quotes.forEach((r, i) => {
    if (r.status === 'fulfilled') priceMap[tickers[i]] = r.value || 0
  })
  let totalCost = 0, totalValue = 0
  const enriched = positions.map(p => {
    const price = priceMap[p.ticker] || 0
    const cost = p.shares * p.avg_cost
    const value = p.shares * price
    totalCost += cost
    totalValue += value
    return { ...p, price, cost, value, gain: value - cost, gainPct: cost > 0 ? ((value - cost) / cost) * 100 : 0 }
  })
  return { enriched, totalCost, totalValue }
}

// --- Watchlist ---
router.get('/watchlist', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM watchlist ORDER BY added_at DESC')
    res.json({ success: true, watchlist: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/watchlist', async (req, res) => {
  const { ticker } = req.body
  if (!ticker) return res.status(400).json({ success: false, error: 'ticker required' })
  try {
    await pool.query('INSERT INTO watchlist (ticker) VALUES ($1) ON CONFLICT DO NOTHING', [ticker.toUpperCase()])
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.delete('/watchlist/:ticker', async (req, res) => {
  try {
    await pool.query('DELETE FROM watchlist WHERE ticker = $1', [req.params.ticker.toUpperCase()])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// --- Positions (user-scoped) ---
router.get('/positions', optionalAuth, async (req, res) => {
  const userId = req.user?.id || null
  try {
    const rows = userId
      ? (await pool.query('SELECT * FROM positions WHERE user_id = $1 ORDER BY added_at DESC', [userId])).rows
      : []
    res.json({ success: true, positions: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/positions', optionalAuth, async (req, res) => {
  const { ticker, shares, avg_cost, note } = req.body
  if (!ticker || !shares || !avg_cost)
    return res.status(400).json({ success: false, error: 'ticker, shares, avg_cost required' })
  const userId = req.user?.id || null
  try {
    const { rows } = await pool.query(
      'INSERT INTO positions (ticker, shares, avg_cost, note, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [ticker.toUpperCase(), shares, avg_cost, note || null, userId]
    )
    res.json({ success: true, id: rows[0].id })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/positions/:id', async (req, res) => {
  const { shares, avg_cost, note } = req.body
  try {
    await pool.query('UPDATE positions SET shares = $1, avg_cost = $2, note = $3 WHERE id = $4',
      [shares, avg_cost, note, req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/positions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM positions WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// --- Notes ---
router.get('/notes/:ticker', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notes WHERE ticker = $1 ORDER BY created_at DESC',
      [req.params.ticker.toUpperCase()]
    )
    res.json({ success: true, notes: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/notes', async (req, res) => {
  const { ticker, content } = req.body
  if (!ticker || !content) return res.status(400).json({ success: false, error: 'ticker and content required' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO notes (ticker, content) VALUES ($1, $2) RETURNING id',
      [ticker.toUpperCase(), content]
    )
    res.json({ success: true, id: rows[0].id })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/notes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/portfolio/community
router.get('/community', async (req, res) => {
  try {
    const { rows: users } = await pool.query(
      'SELECT id, name, share_token, theme_color, avatar_emoji FROM users WHERE is_public = TRUE ORDER BY created_at DESC'
    )

    const result = []
    for (const user of users) {
      const { rows: positions } = await pool.query(
        'SELECT ticker, shares, avg_cost FROM positions WHERE user_id = $1',
        [user.id]
      )
      if (!positions.length) continue
      result.push({
        userId: user.id,
        name: user.name,
        shareToken: user.share_token,
        themeColor: user.theme_color || '#3B82F6',
        avatarEmoji: user.avatar_emoji || '🧑‍💻',
        positions
      })
    }
    res.json({ success: true, portfolios: result })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/portfolio/share/:token
router.get('/share/:token', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, theme_color, avatar_emoji FROM users WHERE share_token = $1',
      [req.params.token]
    )
    const user = rows[0]
    if (!user) return res.status(404).json({ success: false, error: 'ไม่พบพอร์ตนี้' })

    const { rows: positions } = await pool.query(
      'SELECT ticker, shares, avg_cost, note FROM positions WHERE user_id = $1',
      [user.id]
    )

    const { enriched, totalCost, totalValue } = await enrichWithPrices(positions)
    enriched.sort((a, b) => b.value - a.value)
    enriched.forEach(p => { p.weight = totalValue > 0 ? (p.value / totalValue) * 100 : 0 })

    res.json({
      success: true,
      owner: user.name,
      themeColor: user.theme_color || '#3B82F6',
      avatarEmoji: user.avatar_emoji || '🧑‍💻',
      portfolio: {
        positions: enriched,
        totalCost,
        totalValue,
        totalGain: totalValue - totalCost,
        totalGainPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      }
    })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message })
  }
})

export default router
