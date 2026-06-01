import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, StarOff, ExternalLink, PlusCircle, X, Check, Building2 } from 'lucide-react'
import { stocksApi, portfolioApi } from '../api/client.js'
import useStore from '../store/useStore.js'
import useAuth from '../store/useAuth.js'
import PriceChart from '../components/PriceChart.jsx'
import FundamentalsPanel from '../components/FundamentalsPanel.jsx'
import AnalysisPanel from '../components/AnalysisPanel.jsx'
import { fmt } from '../utils/formatters.js'
import { Skeleton } from '../components/MetricCard.jsx'
import { findSupportResistanceLevels, splitLevels } from '../utils/analysis.js'

const EXCHANGE_RATE_THB = 35.0

function QuickAddForm({ ticker, price, onClose, onAdded }) {
  const [mode, setMode] = useState('thb')          // 'thb' | 'shares'
  const [priceMode, setPriceMode] = useState('market') // 'market' | 'custom'
  const [inputValue, setInputValue] = useState('')
  const [customPrice, setCustomPrice] = useState(price > 0 ? price.toFixed(2) : '')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const effectivePrice = priceMode === 'market' ? price : (parseFloat(customPrice) || 0)

  let calculatedShares = 0
  let calculatedCostUSD = 0
  if (mode === 'thb') {
    const thbAmount = parseFloat(inputValue) || 0
    calculatedCostUSD = thbAmount / EXCHANGE_RATE_THB
    calculatedShares = effectivePrice > 0 ? calculatedCostUSD / effectivePrice : 0
  } else {
    calculatedShares = parseFloat(inputValue) || 0
    calculatedCostUSD = calculatedShares * effectivePrice
  }

  const unrealizedGain = priceMode === 'custom' && calculatedShares > 0 && price > 0
    ? calculatedShares * price - calculatedCostUSD : null
  const unrealizedPct = unrealizedGain != null && calculatedCostUSD > 0
    ? (unrealizedGain / calculatedCostUSD) * 100 : null

  const submit = async (e) => {
    e.preventDefault()
    if (calculatedShares <= 0 || effectivePrice <= 0) return
    setLoading(true)
    try {
      await portfolioApi.addPosition({ ticker, shares: calculatedShares, avg_cost: effectivePrice })
      setDone(true)
      setTimeout(onClose, 1500)
      onAdded?.()
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="absolute top-full right-0 mt-2 z-[200] bg-surface rounded-xl p-4 w-[340px] shadow-card-lg border border-color">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[14px] font-bold text-ink">เพิ่ม {ticker} เข้าพอร์ต</div>
        <button type="button" onClick={onClose} className="btn-icon w-6 h-6"><X size={14} /></button>
      </div>
      <div className="text-[12px] text-secondary mb-3">ราคาตลาด: <strong className="text-ink">{fmt.price(price)}</strong></div>

      {/* Amount mode */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--divider)', padding: 3, borderRadius: 7, marginBottom: 10 }}>
        {[['thb','เงินบาท'],['shares','จำนวนหุ้น']].map(([v, label]) => (
          <button key={v} type="button"
            onClick={() => { setMode(v); setInputValue('') }}
            className="btn-ghost flex-1 text-center"
            style={{ fontSize: 12, background: mode === v ? 'var(--bg-card)' : 'transparent', color: mode === v ? 'var(--text-ink)' : 'var(--text-secondary)' }}>
            {label}
          </button>
        ))}
      </div>

      <input
        className="input mb-2"
        type="number" step="any" min="0"
        placeholder={mode === 'thb' ? 'จำนวนเงิน (บาท)' : 'จำนวนหุ้น'}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        autoFocus
      />

      {/* Price mode */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>ราคาทุน:</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {[['market','ราคาตลาด'],['custom','กำหนดเอง']].map(([v, label]) => (
            <button key={v} type="button"
              onClick={() => { setPriceMode(v); if (v === 'custom') setCustomPrice(price.toFixed(2)) }}
              style={{ flex: 1, fontSize: 11, fontWeight: 600, padding: '4px 0', borderRadius: 6, cursor: 'pointer', background: priceMode === v ? 'var(--primary)' : 'var(--divider)', color: priceMode === v ? '#fff' : 'var(--text-secondary)', border: 'none' }}>
              {label}
            </button>
          ))}
        </div>
        {priceMode === 'custom' && (
          <input
            className="input"
            type="number" step="any" min="0.01"
            placeholder={price.toFixed(2)}
            value={customPrice}
            onChange={e => setCustomPrice(e.target.value)}
            style={{ fontSize: 13 }}
          />
        )}
      </div>

      {calculatedShares > 0 && effectivePrice > 0 && (
        <div style={{
          background: unrealizedGain != null ? (unrealizedGain >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)') : 'var(--primary-bg)',
          borderRadius: 9, padding: '10px 12px', marginBottom: 10, fontSize: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>ได้หุ้น</span>
            <strong style={{ color: 'var(--text-ink)' }}>{calculatedShares.toFixed(4)} หุ้น</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: unrealizedGain != null ? 4 : 0 }}>
            <span style={{ color: 'var(--text-secondary)' }}>ต้นทุนรวม</span>
            <strong style={{ color: 'var(--text-ink)' }}>{fmt.price(calculatedCostUSD)}</strong>
          </div>
          {unrealizedGain != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>กำไร/ขาดทุน</span>
              <strong style={{ color: unrealizedGain >= 0 ? 'var(--up)' : 'var(--down)' }}>
                {unrealizedGain >= 0 ? '+' : ''}{fmt.price(unrealizedGain)} ({unrealizedPct >= 0 ? '+' : ''}{unrealizedPct?.toFixed(1)}%)
              </strong>
            </div>
          )}
        </div>
      )}

      {done ? (
        <div className="flex items-center gap-1.5 text-[#10B981] text-[13px] font-semibold justify-center py-2">
          <Check size={16} /> เพิ่มเข้าพอร์ตแล้ว!
        </div>
      ) : (
        <button type="submit" disabled={loading || calculatedShares <= 0 || effectivePrice <= 0} className="btn-primary w-full justify-center">
          {loading ? 'กำลังเพิ่ม...' : 'เพิ่มเข้าพอร์ต'}
        </button>
      )}
    </form>
  )
}

function StockLogo({ name, website }) {
  const [error, setError] = useState(false)
  const [domain, setDomain] = useState('')

  useEffect(() => {
    if (website) {
      try {
        const url = new URL(website)
        setDomain(url.hostname.replace('www.', ''))
      } catch (e) {
        setDomain('')
      }
    }
  }, [website])

  if (!domain || error) {
    return (
      <div className="w-16 h-16 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.1)]">
        <Building2 size={28} className="text-tertiary" />
      </div>
    )
  }

  return (
    <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-card p-2">
      <img 
        src={`https://logo.clearbit.com/${domain}`} 
        alt={`${name} logo`} 
        className="max-w-full max-h-full object-contain"
        onError={() => setError(true)}
      />
    </div>
  )
}

export default function StockDetail() {
  const { ticker } = useParams()
  const navigate = useNavigate()
  const { chartRange, setChartRange } = useStore()
  const { user } = useAuth()
  const sym = ticker?.toUpperCase()

  const [quote, setQuote] = useState(null)
  const [bars, setBars] = useState([])
  const [fundamentals, setFundamentals] = useState(null)
  const [srLevels, setSrLevels] = useState([])
  const [loading, setLoading] = useState({ quote: true, chart: true, fundamentals: true })
  const [chartError, setChartError] = useState(null)
  const [tab, setTab] = useState(0)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (!sym) return
    setLoading({ quote: true, chart: true, fundamentals: true })
    setChartError(null)
    setQuote(null); setBars([]); setFundamentals(null); setSrLevels([])

    stocksApi.quote(sym)
      .then(d => setQuote(d.quote))
      .catch(() => {})
      .finally(() => setLoading(l => ({ ...l, quote: false })))

    // Fetch the specific user chart range for display
    stocksApi.chart(sym, chartRange)
      .then(d => {
        const b = d.bars || []
        setBars(b)
        if (!b.length) setChartError('ข้อมูลกราฟว่างเปล่าจาก server')
      })
      .catch(err => {
        setChartError('โหลดกราฟไม่ได้ — ลองรีเฟรชอีกครั้ง')
        console.error('Chart fetch error:', err)
      })
      .finally(() => setLoading(l => ({ ...l, chart: false })))

    // Fetch a background 2Y chart exclusively for consistent Support/Resistance levels
    stocksApi.chart(sym, '2y')
      .then(d => {
        const b = d.bars || []
        setSrLevels(findSupportResistanceLevels(b, { lookback: 10 }))
      })
      .catch(() => {})

    // Bypass cache once by appending a timestamp to force fresh fetch if it's broken
    stocksApi.fundamentals(sym)
      .then(d => setFundamentals(d.fundamentals))
      .catch(() => {})
      .finally(() => setLoading(l => ({ ...l, fundamentals: false })))

    portfolioApi.getWatchlist()
      .then(d => setInWatchlist((d.watchlist || []).some(w => w.ticker === sym)))
      .catch(() => {})
  }, [sym])

  const handleRangeChange = useCallback((range) => {
    setChartRange(range)
    setLoading(l => ({ ...l, chart: true }))
    setChartError(null)
    stocksApi.chart(sym, range)
      .then(d => {
        const b = d.bars || []
        setBars(b)
        if (!b.length) setChartError('ข้อมูลกราฟว่างเปล่าจาก server')
        // Do NOT recalculate SR levels here, keep the global ones!
      })
      .catch(() => setChartError('โหลดกราฟไม่ได้ — ลองรีเฟรชอีกครั้ง'))
      .finally(() => setLoading(l => ({ ...l, chart: false })))
  }, [sym])

  const toggleWatchlist = async () => {
    try {
      if (inWatchlist) { await portfolioApi.removeWatchlist(sym); setInWatchlist(false) }
      else { await portfolioApi.addWatchlist(sym); setInWatchlist(true) }
    } catch {}
  }

  // Compute chart-ready levels: filter ±20% proximity and reclassify by current price
  const chartLevels = useMemo(() => {
    if (!srLevels.length || !quote?.price) return []
    const { resistance, support } = splitLevels(srLevels, quote.price)
    return [
      ...resistance.map(l => ({ ...l, type: 'resistance' })),
      ...support.map(l => ({ ...l, type: 'support' })),
    ].sort((a, b) => b.price - a.price)
  }, [srLevels, quote])

  const up = (quote?.changePct ?? 0) >= 0
  const tabs = ['Overview', 'Fundamentals', 'About']

  return (
    <div className="max-w-[1280px] mx-auto py-7">

      {/* ── Hero header ─────────────────────────── */}
      <div className="mb-7">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3B82F6] hover:text-[#60A5FA] bg-transparent border-none cursor-pointer p-0 mb-5 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            {/* Logo */}
            {!loading.fundamentals && (
              <StockLogo name={fundamentals?.name || sym} website={fundamentals?.website} />
            )}

            <div>
              {/* Company name */}
              {loading.fundamentals ? (
                <Skeleton style={{ height: 16, width: 180, marginBottom: 6 }} />
              ) : (
                <div className="text-[14px] font-medium text-secondary mb-1">
                  {fundamentals?.name || sym}
                  {fundamentals?.sector && (
                    <span className="ml-2 text-[12px] text-tertiary">· {fundamentals.sector}</span>
                  )}
                </div>
              )}

              {/* Ticker + exchange */}
              <div className="flex items-baseline gap-2.5 mb-3">
                <span className="text-[32px] font-extrabold text-ink tracking-tight">
                  {sym}
                </span>
                {quote?.exchange && (
                  <span className="text-[11px] font-semibold text-secondary bg-[rgba(255,255,255,0.05)] px-2.5 py-0.5 rounded-full">
                    {quote.exchange}
                  </span>
                )}
              </div>

              {/* Price */}
              {loading.quote ? (
                <Skeleton style={{ height: 52, width: 220 }} />
              ) : (
                <>
                  <div className="flex items-baseline gap-3.5">
                    <span className="text-[48px] font-extrabold text-ink tracking-tighter font-num leading-none">
                      {fmt.price(quote?.price)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[20px] font-bold tracking-tight ${up ? 'text-up' : 'text-down'}`}>
                        {quote?.change >= 0 ? '+' : ''}{fmt.num(quote?.change, 2)}
                      </span>
                      <span className={`text-[14px] font-bold px-2.5 py-0.5 rounded-full ${up ? 'text-up bg-[rgba(16,185,129,0.15)]' : 'text-down bg-[rgba(239,68,68,0.15)]'}`}>
                        {up ? '+' : ''}{quote?.changePct?.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* OHLCV strip */}
                  <div className="flex gap-5 mt-3">
                    {[
                      ['Open',  quote?.open   ? fmt.price(quote.open)  : '—'],
                      ['High',  fmt.price(quote?.high)],
                      ['Low',   fmt.price(quote?.low)],
                      ['Vol',   quote?.volume ? `${(quote.volume/1e6).toFixed(1)}M` : '—'],
                      ['52W H', fmt.price(quote?.week52High)],
                      ['52W L', fmt.price(quote?.week52Low)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-[10px] font-semibold text-tertiary uppercase tracking-wider">{k}</div>
                        <div className="text-[13px] font-bold text-ink font-num">{v}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1 shrink-0 relative">
            <button
              onClick={toggleWatchlist}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors border-none cursor-pointer ${
                inWatchlist 
                  ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]' 
                  : 'bg-[rgba(255,255,255,0.05)] text-secondary hover:bg-[rgba(255,255,255,0.1)] hover:text-ink'
              }`}
            >
              {inWatchlist ? <StarOff size={14} /> : <Star size={14} />}
              {inWatchlist ? 'Watching' : 'Watch'}
            </button>

            {/* Add to portfolio — only when logged in */}
            {user && quote?.price > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAddForm(f => !f)}
                  className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px]"
                >
                  <PlusCircle size={14} /> เพิ่มเข้าพอร์ต
                </button>
                {showAddForm && (
                  <QuickAddForm
                    ticker={sym}
                    price={quote.price}
                    onClose={() => setShowAddForm(false)}
                  />
                )}
              </div>
            )}

            {fundamentals?.website && (
              <a
                href={fundamentals.website} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold bg-[rgba(255,255,255,0.05)] text-secondary hover:bg-[rgba(255,255,255,0.1)] hover:text-ink no-underline transition-colors"
              >
                <ExternalLink size={14} /> Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────── */}
      <div className="tab-bar mb-6">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={i === tab ? 'tab-active' : 'tab'}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ────────────────────────── */}
      {tab === 0 && (
        <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
          <div className="flex flex-col gap-4">
            <PriceChart
              bars={bars}
              levels={chartLevels}
              range={chartRange}
              onRangeChange={handleRangeChange}
              loading={loading.chart}
              error={chartError}
            />
            <AnalysisPanel
              bars={bars}
              fundamentals={fundamentals}
              quote={quote}
              loading={loading.chart || loading.fundamentals}
              srLevels={srLevels}
            />
          </div>
          <FundamentalsPanel fundamentals={fundamentals} loading={loading.fundamentals} />
        </div>
      )}

      {/* ── Tab: Fundamentals ─────────────────────── */}
      {tab === 1 && (
        <div className="max-w-[560px]">
          <FundamentalsPanel fundamentals={fundamentals} loading={loading.fundamentals} />
        </div>
      )}

      {/* ── Tab: About ──────────────────────────── */}
      {tab === 2 && (
        <div className="card max-w-[680px] p-6">
          {loading.fundamentals ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 14, width: '100%', marginBottom: 8 }} />)
          ) : fundamentals?.description ? (
            <>
              <h2 className="text-[17px] font-bold text-ink mb-3 tracking-tight">
                About {fundamentals.name || sym}
              </h2>
              <p className="text-[14px] text-secondary leading-relaxed mb-5">
                {fundamentals.description}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Sector', fundamentals.sector],
                  ['Industry', fundamentals.industry],
                  ['Country', fundamentals.country],
                  ['Employees', fundamentals.employees?.toLocaleString()],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[11px] text-tertiary uppercase tracking-wider mb-0.5">{k}</div>
                    <div className="text-[14px] font-semibold text-ink">{v}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-tertiary text-[14px]">No company information available.</p>
          )}
        </div>
      )}
    </div>
  )
}
