// Direct Yahoo Finance fetch — bypasses yahoo-finance2 library
// Handles cookie + crumb auth required by Yahoo Finance API

const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
}

let _cookie = null
let _crumb = null
let _cookieExpiry = 0

async function getCookieAndCrumb() {
  if (_crumb && Date.now() < _cookieExpiry) return { cookie: _cookie, crumb: _crumb }

  // Step 1: get cookie
  const r1 = await fetch('https://finance.yahoo.com', { headers: BASE_HEADERS })
  const cookies = r1.headers.getSetCookie?.() || []
  _cookie = cookies.map(c => c.split(';')[0]).join('; ')

  // Step 2: get crumb
  const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
    headers: { ...BASE_HEADERS, Cookie: _cookie }
  })
  _crumb = await r2.text()
  _cookieExpiry = Date.now() + 30 * 60 * 1000 // 30 min

  return { cookie: _cookie, crumb: _crumb }
}

async function yfFetch(url) {
  const { cookie, crumb } = await getCookieAndCrumb()
  const sep = url.includes('?') ? '&' : '?'
  const res = await fetch(`${url}${sep}crumb=${encodeURIComponent(crumb)}`, {
    headers: { ...BASE_HEADERS, Cookie: cookie }
  })
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status}: ${url}`)
  return res.json()
}

export async function getQuote(ticker) {
  const data = await yfFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d&includePrePost=false`)
  const r = data.chart.result[0]
  const meta = r.meta
  return {
    ticker: meta.symbol,
    name: meta.longName || meta.shortName || ticker,
    price: meta.regularMarketPrice,
    open: meta.regularMarketDayHigh, // approximation
    high: meta.regularMarketDayHigh,
    low: meta.regularMarketDayLow,
    prevClose: meta.previousClose || meta.chartPreviousClose,
    volume: meta.regularMarketVolume,
    change: meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose),
    changePct: ((meta.regularMarketPrice - (meta.previousClose || meta.chartPreviousClose)) / (meta.previousClose || meta.chartPreviousClose)) * 100,
    week52High: meta.fiftyTwoWeekHigh,
    week52Low: meta.fiftyTwoWeekLow,
    currency: meta.currency,
    exchange: meta.exchangeName,
    marketCap: null,
    trailingPE: null,
    eps: null,
  }
}

export async function getChart(ticker, range = '1y', interval = '1d') {
  const RANGE_TO_DAYS = { '1mo': 31, '3mo': 92, '6mo': 183, '1y': 365, '2y': 730, '5y': 1825 }
  const days = RANGE_TO_DAYS[range] || 365
  const period1 = Math.floor((Date.now() - days * 86400000) / 1000)
  const period2 = Math.floor(Date.now() / 1000)
  const data = await yfFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&period1=${period1}&period2=${period2}&includePrePost=false`)
  const r = data.chart.result[0]
  const times = r.timestamp || []
  const ohlcv = r.indicators.quote[0]
  return times.map((t, i) => ({
    time: t,
    open: ohlcv.open[i],
    high: ohlcv.high[i],
    low: ohlcv.low[i],
    close: ohlcv.close[i],
    volume: ohlcv.volume[i] || 0,
  })).filter(b => b.open && b.high && b.low && b.close)
}

export async function getFundamentals(ticker) {
  const modules = ['summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile']
  const data = await yfFetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=${modules.join(',')}`)
  const r = data.quoteSummary.result[0]
  const fd = r.financialData || {}
  const ks = r.defaultKeyStatistics || {}
  const sd = r.summaryDetail || {}
  const ap = r.assetProfile || {}
  const chartData = await yfFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`)
  const meta = chartData.chart.result[0].meta
  return {
    ticker, name: meta.longName || meta.shortName || ticker,
    sector: ap.sector, industry: ap.industry, description: ap.longBusinessSummary?.slice(0, 600),
    employees: ap.fullTimeEmployees, website: ap.website, country: ap.country,
    marketCap: meta.marketCap, trailingPE: ks.trailingPE?.raw || sd.trailingPE?.raw,
    forwardPE: ks.forwardPE?.raw || sd.forwardPE?.raw, priceToBook: ks.priceToBook?.raw,
    priceToSales: ks.priceToSalesTrailing12Months?.raw, enterpriseToEbitda: ks.enterpriseToEbitda?.raw,
    pegRatio: ks.pegRatio?.raw, profitMargins: fd.profitMargins?.raw || ks.profitMargins?.raw,
    grossMargins: fd.grossMargins?.raw, operatingMargins: fd.operatingMargins?.raw,
    returnOnEquity: fd.returnOnEquity?.raw, returnOnAssets: fd.returnOnAssets?.raw,
    revenueGrowth: fd.revenueGrowth?.raw, earningsGrowth: fd.earningsGrowth?.raw,
    eps: ks.trailingEps?.raw, forwardEps: ks.forwardEps?.raw,
    totalRevenue: fd.totalRevenue?.raw, ebitda: fd.ebitda?.raw,
    debtToEquity: fd.debtToEquity?.raw, currentRatio: fd.currentRatio?.raw,
    totalCash: fd.totalCash?.raw, totalDebt: fd.totalDebt?.raw, bookValue: ks.bookValue?.raw,
    freeCashflow: fd.freeCashflow?.raw, operatingCashflow: fd.operatingCashflow?.raw,
    dividendRate: sd.dividendRate?.raw, dividendYield: sd.dividendYield?.raw,
    beta: sd.beta?.raw, sharesOutstanding: ks.sharesOutstanding?.raw,
    targetMeanPrice: fd.targetMeanPrice?.raw, analystRating: fd.recommendationKey,
    numberOfAnalysts: fd.numberOfAnalystOpinions?.raw,
  }
}

export async function search(q) {
  const data = await yfFetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=0&quotesCount=8`)
  return (data.quotes || [])
    .filter(q => q.quoteType === 'EQUITY')
    .map(q => ({ ticker: q.symbol, name: q.shortname || q.longname, exchange: q.exchDisp }))
}

export async function getQuoteSimple(ticker) {
  // Lightweight price fetch for portfolio enrichment
  const data = await yfFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`)
  return data.chart.result[0].meta.regularMarketPrice || 0
}
