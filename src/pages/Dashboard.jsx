import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Plus, Star, Building2, Briefcase } from 'lucide-react'
import { stocksApi, portfolioApi } from '../api/client.js'
import useStore from '../store/useStore.js'
import useAuth from '../store/useAuth.js'
import { fmt } from '../utils/formatters.js'

const INDICES = [
  { ticker: 'SPY', label: 'S&P 500' },
  { ticker: 'QQQ', label: 'Nasdaq' },
  { ticker: 'DIA', label: 'Dow Jones' },
  { ticker: 'IWM', label: 'Russell 2000' },
  { ticker: 'GLD', label: 'Gold' },
]

const DEFAULT_WATCHLIST = [
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'TSLA', 'AVGO',
  'ARM', 'AMD',
  'BRK-B', 'JPM', 'V',
  'LLY', 'UNH',
  'PLTR', 'COIN', 'NET',
  'VOO', 'QQQM',
]

function IndexChip({ ticker, label }) {
  const [quote, setQuote] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    stocksApi.quote(ticker).then(d => setQuote(d.quote)).catch(() => {})
  }, [ticker])

  if (!quote) {
    return <div className="h-[72px] rounded-xl animate-pulse" style={{ background: 'var(--divider)' }} />
  }

  const up = quote.changePct >= 0

  return (
    <button
      onClick={() => navigate(`/stock/${ticker}`)}
      className="card-sm w-full text-left p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-card-md cursor-pointer border-none"
    >
      <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-[17px] font-bold text-ink tracking-tight font-num">
        {fmt.price(quote.price)}
      </div>
      <div className={`text-[12px] font-semibold mt-0.5 ${up ? 'text-up' : 'text-down'}`}>
        {up ? '▲' : '▼'} {Math.abs(quote.changePct).toFixed(2)}%
      </div>
    </button>
  )
}

