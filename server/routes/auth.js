import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import pool from '../db.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ success: false, error: 'กรอกข้อมูลให้ครบ' })
  if (password.length < 6)
    return res.status(400).json({ success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว' })

  try {
    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.length) return res.status(409).json({ success: false, error: 'อีเมลนี้ถูกใช้แล้ว' })

    const hashed = await bcrypt.hash(password, 10)
    const id = randomUUID()
    const shareToken = randomUUID().replace(/-/g, '').slice(0, 16)

    await pool.query(
      'INSERT INTO users (id, name, email, password, share_token) VALUES ($1, $2, $3, $4, $5)',
      [id, name, email, hashed, shareToken]
    )

    const token = signToken({ id, email, name })
    res.json({ success: true, token, user: { id, name, email, shareToken } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ success: false, error: 'กรอก email และ password' })

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = rows[0]
    if (!user) return res.status(401).json({ success: false, error: 'ไม่พบบัญชีนี้' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ success: false, error: 'รหัสผ่านไม่ถูกต้อง' })

    const token = signToken({ id: user.id, email: user.email, name: user.name })
    res.json({
      success: true, token,
      user: { id: user.id, name: user.name, email: user.email, shareToken: user.share_token }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, share_token, is_public, theme_color, avatar_emoji FROM users WHERE id = $1',
      [req.user.id]
    )
    const user = rows[0]
    if (!user) return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้' })
    res.json({ success: true, user: { ...user, shareToken: user.share_token, themeColor: user.theme_color, avatarEmoji: user.avatar_emoji } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req, res) => {
  const { themeColor, avatarEmoji } = req.body
  try {
    await pool.query('UPDATE users SET theme_color = $1, avatar_emoji = $2 WHERE id = $3', [themeColor, avatarEmoji, req.user.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// PATCH /api/auth/public — toggle public portfolio
router.patch('/public', requireAuth, async (req, res) => {
  const { isPublic } = req.body
  try {
    await pool.query('UPDATE users SET is_public = $1 WHERE id = $2', [!!isPublic, req.user.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
