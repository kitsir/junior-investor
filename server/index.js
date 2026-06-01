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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(FRONTEND_URL ? [FRONTEND_URL] : []),
]

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/stocks', stocksRouter)
app.use('/api/portfolio', portfolioRouter)
app.use('/api/investors', investorsRouter)
app.use('/api/ceo', ceoRouter)

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

initDb()
  .then(() => app.listen(PORT, () => console.log(`StockVision API ready → port ${PORT}`)))
  .catch(err => { console.error('DB init failed:', err); process.exit(1) })
