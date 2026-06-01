// Direct Yahoo Finance fetch — no cookie/crumb needed for v8 chart endpoints
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function yf(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`Yahoo ${res.status} ${url.split('?')[0]}`)
  return res.json()
}

export async function getQuote(ticker) {
  const data = await yf(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d&includePrePost=false`)
  const meta = data.chart.result[0].meta
  const prev = meta.previousClose || meta.chartPreviousClose || meta.regularMarketPrice
  return {
    ticker: meta.symbol,
    name: meta.longName || meta.shortName || ticker,
    price: meta.regularMarketPrice,
    open: meta.regularMarketOpen || meta.regularMarketPrice,
    high: meta.regularMarketDayHigh,
    low: meta.regularMarketDayLow,
    prevClose: prev,
    volume: meta.regularMarketVolume,
    change: meta.regularMarketPrice - prev,
    changePct: ((meta.regularMarketPrice - prev) / prev) * 100,
    week52High: meta.fiftyTwoWeekHigh,
    week52Low: meta.fiftyTwoWeekLow,
    currency: meta.currency,
    exchange: meta.fullExchangeName || meta.exchangeName,
    marketCap: null,
    trailingPE: null,
    eps: null,
  }
}

export async function getChart(ticker, range = '1y', interval = '1d') {
  const RANGE_TO_DAYS = { '1mo': 31, '3mo': 92, '6mo': 183, '1y': 365, '2y': 730, '5y': 1825 }
  const days = RANGE_TO_DAYS[range] || 365
  const p1 = Math.floor((Date.now() - days * 86400000) / 1000)
  const p2 = Math.floor(Date.now() / 1000)
  const data = await yf(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&period1=${p1}&period2=${p2}&includePrePost=false`)
  const r = data.chart.result[0]
  const times = r.timestamp || []
  const q = r.indicators.quote[0]
  return times.map((t, i) => ({
    time: t, open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i], volume: q.volume[i] || 0,
  })).filter(b => b.open && b.close)
}

export async function getFundamentals(ticker) {
  // Try quoteSummary v11 (newer, often works without crumb)
  try {
    const modules = 'summaryDetail,defaultKeyStatistics,financialData,assetProfile'
    const data = await yf(`https://query2.finance.yahoo.com/v11/finance/quoteSummary/${ticker}?modules=${modules}&corsDomain=finance.yahoo.com`)
    const r = data.quoteSummary.result[0]
    const fd = r.financialData || {}
    const ks = r.defaultKeyStatistics || {}
    const sd = r.summaryDetail || {}
    const ap = r.assetProfile || {}
    const quote = await getQuote(ticker)
    return buildFundamentals(ticker, quote.name, ap, fd, ks, sd)
  } catch {
    // Fallback: return just quote data
    const quote = await getQuote(ticker)
    return { ticker, name: quote.name, marketCap: null }
  }
}

function buildFundamentals(ticker, name, ap, fd, ks, sd) {
  const v = (x) => (typeof x === 'object' && x !== null) ? (x.raw ?? x) : x
  return {
    ticker, name, sector: ap.sector, industry: ap.industry,
    description: ap.longBusinessSummary?.slice(0, 600),
    employees: ap.fullTimeEmployees, website: ap.website, country: ap.country,
    trailingPE: v(ks.trailingPE) || v(sd.trailingPE),
    forwardPE: v(ks.forwardPE) || v(sd.forwardPE),
    priceToBook: v(ks.priceToBook), priceToSales: v(ks.priceToSalesTrailing12Months),
    enterpriseToEbitda: v(ks.enterpriseToEbitda), pegRatio: v(ks.pegRatio),
    profitMargins: v(fd.profitMargins) || v(ks.profitMargins),
    grossMargins: v(fd.grossMargins), operatingMargins: v(fd.operatingMargins),
    returnOnEquity: v(fd.returnOnEquity), returnOnAssets: v(fd.returnOnAssets),
    revenueGrowth: v(fd.revenueGrowth), earningsGrowth: v(fd.earningsGrowth),
    eps: v(ks.trailingEps), forwardEps: v(ks.forwardEps),
    totalRevenue: v(fd.totalRevenue), ebitda: v(fd.ebitda),
    debtToEquity: v(fd.debtToEquity), currentRatio: v(fd.currentRatio),
    totalCash: v(fd.totalCash), totalDebt: v(fd.totalDebt), bookValue: v(ks.bookValue),
    freeCashflow: v(fd.freeCashflow), operatingCashflow: v(fd.operatingCashflow),
    dividendRate: v(sd.dividendRate), dividendYield: v(sd.dividendYield),
    beta: v(sd.beta), sharesOutstanding: v(ks.sharesOutstanding),
    targetMeanPrice: v(fd.targetMeanPrice), analystRating: fd.recommendationKey,
    numberOfAnalysts: v(fd.numberOfAnalystOpinions),
  }
}

export async function search(q) {
  const data = await yf(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=0&quotesCount=8`)
  return (data.quotes || [])
    .filter(r => r.quoteType === 'EQUITY')
    .map(r => ({ ticker: r.symbol, name: r.shortname || r.longname, exchange: r.exchDisp }))
}

export async function getQuoteSimple(ticker) {
  const data = await yf(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`)
  return data.chart.result[0].meta.regularMarketPrice || 0
}
