import { Router } from 'express'
import YahooFinance from 'yahoo-finance2'
import pool from '../db.js'

const yahooFinance = new YahooFinance()
const router = Router()

const CACHE_TTL_MIN = 15

function isCacheValid(updatedAt) {
  return (Date.now() - new Date(updatedAt).getTime()) / 60000 < CACHE_TTL_MIN
}

async function getCache(key, type) {
  const { rows } = await pool.query(
    'SELECT data, updated_at FROM cache WHERE ticker = $1 AND type = $2',
    [key, type]
  )
  const row = rows[0]
  if (row && isCacheValid(row.updated_at)) return JSON.parse(row.data)
  return null
}

async function setCache(key, type, data) {
  await pool.query(`
    INSERT INTO cache (ticker, type, data, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (ticker, type) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
  `, [key, type, JSON.stringify(data)])
}

// GET /api/stocks/search?q=apple
router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q) return res.json({ success: true, results: [] })
  try {
    const data = await yahooFinance.search(q, { newsCount: 0, quotesCount: 8 })
    const results = (data.quotes || [])
      .filter(q => q.quoteType === 'EQUITY')
      .map(q => ({ ticker: q.symbol, name: q.shortname || q.longname, exchange: q.exchDisp }))
    res.json({ success: true, results })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message })
  }
})

// GET /api/stocks/:ticker/quote
router.get('/:ticker/quote', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  try {
    const data = await yahooFinance.quote(ticker)
    const quote = {
      ticker: data.symbol,
      name: data.longName || data.shortName,
      price: data.regularMarketPrice,
      open: data.regularMarketOpen,
      high: data.regularMarketDayHigh,
      low: data.regularMarketDayLow,
      prevClose: data.regularMarketPreviousClose,
      volume: data.regularMarketVolume,
      change: data.regularMarketChange,
      changePct: data.regularMarketChangePercent,
      week52High: data.fiftyTwoWeekHigh,
      week52Low: data.fiftyTwoWeekLow,
      currency: data.currency,
      exchange: data.fullExchangeName || data.exchange,
      marketCap: data.marketCap,
      trailingPE: data.trailingPE,
      eps: data.epsTrailingTwelveMonths,
    }
    res.json({ success: true, quote })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message })
  }
})

const RANGE_TO_DAYS = { '1mo': 31, '3mo': 92, '6mo': 183, '1y': 365, '2y': 730, '5y': 1825 }

// GET /api/stocks/:ticker/chart?range=1y&interval=1d
router.get('/:ticker/chart', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()
  const { range = '1y', interval = '1d' } = req.query
  const cacheKey = `${ticker}_${range}_${interval}`

  const cached = await getCache(cacheKey, 'chart')
  if (cached) return res.json({ success: true, bars: cached, cached: true })

  const days = RANGE_TO_DAYS[range] || 365
  const period1 = new Date(Date.now() - days * 86400000)
  const period2 = new Date()

  try {
    const data = await yahooFinance.chart(ticker, { period1, period2, interval, includePrePost: false })
    const quotes = data.quotes || []
    const bars = quotes
      .filter(q => q.open && q.high && q.low && q.close)
      .map(q => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume || 0,
      }))

    await setCache(cacheKey, 'chart', bars)
    res.json({ success: true, bars })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message })
  }
})

// GET /api/stocks/:ticker/fundamentals
router.get('/:ticker/fundamentals', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase()

  const cached = await getCache(ticker, 'fundamentals')
  if (cached) return res.json({ success: true, fundamentals: cached, cached: true })

  try {
    const [summary, quote] = await Promise.all([
      yahooFinance.quoteSummary(ticker, {
        modules: [
          'summaryDetail',
          'defaultKeyStatistics',
          'financialData',
          'assetProfile',
          'incomeStatementHistory',
        ],
      }),
      yahooFinance.quote(ticker),
    ])

    const fd = summary.financialData || {}
    const ks = summary.defaultKeyStatistics || {}
    const sd = summary.summaryDetail || {}
    const ap = summary.assetProfile || {}

    const fundamentals = {
      ticker,
      name: quote.longName || quote.shortName || ticker,
      sector: ap.sector,
      industry: ap.industry,
      description: ap.longBusinessSummary?.slice(0, 600),
      employees: ap.fullTimeEmployees,
      website: ap.website,
      country: ap.country,

      marketCap: quote.marketCap,
      trailingPE: ks.trailingPE || sd.trailingPE,
      forwardPE: ks.forwardPE || sd.forwardPE,
      priceToBook: ks.priceToBook,
      priceToSales: ks.priceToSalesTrailing12Months,
      enterpriseToEbitda: ks.enterpriseToEbitda,
      enterpriseToRevenue: ks.enterpriseToRevenue,
      pegRatio: ks.pegRatio,

      profitMargins: fd.profitMargins || ks.profitMargins,
      grossMargins: fd.grossMargins,
      operatingMargins: fd.operatingMargins,
      ebitdaMargins: fd.ebitdaMargins,
      returnOnEquity: fd.returnOnEquity,
      returnOnAssets: fd.returnOnAssets,

      revenueGrowth: fd.revenueGrowth,
      earningsGrowth: fd.earningsGrowth,
      earningsQuarterlyGrowth: ks.earningsQuarterlyGrowth,

      eps: ks.trailingEps || quote.epsTrailingTwelveMonths,
      forwardEps: ks.forwardEps || quote.epsForward,
      totalRevenue: fd.totalRevenue,
      ebitda: fd.ebitda,

      debtToEquity: fd.debtToEquity,
      currentRatio: fd.currentRatio,
      quickRatio: fd.quickRatio,
      totalCash: fd.totalCash,
      totalDebt: fd.totalDebt,
      bookValue: ks.bookValue,

      freeCashflow: fd.freeCashflow,
      operatingCashflow: fd.operatingCashflow,

      dividendRate: sd.dividendRate,
      dividendYield: sd.dividendYield,
      payoutRatio: sd.payoutRatio,

      beta: sd.beta,
      sharesOutstanding: ks.sharesOutstanding,
      shortRatio: ks.shortRatio,
      heldPercentInstitutions: ks.heldPercentInstitutions,
      heldPercentInsiders: ks.heldPercentInsiders,

      targetMeanPrice: fd.targetMeanPrice,
      targetHighPrice: fd.targetHighPrice,
      targetLowPrice: fd.targetLowPrice,
      analystRating: fd.recommendationKey,
      numberOfAnalysts: fd.numberOfAnalystOpinions,
    }

    await setCache(ticker, 'fundamentals', fundamentals)
    res.json({ success: true, fundamentals })
  } catch (err) {
    res.status(502).json({ success: false, error: err.message })
  }
})

export default router
