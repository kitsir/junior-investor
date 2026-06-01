import express from 'express'
import cors from 'cors'
import { initDb } from './db.js'
import stocksRouter from './routes/stocks.js'
import portfolioRouter from './routes/portfolio.js'
import investorsRouter from './routes/investors.js'
import authRouter from './routes/auth.js'
import ceoRouter from './routes/ceo.js'

const app = express()
const PORT = process.env.PORT || 3001
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`StockVision API listening → port ${PORT}`)
  initDb()
    .then(() => console.log('DB ready'))
    .catch(err => console.error('DB init error:', err))
})
