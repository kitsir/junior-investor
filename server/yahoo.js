import YahooFinanceClass from 'yahoo-finance2'
const yahooFinance = new YahooFinanceClass()

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
  try {
    const columns = [
      'name', 'description', 'market_cap_basic', 'price_earnings_ttm',
      'price_book_ratio', 'price_sales_current', 'enterprise_value_ebitda_ttm',
      'gross_margin', 'net_margin_ttm', 'return_on_equity', 'return_on_assets',
      'total_revenue', 'revenue_growth_yoy', 'earnings_per_share_basic_ttm',
      'total_debt', 'cash_n_short_term_invest', 'current_ratio', 'debt_to_equity',
      'dividend_yield_recent', 'beta_1_year', 'total_shares_outstanding',
      'number_of_employees', 'sector', 'industry', 'operating_margin', 
      'earnings_per_share_forecast_next_fy'
    ]
    
    // Some tickers from Yahoo like PTT.BK need to be stripped of .BK or mapped
    // But TradingView can usually find them by their short name.
    const cleanTicker = ticker.split('.')[0]
    
    const body = {
      filter: [{ left: 'name', operation: 'equal', right: cleanTicker }],
      sort: { sortBy: 'average_volume_10d_calc', sortOrder: 'desc' },
      columns: columns
    }

    const res = await fetch('https://scanner.tradingview.com/global/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!res.ok) throw new Error('TV API Error')
    const json = await res.json()
    if (!json.data || json.data.length === 0) throw new Error('Not found in TV')
    
    const d = json.data[0].d
    const v = (val, isPct = false) => (val != null && val !== '') ? (isPct ? val / 100 : val) : null
    
    let forwardEps = v(d[25]);
    let forwardPE = null;
    let quotePrice = null;
    try {
        const quote = await getQuote(ticker);
        quotePrice = quote.price;
        if (quotePrice && forwardEps) {
            forwardPE = quotePrice / forwardEps;
        }
    } catch(e) {}

    return {
      ticker: ticker,
      name: d[1] || ticker,
      sector: d[22],
      industry: d[23],
      description: 'Data provided by TradingView Scanner API.', // We don't have full business description from TV
      marketCap: v(d[2]),
      trailingPE: v(d[3]),
      forwardPE: forwardPE,
      priceToBook: v(d[4]),
      priceToSales: v(d[5]),
      enterpriseToEbitda: v(d[6]),
      pegRatio: null, // TV Scanner doesn't expose PEG directly for free
      grossMargins: v(d[7], true),
      profitMargins: v(d[8], true),
      operatingMargins: v(d[24], true),
      returnOnEquity: v(d[9], true),
      returnOnAssets: v(d[10], true),
      totalRevenue: v(d[11]),
      revenueGrowth: v(d[12], true),
      earningsGrowth: null, // TV doesn't reliably expose this
      eps: v(d[13]),
      forwardEps: forwardEps,
      ebitda: null,
      totalDebt: v(d[14]),
      currentRatio: v(d[16]),
      totalCash: v(d[15]),
      debtToEquity: v(d[17]),
      bookValue: null,
      freeCashflow: null,
      operatingCashflow: null,
      dividendRate: null,
      dividendYield: v(d[18], true),
      beta: v(d[19]),
      sharesOutstanding: v(d[20]),
      targetMeanPrice: null,
      analystRating: null,
      numberOfAnalysts: null,
      employees: v(d[21])
    }
  } catch (err) {
    console.error(`TV Fundamentals error for ${ticker}:`, err.message)
    return { ticker, name: ticker, marketCap: null, description: `Error fetching fundamentals: ${err.message}` }
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
