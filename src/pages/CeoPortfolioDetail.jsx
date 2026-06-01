import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { ceoApi } from '../api/client.js'
import { fmt } from '../utils/formatters.js'
import { Skeleton } from '../components/MetricCard.jsx'
import LogoAvatar from '../components/LogoAvatar.jsx'

function PortfolioGroupRow({ group, totalValue }) {
  const navigate = useNavigate()
  const { ticker, price, totalShares, totalCost, currentValue, gain, gainPct } = group
  const weight = totalValue > 0 ? (currentValue / totalValue) * 100 : 0
  const hasPrice = price > 0
  const up = gain >= 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
      {/* Avatar */}
      <div
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/stock/${ticker}`)}
      >
        <LogoAvatar ticker={ticker} size={40} />
      </div>

      {/* Ticker + shares */}
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/stock/${ticker}`)}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-ink)' }}>{ticker}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {Number(totalShares).toFixed(4)} หุ้น
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
          {hasPrice ? fmt.price(currentValue) : <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>—</span>}
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
    </div>
  )
}

export default function CeoPortfolioDetail() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ceoApi.get()
      .then(r => { if (r.success) setData(r.portfolio) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '40px auto' }}>
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 60, borderRadius: 12, marginBottom: 8 }} />)}
      </div>
    )
  }

  if (!data) return <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-secondary)' }}>ไม่พบข้อมูล CEO Portfolio</div>

  const initialCapital = data.totalCost
  const pricesLoaded = data.totalValue > 0
  const up = data.totalGain >= 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 0 48px' }}>
      <button 
        onClick={() => navigate(-1)}
        className="btn-ghost"
        style={{ marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> กลับ
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Star size={32} color="#fff" fill="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-ink)', letterSpacing: '-0.03em', margin: 0 }}>CEO Portfolio</h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Featured</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>พอร์ตการลงทุนตัวอย่าง · อัปเดตตามราคาตลาดจริง</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'เงินต้นรวม', value: fmt.price(initialCapital), color: 'var(--text-ink)' },
          { label: 'มูลค่าปัจจุบัน', value: pricesLoaded ? fmt.price(data.totalValue) : 'กำลังโหลด...', color: 'var(--text-ink)' },
          { label: 'กำไร/ขาดทุนรวม', value: pricesLoaded ? `${up ? '+' : ''}${fmt.price(data.totalGain)}` : '—', color: pricesLoaded ? (up ? 'var(--up)' : 'var(--down)') : 'var(--text-tertiary)' },
          { label: 'ผลตอบแทนรวม', value: pricesLoaded ? `${up ? '+' : ''}${data.totalGainPct?.toFixed(2)}%` : '—', color: pricesLoaded ? (up ? 'var(--up)' : 'var(--down)') : 'var(--text-tertiary)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'var(--primary)', opacity: 0.03, borderRadius: '50%', transform: 'translate(30%, -30%)' }} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '0 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--divider)' }}>
          <div style={{ width: 40, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>สินทรัพย์</div>
          <div style={{ width: 60, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>สัดส่วน</div>
          <div style={{ width: 80, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>ต้นทุนเฉลี่ย</div>
          <div style={{ width: 80, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>มูลค่าปัจจุบัน</div>
          <div style={{ width: 90, textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>กำไร/ขาดทุน</div>
        </div>

        {data.positions.map(pos => {
           // We adapt the pos from CEO API to match the group structure for our UI Component
           const group = {
             ticker: pos.ticker,
             price: pos.price,
             totalShares: pos.shares,
             totalCost: pos.cost,
             currentValue: pos.value,
             gain: pos.gain,
             gainPct: pos.gainPct
           }
           return <PortfolioGroupRow key={pos.ticker} group={group} totalValue={data.totalValue} />
        })}
      </div>
    </div>
  )
}
