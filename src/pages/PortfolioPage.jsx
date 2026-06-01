import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Search, LogIn, Share2, Eye, EyeOff, ChevronDown, ChevronRight, Activity, TrendingDown, X } from 'lucide-react'
import { portfolioApi, stocksApi, authApi } from '../api/client.js'
import useAuth from '../store/useAuth.js'
import AuthModal from '../components/AuthModal.jsx'
import { fmt } from '../utils/formatters.js'
import { Skeleton } from '../components/MetricCard.jsx'
import LogoAvatar from '../components/LogoAvatar.jsx'

const EXCHANGE_RATE_THB = 35.0

function TickerSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!query.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const data = await stocksApi.search(query)
        setResults(data.results || [])
        setOpen(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 250)
  }, [query])

  const pick = async (r) => {
    setQuery(r.name || r.ticker)
    setOpen(false)
    setLoading(true)
    try {
      const data = await stocksApi.quote(r.ticker)
      onSelect({ ticker: r.ticker, name: r.name, price: data.quote?.price || 0 })
    } catch {
      onSelect({ ticker: r.ticker, name: r.name, price: 0 })
    }
    finally { setLoading(false) }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
        <input
          className="input"
          style={{ paddingLeft: 30, fontSize: 14 }}
          placeholder="ค้นหาหุ้น... เช่น Nvidia, Apple, AAPL"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          autoFocus
        />
        {loading && (
          <div style={{
            position: 'absolute', right: 10,
            width: 12, height: 12,
            border: '2px solid var(--primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }} />
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-card)', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}>
          {results.map((r, i) => (
            <button
              key={r.ticker}
              onClick={() => pick(r)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid var(--divider)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--divider)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-ink)', width: 52, flexShrink: 0 }}>{r.ticker}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>{r.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AddForm({ onAdd, onCancel }) {
  const [step, setStep] = useState('search') // 'search' | 'confirm'
  const [selected, setSelected] = useState(null)
  const [mode, setMode] = useState('thb')       // 'thb' | 'shares'
  const [priceMode, setPriceMode] = useState('market') // 'market' | 'custom'
  const [inputValue, setInputValue] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSelect = (stock) => {
    setSelected(stock)
    setInputValue('')
    setCustomPrice(stock.price > 0 ? stock.price.toFixed(2) : '')
    setStep('confirm')
  }

  const marketPrice = selected?.price || 0
  const effectivePrice = priceMode === 'market'
    ? marketPrice
    : (parseFloat(customPrice) || 0)

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

  // P&L preview when using custom price
  const currentValue = calculatedShares * marketPrice
  const unrealizedGain = priceMode === 'custom' && calculatedShares > 0 && marketPrice > 0
    ? currentValue - calculatedCostUSD : null
  const unrealizedGainPct = unrealizedGain != null && calculatedCostUSD > 0
    ? (unrealizedGain / calculatedCostUSD) * 100 : null

  const submit = async (e) => {
    e.preventDefault()
    if (!selected || calculatedShares <= 0 || effectivePrice <= 0) return
    setLoading(true)
    try {
      await onAdd({
        ticker: selected.ticker,
        shares: calculatedShares,
        avg_cost: effectivePrice,
      })
    } finally { setLoading(false) }
  }

  if (step === 'search') {
    return (
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-ink)', marginBottom: 14 }}>เพิ่มหุ้นเข้าพอร์ต</div>
        <TickerSearch onSelect={handleSelect} />
        <button onClick={onCancel} className="btn-ghost" style={{ marginTop: 12, fontSize: 13 }}>ยกเลิก</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: '20px 22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--divider)' }}>
        <LogoAvatar ticker={selected.ticker} size={42} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-ink)' }}>{selected.ticker}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selected.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>ราคาตลาดตอนนี้</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-ink)' }}>{fmt.price(marketPrice)}</div>
        </div>
        <button type="button" onClick={() => setStep('search')} className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>
          เปลี่ยนหุ้น
        </button>
      </div>

      {/* Amount mode toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--divider)', padding: 4, borderRadius: 8, marginBottom: 16, width: 'fit-content' }}>
        {[['thb','เพิ่มด้วยเงิน (บาท)'],['shares','ระบุจำนวนหุ้น']].map(([v, label]) => (
          <button key={v} type="button"
            onClick={() => { setMode(v); setInputValue('') }}
            className="btn-ghost"
            style={{ background: mode === v ? 'var(--bg-card)' : 'transparent', border: mode === v ? '1px solid var(--border-color)' : 'none', color: mode === v ? 'var(--text-ink)' : 'var(--text-secondary)', padding: '6px 12px' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        {/* Amount / shares */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            {mode === 'thb' ? 'จำนวนเงินที่ลงทุน (บาท) *' : 'จำนวนหุ้น *'}
          </label>
          <input
            className="input"
            type="number" step="any" min="0"
            placeholder={mode === 'thb' ? 'เช่น 10,000' : 'เช่น 10, 0.5'}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            autoFocus required
          />
        </div>

        {/* Price — market or custom */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            ราคาทุนต่อหุ้น (USD) *
          </label>
          {/* Toggle */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            {[['market',`ราคาตลาด`],['custom','กำหนดเอง (ย้อนหลัง)']].map(([v, label]) => (
              <button key={v} type="button"
                onClick={() => { setPriceMode(v); if (v === 'custom') setCustomPrice(marketPrice.toFixed(2)) }}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, cursor: 'pointer',
                  background: priceMode === v ? 'var(--primary)' : 'var(--divider)',
                  color: priceMode === v ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                }}>
                {label}
              </button>
            ))}
          </div>
          {priceMode === 'market' ? (
            <div style={{ display: 'flex', alignItems: 'center', height: 38, padding: '0 12px', background: 'var(--divider)', borderRadius: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-ink)' }}>
              {fmt.price(marketPrice)}
            </div>
          ) : (
            <input
              className="input"
              type="number" step="any" min="0.01"
              placeholder={`เช่น ${marketPrice.toFixed(2)}`}
              value={customPrice}
              onChange={e => setCustomPrice(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Preview */}
      {calculatedShares > 0 && effectivePrice > 0 && (
        <div style={{
          background: unrealizedGain != null
            ? (unrealizedGain >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)')
            : 'var(--primary-bg)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          display: 'grid', gridTemplateColumns: unrealizedGain != null ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>จำนวนหุ้น</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-ink)' }}>{calculatedShares.toFixed(6)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>ต้นทุนรวม</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-ink)' }}>{fmt.price(calculatedCostUSD)}</div>
          </div>
          {unrealizedGain != null && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>กำไร/ขาดทุนปัจจุบัน</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: unrealizedGain >= 0 ? 'var(--up)' : 'var(--down)' }}>
                {unrealizedGain >= 0 ? '+' : ''}{fmt.price(unrealizedGain)}
                <span style={{ fontSize: 11, marginLeft: 4 }}>
                  ({unrealizedGainPct >= 0 ? '+' : ''}{unrealizedGainPct?.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading || calculatedShares <= 0 || effectivePrice <= 0} className="btn-primary">
          {loading ? 'กำลังเพิ่ม...' : 'เพิ่มเข้าพอร์ต'}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">ยกเลิก</button>
      </div>
    </form>
  )
}

// ─── Batch Import Modal ────────────────────────────────────────────────────────
function BatchImportModal({ onClose, onImported }) {
  const emptyRow = () => ({ id: Date.now() + Math.random(), ticker: '', shares: '', price: '', name: '', marketPrice: null, loading: false })
  const [rows, setRows] = useState([emptyRow()])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const updateRow = (id, patch) =>
    setRows(r => r.map(row => row.id === id ? { ...row, ...patch } : row))

  const fetchQuote = async (id, ticker) => {
    if (!ticker.trim()) return
    const sym = ticker.trim().toUpperCase()
    updateRow(id, { loading: true, ticker: sym })
    try {
      const data = await stocksApi.quote(sym)
      const q = data.quote
      updateRow(id, {
        name: q.name || sym,
        marketPrice: q.price,
        price: '', // let user fill in their own cost
        loading: false,
      })
    } catch {
      updateRow(id, { loading: false, name: 'ไม่พบข้อมูล' })
    }
  }

  const addRow = () => setRows(r => [...r, emptyRow()])
  const removeRow = (id) => setRows(r => r.length > 1 ? r.filter(x => x.id !== id) : r)

  const validRows = rows.filter(r =>
    r.ticker.trim() && parseFloat(r.shares) > 0 && parseFloat(r.price) > 0
  )

  const totalCost = validRows.reduce((s, r) =>
    s + parseFloat(r.shares) * parseFloat(r.price), 0)

  const submit = async () => {
    if (!validRows.length) return
    setSubmitting(true)
    try {
      for (const row of validRows) {
        await portfolioApi.addPosition({
          ticker: row.ticker.toUpperCase(),
          shares: parseFloat(row.shares),
          avg_cost: parseFloat(row.price),
        })
      }
      setDone(true)
      setTimeout(() => { onImported(); onClose() }, 1200)
    } catch (e) {
      console.error('Import error', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ padding: '24px', width: 700, maxWidth: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-ink)', margin: 0, letterSpacing: '-0.025em' }}>
              📋 นำเข้าพอร์ต (Clone)
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.5 }}>
              ใส่หุ้นพร้อม<strong>ราคาทุนจริงที่คุณซื้อ</strong> ระบบจะคำนวณ P&amp;L เทียบกับราคาตลาดปัจจุบัน
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ height: 1, background: 'var(--divider)', margin: '16px 0', flexShrink: 0 }} />

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 120px 36px', gap: 8, padding: '0 4px', marginBottom: 8, flexShrink: 0 }}>
          {['Ticker', 'ชื่อบริษัท (ราคาตลาด)', 'จำนวนหุ้น', 'ราคาทุน/หุ้น', ''].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>

        {/* Rows — scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2 }}>
          {rows.map((row, idx) => (
            <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 120px 36px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              {/* Ticker */}
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  value={row.ticker}
                  onChange={e => updateRow(row.id, { ticker: e.target.value.toUpperCase() })}
                  onBlur={e => { if (e.target.value.trim()) fetchQuote(row.id, e.target.value) }}
                  placeholder="AAPL"
                  style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}
                  autoFocus={idx === 0}
                />
                {row.loading && (
                  <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                )}
              </div>

              {/* Name + market price hint */}
              <div style={{ overflow: 'hidden' }}>
                {row.name ? (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                    {row.marketPrice && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ตลาด: {fmt.price(row.marketPrice)}</div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    {row.ticker ? 'กด Tab เพื่อดึงข้อมูล' : '—'}
                  </div>
                )}
              </div>

              {/* Shares */}
              <input
                className="input"
                type="number" step="any" min="0"
                value={row.shares}
                onChange={e => updateRow(row.id, { shares: e.target.value })}
                placeholder="เช่น 10"
                style={{ fontSize: 13 }}
              />

              {/* Cost price */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 13, pointerEvents: 'none' }}>$</span>
                <input
                  className="input"
                  type="number" step="any" min="0"
                  value={row.price}
                  onChange={e => updateRow(row.id, { price: e.target.value })}
                  placeholder={row.marketPrice ? row.marketPrice.toFixed(2) : '0.00'}
                  style={{ fontSize: 13, paddingLeft: 22 }}
                />
              </div>

              {/* Remove */}
              <button
                onClick={() => removeRow(row.id)}
                style={{ background: 'none', border: 'none', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', color: rows.length === 1 ? 'var(--border-color)' : 'var(--text-tertiary)', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}
                onMouseEnter={e => { if (rows.length > 1) e.currentTarget.style.color = 'var(--down)' }}
                onMouseLeave={e => e.currentTarget.style.color = rows.length === 1 ? 'var(--border-color)' : 'var(--text-tertiary)'}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Add row button */}
          <button
            onClick={addRow}
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', padding: '9px', borderRadius: 8, border: '1.5px dashed var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <Plus size={14} /> เพิ่มแถว
          </button>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {validRows.length > 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-ink)' }}>{validRows.length}</span> รายการ · ต้นทุนรวม{' '}
                <span style={{ fontWeight: 700, color: 'var(--text-ink)' }}>{fmt.price(totalCost)}</span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>กรอก Ticker, จำนวนหุ้น และราคาทุนให้ครบทุกช่อง</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} className="btn-ghost">ยกเลิก</button>
            {done ? (
              <button className="btn-primary" style={{ background: 'var(--up)', cursor: 'default' }}>
                ✓ นำเข้าสำเร็จ!
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting || validRows.length === 0}
                className="btn-primary"
                style={{ opacity: submitting || !validRows.length ? 0.6 : 1 }}
              >
                {submitting ? 'กำลังนำเข้า...' : `นำเข้า ${validRows.length || ''} รายการ`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SellModal({ group, onClose, onSold }) {
  const [shares, setShares] = useState(group.totalShares.toFixed(6))
  const [sellPrice, setSellPrice] = useState(group.price.toFixed(2))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sharesToSell = parseFloat(shares) || 0
  const price = parseFloat(sellPrice) || 0
  const proceeds = sharesToSell * price
  const avgCost = group.totalCost / group.totalShares
  const realizedGain = (price - avgCost) * sharesToSell
  const realizedGainPct = avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : 0
  const up = realizedGain >= 0

  const handleSell = async () => {
    if (sharesToSell <= 0 || sharesToSell > group.totalShares + 0.0001) {
      setError('จำนวนหุ้นไม่ถูกต้อง')
      return
    }
    setLoading(true)
    setError('')
    try {
      // FIFO: delete/reduce oldest lots first
      const sorted = [...group.lots].sort((a, b) => new Date(a.added_at) - new Date(b.added_at))
      let remaining = sharesToSell
      for (const lot of sorted) {
        if (remaining <= 0) break
        if (lot.shares <= remaining + 0.000001) {
          await portfolioApi.deletePosition(lot.id)
          remaining -= lot.shares
        } else {
          await portfolioApi.updatePosition(lot.id, {
            shares: lot.shares - remaining,
            avg_cost: lot.avg_cost,
            note: lot.note,
          })
          remaining = 0
        }
      }
      onSold()
      onClose()
    } catch (e) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ padding: '24px', width: 420, maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--divider)' }}>
          <LogoAvatar ticker={group.ticker} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-ink)' }}>{group.ticker}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ถือ {group.totalShares.toFixed(4)} หุ้น · ราคาตลาด {fmt.price(group.price)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>จำนวนหุ้นที่ขาย</label>
            <input
              className="input"
              type="number"
              step="any"
              min="0"
              max={group.totalShares}
              value={shares}
              onChange={e => setShares(e.target.value)}
              autoFocus
            />
            <button
              onClick={() => setShares(group.totalShares.toFixed(6))}
              style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' }}
            >
              ขายทั้งหมด
            </button>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>ราคาขายต่อหุ้น (USD)</label>
            <input
              className="input"
              type="number"
              step="any"
              min="0"
              value={sellPrice}
              onChange={e => setSellPrice(e.target.value)}
            />
          </div>
        </div>

        {sharesToSell > 0 && price > 0 && (
          <div style={{ background: up ? 'var(--up-bg)' : 'var(--down-bg)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: up ? 'var(--up)' : 'var(--down)', marginBottom: 2 }}>รับเงินคืน</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: up ? 'var(--up)' : 'var(--down)' }}>{fmt.price(proceeds)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: up ? 'var(--up)' : 'var(--down)', marginBottom: 2 }}>กำไร/ขาดทุนที่รับรู้</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: up ? 'var(--up)' : 'var(--down)' }}>
                  {up ? '+' : ''}{fmt.price(realizedGain)} ({up ? '+' : ''}{realizedGainPct.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <div style={{ fontSize: 13, color: 'var(--down)', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSell}
            disabled={loading || sharesToSell <= 0}
            style={{
              flex: 1, padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: 14,
              background: 'var(--down)', color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer',
              opacity: loading || sharesToSell <= 0 ? 0.6 : 1,
            }}
          >
            {loading ? 'กำลังดำเนินการ...' : `ยืนยันขาย ${sharesToSell > 0 ? sharesToSell.toFixed(4) : ''} หุ้น`}
          </button>
          <button onClick={onClose} className="btn-ghost">ยกเลิก</button>
        </div>
      </div>
    </div>
  )
}

function GroupedPositionRow({ group, totalValue, onDelete, onSold }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [showSell, setShowSell] = useState(false)
  const { ticker, name, price, totalShares, totalCost, currentValue, gain, gainPct, lots } = group
  const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0
  const hasPrice = price > 0
  const up = gain >= 0

  return (
    <>
      {showSell && (
        <SellModal
          group={group}
          onClose={() => setShowSell(false)}
          onSold={onSold}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--divider)', background: expanded ? 'var(--divider)' : 'transparent', transition: 'background 0.2s', paddingLeft: expanded ? 8 : 0, paddingRight: expanded ? 8 : 0, borderRadius: expanded ? 8 : 0 }}>
        {/* Expand Toggle */}
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: 4 }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Avatar */}
        <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/stock/${ticker}`)}>
          <LogoAvatar ticker={ticker} size={40} />
        </div>

        {/* Ticker + shares */}
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/stock/${ticker}`)}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-ink)' }}>{ticker}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {Number(totalShares).toFixed(4)} หุ้น · {lots.length} รายการ
          </div>
        </div>

        {/* Weight bar */}
        <div style={{ width: 60, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>{weight.toFixed(1)}%</div>
          <div style={{ height: 4, background: 'var(--border-color)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(weight * 3, 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: 99 }} />
          </div>
        </div>

        {/* Cost */}
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>ต้นทุนเฉลี่ย</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-ink)' }}>{fmt.price(totalCost/totalShares)}</div>
        </div>

        {/* Current value */}
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>มูลค่า</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-ink)' }}>
            {hasPrice ? fmt.price(currentValue) : <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>กำลังโหลด...</span>}
          </div>
        </div>

        {/* P&L */}
        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
          {hasPrice ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: up ? 'var(--up)' : 'var(--down)' }}>
                {up ? '+' : ''}{fmt.price(gain)}
              </div>
              <div style={{
                display: 'inline-block', fontSize: 11, fontWeight: 700,
                padding: '1px 7px', borderRadius: 99, marginTop: 2,
                background: up ? 'var(--up-bg)' : 'var(--down-bg)',
                color: up ? 'var(--up)' : 'var(--down)',
              }}>
                {up ? '+' : ''}{gainPct?.toFixed(2)}%
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</div>
          )}
        </div>

        {/* Sell button */}
        <button
          onClick={() => setShowSell(true)}
          title="ขายหุ้น"
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: 'var(--down-bg)', color: 'var(--down)',
            border: '1px solid transparent', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.border = '1px solid var(--down)'}
          onMouseLeave={e => e.currentTarget.style.border = '1px solid transparent'}
        >
          <TrendingDown size={12} /> ขาย
        </button>
      </div>

      {/* Expanded Lots */}
      {expanded && (
        <div style={{ padding: '8px 16px', background: 'var(--bg-root)', borderBottom: '1px solid var(--divider)', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', gap: 12 }}>
            <div style={{ width: 100 }}>วันที่เพิ่ม</div>
            <div style={{ flex: 1 }}>จำนวนหุ้น</div>
            <div style={{ width: 100, textAlign: 'right' }}>ราคาซื้อ</div>
            <div style={{ width: 100, textAlign: 'right' }}>ต้นทุนลอตนี้</div>
            <div style={{ width: 40 }} />
          </div>
          {lots.map(lot => (
            <div key={lot.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ width: 100 }}>{new Date(lot.added_at).toLocaleDateString()}</div>
              <div style={{ flex: 1 }}>{lot.shares.toFixed(6)}</div>
              <div style={{ width: 100, textAlign: 'right' }}>{fmt.price(lot.avg_cost)}</div>
              <div style={{ width: 100, textAlign: 'right' }}>{fmt.price(lot.shares * lot.avg_cost)}</div>
              <div style={{ width: 40, textAlign: 'right' }}>
                <button
                  onClick={() => onDelete(lot.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--down-bg)'; e.currentTarget.style.color = 'var(--down)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function PortfolioPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)

  const loadPositions = async () => {
    setLoading(true)
    try {
      const d = await portfolioApi.getPositions()
      const raw = d.positions || []
      if (!raw.length) { setPositions([]); return }

      const tickers = [...new Set(raw.map(p => p.ticker))]
      const quotes = await Promise.allSettled(tickers.map(t => stocksApi.quote(t)))
      const priceMap = {}
      quotes.forEach((r, i) => {
        if (r.status === 'fulfilled') priceMap[tickers[i]] = r.value.quote?.price || 0
      })

      // Group positions by ticker
      const groups = {}
      for (const p of raw) {
        if (!groups[p.ticker]) {
          groups[p.ticker] = { ticker: p.ticker, lots: [], totalShares: 0, totalCost: 0 }
        }
        groups[p.ticker].lots.push(p)
        groups[p.ticker].totalShares += p.shares
        groups[p.ticker].totalCost += (p.shares * p.avg_cost)
      }

      const enriched = Object.values(groups).map(g => {
        const price = priceMap[g.ticker] || 0
        const currentValue = g.totalShares * price
        return {
          ...g,
          price,
          currentValue,
          gain: currentValue - g.totalCost,
          gainPct: g.totalCost > 0 ? ((currentValue - g.totalCost) / g.totalCost) * 100 : 0
        }
      })

      enriched.sort((a, b) => b.currentValue - a.currentValue)
      setPositions(enriched)
    } catch {
      setPositions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadPositions()
    authApi.me()
      .then(r => { if (r.success) setIsPublic(!!r.user.is_public) })
      .catch(() => {})
  }, [user])

  const addPosition = async (data) => {
    await portfolioApi.addPosition(data)
    setShowForm(false)
    loadPositions()
  }

  const deletePosition = async (id) => {
    await portfolioApi.deletePosition(id)
    loadPositions()
  }

  const togglePublic = async () => {
    setToggleLoading(true)
    try {
      await authApi.togglePublic(!isPublic)
      setIsPublic(p => !p)
    } finally { setToggleLoading(false) }
  }

  // Profile Settings
  const [showProfile, setShowProfile] = useState(false)
  const [themeColor, setThemeColor] = useState(user?.themeColor || '#3B82F6')
  const [avatarEmoji, setAvatarEmoji] = useState(user?.avatarEmoji || '🧑‍💻')

  useEffect(() => {
    if (user) {
      setThemeColor(user.themeColor || '#3B82F6')
      setAvatarEmoji(user.avatarEmoji || '🧑‍💻')
    }
  }, [user])

  const saveProfile = async () => {
    try {
      await authApi.updateProfile({ themeColor, avatarEmoji })
      setShowProfile(false)
      window.location.reload()
    } catch {}
  }

  // Summary
  const totalCost = positions.reduce((s, p) => s + p.totalCost, 0)
  const totalValue = positions.reduce((s, p) => s + p.currentValue, 0)
  const totalGain = totalValue - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
  const up = totalGain >= 0

  if (!user) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--primary-bg)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogIn size={32} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-ink)', letterSpacing: '-0.025em', marginBottom: 8 }}>
          ล็อกอินเพื่อติดตามพอร์ต
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28 }}>
          บันทึกหุ้นที่ถือ ติดตาม P&L แบบ real-time และแชร์พอร์ตให้คนอื่นดูได้
        </p>
        <button onClick={() => setShowAuthModal(true)} className="btn-primary" style={{ fontSize: 15, padding: '10px 28px' }}>
          <LogIn size={16} /> เข้าสู่ระบบ / สร้างบัญชี
        </button>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 60, borderRadius: 12, marginBottom: 8 }} />)}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-ink)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            พอร์ตของฉัน
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.name} · {positions.length} หุ้น · ราคาตลาดจริง</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={togglePublic}
            disabled={toggleLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 980, fontSize: 13, fontWeight: 600,
              background: isPublic ? 'var(--up-bg)' : 'var(--divider)',
              color: isPublic ? 'var(--up)' : 'var(--text-secondary)',
              border: 'none', cursor: 'pointer',
            }}
          >
            {isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
            {isPublic ? 'Public' : 'Private'}
          </button>
          {isPublic && user.shareToken && (
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${user.shareToken}`) }}
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <Share2 size={13} /> คัดลอกลิงก์แชร์
            </button>
          )}
          <button onClick={() => setShowProfile(true)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 14px' }}>
            <span style={{ fontSize: 16 }}>{user.avatarEmoji || '🧑‍💻'}</span> โปรไฟล์
          </button>
          <button onClick={() => { setShowForm(!showForm) }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> เพิ่มการลงทุน
          </button>
        </div>
      </div>

      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ padding: '24px', width: 400, maxWidth: '90%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--text-ink)' }}>ตั้งค่าโปรไฟล์นักลงทุน</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>ไอคอน/อิโมจิประจำตัว</label>
              <input 
                className="input" 
                value={avatarEmoji} 
                onChange={e => setAvatarEmoji(e.target.value)} 
                maxLength={2} 
                style={{ fontSize: 24, textAlign: 'center', width: '80px' }} 
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>สีธีมของพอร์ต</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#000000'].map(c => (
                  <button 
                    key={c}
                    onClick={() => setThemeColor(c)}
                    style={{ 
                      width: 32, height: 32, borderRadius: '50%', background: c, 
                      border: themeColor === c ? '3px solid var(--text-ink)' : '2px solid transparent',
                      cursor: 'pointer'
                    }} 
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowProfile(false)} className="btn-ghost">ยกเลิก</button>
              <button onClick={saveProfile} className="btn-primary">บันทึก</button>
            </div>
          </div>
        </div>
      )}


      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <AddForm onAdd={addPosition} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {positions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {(() => {
            const pricesLoaded = positions.some(p => p.price > 0)
            return [
              { label: 'เงินลงทุนรวม', value: fmt.price(totalCost), color: 'var(--text-ink)' },
              { label: 'มูลค่าปัจจุบัน', value: pricesLoaded ? fmt.price(totalValue) : 'กำลังโหลด...', color: 'var(--text-ink)' },
              { label: 'กำไร/ขาดทุน', value: pricesLoaded ? `${up ? '+' : ''}${fmt.price(totalGain)}` : '—', color: pricesLoaded ? (up ? 'var(--up)' : 'var(--down)') : 'var(--text-tertiary)' },
              { label: 'ผลตอบแทน', value: pricesLoaded ? `${up ? '+' : ''}${totalGainPct.toFixed(2)}%` : '—', color: pricesLoaded ? (up ? 'var(--up)' : 'var(--down)') : 'var(--text-tertiary)' },
            ]
          })().map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'var(--primary)', opacity: 0.03, borderRadius: '50%', transform: 'translate(30%, -30%)' }} />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: '0 22px' }}>
        {positions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--divider)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={28} color="var(--text-tertiary)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-ink)', marginBottom: 8 }}>ยังไม่มีประวัติการลงทุน</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>บันทึกการซื้อขายเพื่อติดตาม P&L ในทุกๆ ลอต</div>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={14} /> เพิ่มการลงทุนแรกของคุณ
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
              <div style={{ width: 24, flexShrink: 0 }} /> {/* expand toggle space */}
              <div style={{ width: 40, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>สินทรัพย์</div>
              <div style={{ width: 60, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>สัดส่วน</div>
              <div style={{ width: 80, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>ต้นทุนเฉลี่ย</div>
              <div style={{ width: 80, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>มูลค่าปัจจุบัน</div>
              <div style={{ width: 90, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>กำไร/ขาดทุน</div>
            </div>

            {positions.map(group => (
              <GroupedPositionRow key={group.ticker} group={group} totalValue={totalValue} onDelete={deletePosition} onSold={loadPositions} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
