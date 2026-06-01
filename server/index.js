import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import stocksRouter from './routes/stocks.js'
import portfolioRouter from './routes/portfolio.js'
import investorsRouter from './routes/investors.js'
import authRouter from './routes/auth.js'
import ceoRouter from './routes/ceo.js'

const app = express()
const PORT = 3001
const FRONTEND_URL = process.env.FRONTEND_URL || ''

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    const allowed = [
      'http://localhost:5173',
      'http://localhost:4173',
      ...(FRONTEND_URL ? [FRONTEND_URL] : []),
    ]
    if (allowed.includes(origin) || /\.vercel\.app$/.test(origin)) return cb(null, true)
    cb(new Error('CORS: ' + origin))
  }
}))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/stocks', stocksRouter)
app.use('/api/portfolio', portfolioRouter)
app.use('/api/investors', investorsRouter)
app.use('/api/ceo', ceoRouter)

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.get('/api/test-yahoo', async (req, res) => {
  try {
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1d', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', 'Accept': 'application/json', 'Accept-Language': 'en-US,en;q=0.9' }
    })
    const text = await r.text()
    res.json({ status: r.status, ok: r.ok, body: text.slice(0, 200) })
  } catch (e) {
    res.json({ error: e.message, cause: String(e.cause || '') })
  }
})

app.listen(PORT, () => {
  console.log(`StockVision API listening → port ${PORT}`)
  initDb()
    .then(() => console.log('DB ready'))
    .catch(err => console.error('DB init error:', err))
})
