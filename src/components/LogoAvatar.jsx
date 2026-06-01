import { useState } from 'react'

export default function LogoAvatar({ ticker, size = 36 }) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // A basic mapping for some popular tickers to domains for clearbit
  const domainMap = {
    'AAPL': 'apple.com',
    'MSFT': 'microsoft.com',
    'GOOGL': 'abc.xyz',
    'GOOG': 'abc.xyz',
    'AMZN': 'amazon.com',
    'NVDA': 'nvidia.com',
    'META': 'meta.com',
    'TSLA': 'tesla.com',
    'BRK.B': 'berkshirehathaway.com',
    'V': 'visa.com',
    'JNJ': 'jnj.com',
    'WMT': 'walmart.com',
    'JPM': 'jpmorganchase.com',
    'MA': 'mastercard.com',
    'PG': 'pg.com',
    'UNH': 'unitedhealthgroup.com',
    'DIS': 'thewaltdisneycompany.com',
    'HD': 'homedepot.com',
    'BAC': 'bankofamerica.com',
    'XOM': 'exxonmobil.com',
    'CVX': 'chevron.com',
    'KO': 'coca-colacompany.com',
    'PEP': 'pepsico.com',
    'COST': 'costco.com',
    'MCD': 'mcdonalds.com',
    'NKE': 'nike.com',
    'NFLX': 'netflix.com',
    'INTC': 'intel.com',
    'CSCO': 'cisco.com',
    'ADBE': 'adobe.com',
    'CRM': 'salesforce.com',
    'AMD': 'amd.com',
    'QCOM': 'qualcomm.com',
    'SBUX': 'starbucks.com',
    'IBM': 'ibm.com',
    'BA': 'boeing.com',
    'GE': 'ge.com',
    'F': 'ford.com',
    'GM': 'gm.com',
  }

  const domain = domainMap[ticker.toUpperCase()]
  const src = domain ? `https://logo.clearbit.com/${domain}` : null

  if (src && !error) {
    return (
      <div 
        className="shrink-0 bg-white flex items-center justify-center overflow-hidden" 
        style={{ width: size, height: size, borderRadius: '25%', border: '1px solid var(--border-color)' }}
      >
        <img 
          src={src} 
          alt={ticker} 
          className="w-full h-full object-contain"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.2s' }}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)} 
        />
      </div>
    )
  }

  // Fallback to text initials
  return (
    <div 
      className="shrink-0 flex items-center justify-center" 
      style={{ width: size, height: size, borderRadius: '25%', background: 'var(--primary-bg)' }}
    >
      <span className="font-extrabold" style={{ color: 'var(--primary)', fontSize: size * 0.35 }}>
        {ticker.slice(0, 2).toUpperCase()}
      </span>
    </div>
  )
}