function WatchRow({ ticker, onRemove }) {
  const [quote, setQuote] = useState(null)
  const [logoError, setLogoError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    stocksApi.quote(ticker).then(d => setQuote(d.quote)).catch(() => {})
  }, [ticker])

  const up = (quote?.changePct ?? 0) >= 0

  return (
    <div
      className="flex items-center gap-4 py-3 border-b cursor-pointer transition-opacity hover:opacity-70"
      style={{ borderBottomColor: 'var(--divider)' }}
      onClick={() => navigate(`/stock/${ticker}`)}
    >
      {/* Avatar (Logo from Clearbit) */}
      {!logoError ? (
        <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-white flex items-center justify-center p-1.5 shadow-sm border border-color">
          <img 
            src={`https://logo.clearbit.com/${ticker.toLowerCase()}.com`} 
            alt={ticker}
            className="max-w-full max-h-full object-contain"
            onError={() => setLogoError(true)}
          />
        </div>
      ) : (
        <div 
          className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center border border-color"
          style={{ background: 'var(--primary-bg)' }}
        >
          <Building2 size={18} className="text-primary opacity-60" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[15px] text-ink">{ticker}</div>
        {!quote ? (
          <div className="h-3 w-20 rounded animate-pulse mt-1" style={{ background: 'var(--divider)' }} />
        ) : (
          <div className="text-[12px] text-tertiary truncate max-w-[120px] sm:max-w-none">{quote.name || quote.exchange || 'NASDAQ'}</div>
        )}
      </div>

      {/* Price + change */}
      {!quote ? (
        <div className="text-right">
          <div className="h-4 w-16 rounded animate-pulse mb-1" style={{ background: 'var(--divider)' }} />
          <div className="h-3 w-11 rounded animate-pulse ml-auto" style={{ background: 'var(--border-color)' }} />
        </div>
      ) : (
        <div className="text-right">
          <div className="text-[16px] font-bold text-ink font-num tracking-tight">
            {fmt.price(quote.price)}
          </div>
          <div className={`inline-block text-[12px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${up ? 'text-up bg-up-bg' : 'text-down bg-down-bg'}`}
            style={{ background: up ? 'var(--up-bg)' : 'var(--down-bg)' }}>
            {up ? '+' : ''}{quote.changePct?.toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  )
}

// ─── User Portfolio strip ────────────────────────────────────────────────────
function MyPortfolioStrip() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const loadPositions = async () => {
      try {
        const d = await portfolioApi.getPositions()
        const raw = d.positions || []
        if (!raw.length) {
          setData({ positions: [], totalValue: 0, totalGainPct: 0 })
          return
        }

        const tickers = [...new Set(raw.map(p => p.ticker))]
        const quotes = await Promise.allSettled(tickers.map(t => stocksApi.quote(t)))
        const priceMap = {}
        quotes.forEach((r, i) => {
          if (r.status === 'fulfilled') priceMap[tickers[i]] = r.value.quote?.price || 0
        })

        const groups = {}
        for (const p of raw) {
          if (!groups[p.ticker]) {
            groups[p.ticker] = { ticker: p.ticker, totalShares: 0, totalCost: 0 }
          }
          groups[p.ticker].totalShares += p.shares
          groups[p.ticker].totalCost += (p.shares * p.avg_cost)
        }

        const enriched = Object.values(groups).map(g => {
          const price = priceMap[g.ticker] || 0
          const currentValue = g.totalShares * price
          const gain = currentValue - g.totalCost
          const gainPct = g.totalCost > 0 ? (gain / g.totalCost) * 100 : 0
          return { ...g, price, currentValue, gain, gainPct }
        })
        
        enriched.sort((a, b) => b.currentValue - a.currentValue)
        
        const totalCost = enriched.reduce((s, p) => s + p.totalCost, 0)
        const totalValue = enriched.reduce((s, p) => s + p.currentValue, 0)
        const totalGain = totalValue - totalCost
        const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

        setData({
          positions: enriched,
          totalValue,
          totalGainPct
        })
      } catch (err) {
        setData({ positions: [], totalValue: 0, totalGainPct: 0 })
      } finally {
        setLoading(false)
      }
    }

    loadPositions()
  }, [user])

  if (loading) {
    return (
      <section className="mb-7">
        <div className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--divider)' }} />
      </section>
    )
  }

  // Not logged in or empty portfolio
  if (!user || !data || data.positions.length === 0) {
    return (
      <section className="mb-7">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-primary" />
            <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">
              My Portfolio
            </span>
          </div>
        </div>
        <div className="card p-5 flex items-center justify-between bg-primary-bg border border-primary/20">
          <div>
            <div className="text-[15px] font-bold text-primary mb-1">เริ่มสร้างพอร์ตการลงทุนของคุณ</div>
            <div className="text-[13px] text-secondary">ติดตามมูลค่าหุ้นที่คุณถือและกำไรขาดทุนแบบเรียลไทม์</div>
          </div>
          <button onClick={() => navigate('/portfolio')} className="btn-primary">
            Create Portfolio
          </button>
        </div>
      </section>
    )
  }

  const up = (data.totalGainPct ?? 0) >= 0

  return (
    <section className="mb-7">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-primary" />
          <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">
            My Portfolio
          </span>
        </div>
        <div className={`text-[13px] font-bold ${up ? 'text-up' : 'text-down'}`}>
          {up ? '+' : ''}{data.totalGainPct.toFixed(2)}% · {fmt.price(data.totalValue)}
        </div>
      </div>

      <div className="card p-3.5 overflow-x-auto relative">
        <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: 'var(--primary-bg)', opacity: 0.3 }} />
        <div className="flex gap-2 min-w-max relative z-10">
          {data.positions.map(pos => {
            const posUp = pos.gain >= 0
            return (
              <button
                key={pos.ticker}
                onClick={() => navigate(`/stock/${pos.ticker}`)}
                className="px-4 py-2.5 rounded-xl cursor-pointer text-left transition-transform hover:-translate-y-0.5"
                style={{
                  background: posUp ? 'var(--up-bg)' : 'var(--down-bg)',
                  border: `1px solid ${posUp ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                }}
              >
                <div className="text-[13px] font-extrabold text-ink mb-0.5">{pos.ticker}</div>
                <div className={`text-[14px] font-bold ${posUp ? 'text-up' : 'text-down'}`}>
                  {posUp ? '+' : ''}{pos.gainPct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-tertiary mt-1">
                  {fmt.price(pos.price)}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { watchlist, setWatchlist } = useStore()
  const { user } = useAuth()
  const [loaded, setLoaded] = useState(false)
  
  const [adding, setAdding] = useState(false)
  const [addTicker, setAddTicker] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    portfolioApi.getWatchlist()
      .then(d => {
        const list = d.watchlist?.map(w => w.ticker) || []
        setWatchlist(list.length ? list : DEFAULT_WATCHLIST)
      })
      .catch(() => setWatchlist(DEFAULT_WATCHLIST))
      .finally(() => setLoaded(true))
  }, [])

  const addToWatchlist = async () => {
    const t = addTicker.trim().toUpperCase()
    if (!t) return
    if (watchlist.includes(t)) {
      setAddTicker('')
      setAdding(false)
      return
    }
    
    setAddLoading(true)
    setAddError('')
    try {
      // Validate ticker exists by fetching its quote first
      const quoteData = await stocksApi.quote(t)
      if (!quoteData || !quoteData.quote || !quoteData.quote.price) {
        throw new Error('Ticker not found')
      }
      
      // If it exists, add to DB and local state
      await portfolioApi.addWatchlist(t).catch(() => {})
      setWatchlist([...watchlist, t])
      setAddTicker('')
      setAdding(false)
    } catch (err) {
      setAddError('ไม่พบหุ้นนี้ในระบบ')
    } finally {
      setAddLoading(false)
    }
  }

  const removeFromWatchlist = async (ticker) => {
    try { await portfolioApi.removeWatchlist(ticker) } catch {}
    setWatchlist(watchlist.filter(t => t !== ticker))
  }

  return (
    <div className="max-w-[1200px] mx-auto py-7">

      <MyPortfolioStrip />

      {/* Indices row */}
      <section className="mb-8">
        <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wider mb-3">
          Markets
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {INDICES.map(({ ticker, label }) => (
            <IndexChip key={ticker} ticker={ticker} label={label} />
          ))}
        </div>
      </section>

      {/* Main two-col */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">

        {/* Watchlist */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[22px] font-bold text-ink tracking-tight">Watchlist</div>
              <div className="text-[13px] text-tertiary mt-0.5">{watchlist.length} stocks · 15-min delayed</div>
            </div>
            <button
              onClick={() => { setAdding(!adding); setAddError('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-colors"
              style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={13} /> Add
            </button>
          </div>

          {adding && (
            <div className="mb-4 bg-surface p-3 rounded-xl border border-color">
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="input flex-1 font-bold text-[14px]"
                  placeholder="e.g. AAPL, NVDA"
                  value={addTicker}
                  onChange={e => { setAddTicker(e.target.value.toUpperCase()); setAddError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') addToWatchlist(); if (e.key === 'Escape') setAdding(false) }}
                  disabled={addLoading}
                />
                <button className="btn-primary shrink-0" onClick={addToWatchlist} disabled={addLoading || !addTicker}>
                  {addLoading ? 'Checking...' : 'Add'}
                </button>
                <button className="btn-ghost shrink-0" onClick={() => { setAdding(false); setAddError('') }} disabled={addLoading}>
                  Cancel
                </button>
              </div>
              {addError && <div className="text-[12px] text-down mt-2 font-semibold ml-1">{addError}</div>}
              <div className="text-[11px] text-tertiary mt-2 ml-1">Type a valid US ticker symbol to add.</div>
            </div>
          )}

          {!loaded ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-[60px] rounded-lg mb-2 animate-pulse" style={{ background: 'var(--divider)' }} />
            ))
          ) : (
            watchlist.map(ticker => (
              <WatchRow
                key={ticker}
                ticker={ticker}
                onRemove={removeFromWatchlist}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">

          {/* Investor spotlight */}
          <div className="card p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)] opacity-5 rounded-bl-[100px] pointer-events-none" />
            <div className="text-[13px] font-semibold text-tertiary uppercase tracking-wider mb-3.5 relative z-10">
              Top Investors
            </div>
            <div className="flex flex-col relative z-10">
              {[
                { id: 'buffett', name: 'W. Buffett', sub: 'Berkshire · Value', color: '#3B82F6' },
                { id: 'cathie',  name: 'C. Wood',   sub: 'ARK · Growth',    color: '#8B5CF6' },
                { id: 'ackman',  name: 'B. Ackman',  sub: 'Pershing · Concentrated', color: '#10B981' },
                { id: 'dalio',   name: 'R. Dalio',   sub: 'Bridgewater · Macro', color: '#F59E0B' },
                { id: 'burry',   name: 'M. Burry',   sub: 'Scion · Contrarian', color: '#EF4444' },
              ].map(inv => (
                <button
                  key={inv.id}
                  onClick={() => navigate('/investors')}
                  className="w-full flex items-center gap-3 py-2.5 border-b text-left bg-transparent cursor-pointer transition-opacity hover:opacity-65 border-none"
                  style={{ borderBottom: '1px solid var(--divider)' }}
                >
                  <div 
                    className="w-[32px] h-[32px] rounded-full flex shrink-0 items-center justify-center"
                    style={{ background: inv.color }}
                  >
                    <span className="text-[11px] font-extrabold text-white">
                      {inv.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-ink">{inv.name}</div>
                    <div className="text-[12px] text-secondary">{inv.sub}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/investors')}
              className="btn-primary w-full justify-center mt-4 relative z-10"
            >
              View all portfolios
            </button>
          </div>

        </div>
      </div>

      {/* CTA Box */}
      <section className="mt-10 mb-8 animate-fade-in">
        <div className="card p-8 md:p-12 text-center bg-gradient-to-br from-[#0F172A] to-[#1E293B] border-none shadow-2xl relative overflow-hidden transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#10B981] opacity-20 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
              วางแผนการลงทุนเพื่ออนาคต
            </h2>
            <p className="text-[15px] text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
              ลองใช้เครื่องมือจำลองการลงทุนแบบ DCA ของเราเพื่อดูว่า เงินหลักพันสามารถเติบโตเป็นหลักล้านได้อย่างไร ด้วยพลังของดอกเบี้ยทบต้น
            </p>
            <button
              onClick={() => navigate('/dca-calculator')}
              className="px-8 py-3.5 bg-primary hover:bg-blue-600 text-white rounded-full font-bold text-[14px] transition-colors border-none cursor-pointer flex items-center justify-center gap-2 mx-auto"
            >
              เปิดหน้าคำนวณ DCA <TrendingUp size={16} />
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}
