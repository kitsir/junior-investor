import { useState, useEffect } from 'react'
import { stocksApi } from '../api/client.js'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AMD']

export default function TickerTape() {
  const [quotes, setQuotes] = useState([])

  useEffect(() => {
    let mounted = true
    const fetchQuotes = async () => {
      try {
        const results = await Promise.all(
          DEFAULT_TICKERS.map(t => stocksApi.quote(t).catch(() => null))
        )
        if (mounted) {
          setQuotes(results.filter(Boolean).map(r => r.quote))
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchQuotes()
    const int = setInterval(fetchQuotes, 60000) // update every minute
    return () => { mounted = false; clearInterval(int) }
  }, [])

  if (quotes.length === 0) return null

  // Duplicate for seamless marquee effect
  const displayQuotes = [...quotes, ...quotes, ...quotes, ...quotes]

  return (
    <div className="w-full bg-surface border-b overflow-hidden h-[36px] flex items-center" style={{ borderBottomColor: 'var(--divider)' }}>
      <div className="flex animate-marquee whitespace-nowrap">
        {displayQuotes.map((q, i) => (
          <div key={`${q.ticker}-${i}`} className="flex items-center gap-3 px-6">
            <span className="text-[13px] font-bold text-ink">{q.ticker}</span>
            <span className="text-[13px] font-num text-ink">${q.price?.toFixed(2) || '---'}</span>
            <span className={`text-[13px] font-num font-medium ${q.change >= 0 ? 'text-up' : 'text-down'}`}>
              {q.change > 0 ? '+' : ''}{q.change?.toFixed(2)} ({q.changePct > 0 ? '+' : ''}{q.changePct?.toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  )
}
