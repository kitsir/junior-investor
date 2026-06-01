import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { investorsApi, stocksApi } from '../api/client.js'
import { Skeleton } from '../components/MetricCard.jsx'
import { fmt } from '../utils/formatters.js'
import LogoAvatar from '../components/LogoAvatar.jsx'

function InvestorCard({ investor, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-4 transition-all cursor-pointer border ${
        active 
          ? 'bg-card border-primary shadow-card-lg' 
          : 'bg-transparent border-color hover:bg-surface'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ background: investor.color }}
        >
          <span className="text-[13px] font-extrabold text-white">{investor.avatar}</span>
        </div>
        <div>
          <div className="text-[14px] font-bold text-ink">{investor.name}</div>
          <div className="text-[12px] text-tertiary">{investor.firm}</div>
        </div>
        <div className="ml-auto text-[11px] font-semibold text-secondary px-2 py-0.5 rounded-full" style={{ background: 'var(--divider)' }}>
          {investor.aum}
        </div>
      </div>
      <div className="text-[11px] font-semibold text-tertiary">{investor.style}</div>
    </button>
  )
}

function HoldingRow({ holding, navigate, quote }) {
  const up = quote?.change >= 0
  const price = quote?.price || 0
  const change = quote?.change || 0
  const changePct = quote?.changePct || 0

  return (
    <div
      className="flex items-center gap-3 py-3 border-b cursor-pointer transition-opacity hover:opacity-70"
      style={{ borderBottomColor: 'var(--divider)' }}
      onClick={() => navigate(`/stock/${holding.ticker}`)}
    >
      <LogoAvatar ticker={holding.ticker} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold text-ink">{holding.ticker}</div>
        <div className="text-[12px] text-tertiary truncate">
          {holding.name}
        </div>
      </div>
      <div className="text-right flex-shrink-0 mr-4">
        <div className="text-[14px] font-bold text-ink">{holding.weight}%</div>
        <div className="text-[11px] text-tertiary">{holding.value}</div>
      </div>
      <div className="text-right flex-shrink-0 min-w-[80px]">
        {quote ? (
          <>
            <div className="text-[14px] font-num font-bold text-ink">${price.toFixed(2)}</div>
            <div className={`text-[12px] font-num font-semibold ${up ? 'text-up' : 'text-down'}`}>
              {up ? '+' : ''}{change.toFixed(2)} ({up ? '+' : ''}{changePct.toFixed(2)}%)
            </div>
          </>
        ) : (
          <Skeleton style={{ width: 60, height: 16, borderRadius: 4 }} />
        )}
      </div>
    </div>
  )
}

export default function InvestorsPage() {
  const navigate = useNavigate()
  const [investors, setInvestors] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quotes, setQuotes] = useState({})

  useEffect(() => {
    investorsApi.getAll()
      .then(d => {
        setInvestors(d.investors || [])
        if (d.investors?.length) setSelected(d.investors[0])
      })
      .finally(() => setLoading(false))
  }, [])

  // Fetch real-time quotes when an investor is selected
  useEffect(() => {
    if (!selected) return
    let mounted = true
    const fetchQuotes = async () => {
      const newQuotes = { ...quotes }
      const tickers = selected.holdings.map(h => h.ticker)
      
      const unfetched = tickers.filter(t => !newQuotes[t])
      if (!unfetched.length) return

      try {
        const results = await Promise.all(unfetched.map(t => stocksApi.quote(t).catch(() => null)))
        results.forEach(res => {
          if (res?.quote) newQuotes[res.quote.ticker] = res.quote
        })
        if (mounted) setQuotes(newQuotes)
      } catch (err) {}
    }
    fetchQuotes()
    return () => { mounted = false }
  }, [selected])

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto pt-7 grid grid-cols-[300px_1fr] gap-6">
        <div className="flex flex-col gap-3">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 80, borderRadius: 14 }} />)}
        </div>
        <Skeleton style={{ height: 500, borderRadius: 18 }} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-7">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink tracking-tight mb-1">
          Investor Portfolios
        </h1>
        <p className="text-[14px] text-tertiary">
          13F filing data · Q4 2024 · Live Market Prices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Left: investor list */}
        <div className="flex flex-col gap-2">
          {investors.map(inv => (
            <InvestorCard
              key={inv.id}
              investor={inv}
              active={selected?.id === inv.id}
              onClick={() => setSelected(inv)}
            />
          ))}
        </div>

        {/* Right: detail */}
        {selected && (
          <div className="card overflow-hidden border border-color">
            {/* Header */}
            <div 
              className="p-6 border-b"
              style={{ background: `linear-gradient(135deg, ${selected.color}15, transparent)`, borderBottomColor: 'var(--divider)' }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center shadow-md"
                  style={{ background: selected.color }}
                >
                  <span className="text-[18px] font-extrabold text-white">{selected.avatar}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-ink tracking-tight mb-0.5">
                    {selected.name}
                  </h2>
                  <div className="text-[14px] text-secondary mb-2">{selected.firm}</div>
                  <p className="text-[13px] text-tertiary leading-relaxed mb-3">{selected.bio}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span 
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ color: selected.color, background: `${selected.color}15` }}
                    >
                      {selected.style}
                    </span>
                    <span className="text-[11px] font-semibold text-secondary px-2.5 py-0.5 rounded-full" style={{ background: 'var(--divider)' }}>
                      AUM: {selected.aum}
                    </span>
                    <span className="text-[11px] font-semibold text-secondary px-2.5 py-0.5 rounded-full" style={{ background: 'var(--divider)' }}>
                      {selected.updated}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Holdings */}
            <div className="p-6">
              {/* Weight bars */}
              <div className="mb-6">
                <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wider mb-3">
                  Portfolio Weights
                </div>
                <div className="flex flex-col gap-2">
                  {selected.holdings.slice(0, 8).map(h => (
                    <div key={h.ticker} className="flex items-center gap-3">
                      <span
                        className="text-[11px] font-bold text-secondary w-10 shrink-0 cursor-pointer hover:text-ink transition-colors"
                        onClick={() => navigate(`/stock/${h.ticker}`)}
                      >
                        {h.ticker}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                        <div 
                          className="h-full rounded-full transition-all duration-500 opacity-80"
                          style={{ width: `${h.weight}%`, background: selected.color }} 
                        />
                      </div>
                      <span className="text-[11px] font-bold text-secondary w-9 text-right shrink-0">
                        {h.weight}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Holdings rows */}
              <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wider mb-3">
                Top Holdings · {selected.holdings.length} positions
              </div>
              {selected.holdings.map(h => (
                <HoldingRow 
                  key={h.ticker} 
                  holding={h} 
                  navigate={navigate} 
                  quote={quotes[h.ticker]} 
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <section className="mt-10 mb-4 animate-fade-in">
        <div className="card p-8 md:p-12 text-center bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-none shadow-2xl relative overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary opacity-20 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              ได้ไอเดียแล้วใช่ไหม?
            </h2>
            <p className="text-[15px] text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
              นำแรงบันดาลใจจากนักลงทุนระดับโลก มาสร้างพอร์ตการลงทุนในแบบของคุณเอง ติดตามและวัดผลกำไรขาดทุนได้แบบเรียลไทม์
            </p>
            <button
              onClick={() => navigate('/portfolio')}
              className="px-8 py-3.5 bg-white text-[#0F172A] hover:bg-slate-200 rounded-full font-bold text-[14px] transition-colors border-none cursor-pointer flex items-center justify-center gap-2 mx-auto"
            >
              เริ่มต้นสร้างพอร์ตของคุณ
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}
