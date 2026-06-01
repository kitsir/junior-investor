import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { portfolioApi, ceoApi } from '../api/client.js'
import { Skeleton } from '../components/MetricCard.jsx'
import { fmt } from '../utils/formatters.js'
import { Users, Share2, Star, FolderOpen, ImageOff } from 'lucide-react'
import LogoAvatar from '../components/LogoAvatar.jsx'

function PortfolioRow({ position }) {
  const navigate = useNavigate()
  const up = position.gain >= 0
  return (
    <div
      className="flex items-center gap-3 py-3 border-b cursor-pointer transition-opacity hover:opacity-70"
      style={{ borderBottomColor: 'var(--divider)' }}
      onClick={() => navigate(`/stock/${position.ticker}`)}
    >
      <LogoAvatar ticker={position.ticker} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold" style={{ color: 'var(--text-ink)' }}>{position.ticker}</div>
        <div className="text-[12px] truncate" style={{ color: 'var(--text-tertiary)' }}>
          {Number(position.shares).toFixed(4)} หุ้น · ต้นทุน {fmt.price(position.avg_cost || position.costPerShare)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[14px] font-bold" style={{ color: 'var(--text-ink)' }}>{fmt.price(position.value)}</div>
        <div className={`text-[12px] font-semibold ${up ? 'text-up' : 'text-down'}`}>
          {up ? '+' : ''}{fmt.price(position.gain)} ({up ? '+' : ''}{position.gainPct.toFixed(1)}%)
        </div>
      </div>
    </div>
  )
}

// ── View a single shared portfolio ──────────────────────────────────────────
export function SharedPortfolioPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    portfolioApi.shared(token)
      .then(r => { if (r.success) setData(r); else setErr('ไม่พบพอร์ตนี้') })
      .catch(() => setErr('เกิดข้อผิดพลาด'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="max-w-[640px] mx-auto mt-10">
      {Array(4).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 56, borderRadius: 12, marginBottom: 8 }} />)}
    </div>
  )

  if (err) return (
    <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
      <div className="flex justify-center mb-4"><ImageOff size={48} className="opacity-30" /></div>
      <div className="text-lg font-bold mb-2" style={{ color: 'var(--text-ink)' }}>{err}</div>
      <div className="text-sm">พอร์ตนี้อาจถูกทำให้เป็น private หรือลิงก์ไม่ถูกต้อง</div>
    </div>
  )

  const p = data.portfolio
  const up = p.totalGain >= 0

  return (
    <div className="max-w-[640px] mx-auto mt-7 mb-14">
      <div className="mb-5 flex items-center gap-4">
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{ background: data.themeColor || '#3B82F6' }}
        >
          <span className="text-[24px] font-extrabold text-white">
            {data.avatarEmoji || data.owner[0]}
          </span>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>พอร์ตของ</div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--text-ink)' }}>{data.owner}</h1>
          <div className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>อัพเดตตามราคาตลาดจริง · 15-min delay</div>
        </div>
      </div>

      <div className="card p-6 mb-4 flex gap-8">
        <div>
          <div className="text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>มูลค่ารวม</div>
          <div className="text-[28px] font-extrabold tracking-tight" style={{ color: 'var(--text-ink)' }}>{fmt.price(p.totalValue)}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>กำไร/ขาดทุนรวม</div>
          <div className={`text-[22px] font-extrabold ${up ? 'text-up' : 'text-down'}`}>
            {up ? '+' : ''}{fmt.price(p.totalGain)}
          </div>
          <div className={`text-[12px] font-semibold ${up ? 'text-up' : 'text-down'}`}>
            {up ? '+' : ''}{p.totalGainPct.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
          {p.positions.length} หุ้น
        </div>
        {p.positions.map(pos => <PortfolioRow key={pos.ticker} position={pos} />)}
      </div>
    </div>
  )
}

// ── CEO Featured Card ───────────────────────────────────────────────────────
function CeoCard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    ceoApi.get().then(r => { if (r.success) setData(r.portfolio) }).catch(() => {})
  }, [])

  if (!data) return null
  const up = data.totalGainPct >= 0

  return (
    <button 
      onClick={() => navigate('/ceo-portfolio')} 
      className="w-full text-left card p-6 mb-4 border-l-4 border-l-amber-500 relative overflow-hidden transition-all hover:shadow-card-lg hover:-translate-y-1 cursor-pointer border-r border-t border-b border-color"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-[100px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0 shadow-md">
            <Star size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <div className="text-[16px] font-bold flex items-center gap-2" style={{ color: 'var(--text-ink)' }}>
              CEO Portfolio
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-amber-600 uppercase tracking-wider" style={{ background: 'rgba(245,158,11,0.15)' }}>Featured</span>
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {data.positions.length} หุ้น · เริ่มลงทุน พ.ย. ปีที่แล้ว
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-extrabold tracking-tight font-num" style={{ color: 'var(--text-ink)' }}>{fmt.price(data.totalValue)}</div>
          <div className={`text-[13px] font-bold mt-0.5 ${up ? 'text-up' : 'text-down'}`}>
            {up ? '+' : ''}{data.totalGainPct.toFixed(2)}% ({up ? '+' : ''}{fmt.price(data.totalGain)})
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 flex-wrap relative z-10">
        {data.positions.slice(0, 7).map(p => (
          <span
            key={p.ticker}
            className={`text-[12px] font-bold px-2.5 py-1 rounded-full transition-colors ${
              p.gain >= 0 ? 'text-up' : 'text-down'
            }`}
            style={{ background: p.gain >= 0 ? 'var(--up-bg)' : 'var(--down-bg)' }}
          >
            {p.ticker} {p.gain >= 0 ? '+' : ''}{p.gainPct.toFixed(1)}%
          </span>
        ))}
        {data.positions.length > 7 && (
          <span className="text-[12px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--divider)', color: 'var(--text-tertiary)' }}>
            +{data.positions.length - 7} more
          </span>
        )}
      </div>
    </button>
  )
}

// ── Community page: all public portfolios ────────────────────────────────────
export default function CommunityPage() {
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portfolioApi.community()
      .then(r => setPortfolios(r.portfolios || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-[800px] mx-auto mt-7 mb-14">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 mb-1" style={{ color: 'var(--text-ink)' }}>
          <Users size={28} className="text-[#3B82F6]" />
          Community Portfolios
        </h1>
        <p className="text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
          พอร์ตที่นักลงทุนแชร์สาธารณะ · ข้อมูลจริง · อัพเดตตามราคาตลาด
        </p>
      </div>

      <CeoCard />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} style={{ height: 100, borderRadius: 12 }} />)}
        </div>
      ) : portfolios.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="flex justify-center mb-4"><FolderOpen size={40} className="text-tertiary opacity-50" /></div>
          <div className="text-[16px] font-bold mb-2" style={{ color: 'var(--text-ink)' }}>ยังไม่มีพอร์ตที่แชร์</div>
          <div className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>ล็อกอินและตั้งพอร์ตเป็น Public เพื่อให้คนอื่นเห็นได้</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {portfolios.map(p => (
            <PublicPortfolioCard key={p.userId} portfolio={p} />
          ))}
        </div>
      )}

      {/* CTA Box */}
      <section className="mt-12 mb-4 animate-fade-in">
        <div className="card p-8 md:p-10 text-center bg-gradient-to-br from-[#3B82F6]/10 to-[#10B981]/10 border border-primary/20 relative overflow-hidden transition-all hover:border-primary/50">
          <div className="relative z-10">
            <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-2">
              แบ่งปันพอร์ตของคุณให้โลกเห็น
            </h2>
            <p className="text-[14px] text-secondary max-w-lg mx-auto mb-6">
              เข้าไปที่หน้า Portfolio ของคุณแล้วเปิดใช้งาน "Public Profile" เพื่อรับลิงก์สำหรับแชร์ให้เพื่อนๆ หรือนักลงทุนคนอื่นได้ติดตามผลงานของคุณ
            </p>
            <button
              onClick={() => {
                 navigate('/portfolio')
              }}
              className="px-6 py-3 bg-ink hover:opacity-80 text-surface rounded-full font-bold text-[13px] transition-opacity cursor-pointer flex items-center justify-center gap-2 mx-auto"
            >
              ไปที่หน้าพอร์ตของฉัน <Share2 size={14} />
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}

function PublicPortfolioCard({ portfolio }) {
  const navigate = useNavigate()
  return (
    <button 
      onClick={() => navigate(`/share/${portfolio.shareToken}`)}
      className="w-full text-left card p-6 transition-all hover:shadow-card-lg hover:-translate-y-1 cursor-pointer border-l-4"
      style={{ borderLeftColor: portfolio.themeColor || '#3B82F6' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center shadow-sm"
            style={{ background: portfolio.themeColor || '#3B82F6' }}
          >
            <span className="text-[18px] text-white">
              {portfolio.avatarEmoji || portfolio.name[0]}
            </span>
          </div>
          <div>
            <div className="text-[15px] font-bold" style={{ color: 'var(--text-ink)' }}>{portfolio.name}</div>
            <div className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{portfolio.positions.length} หุ้น</div>
          </div>
        </div>
        <div className="text-[13px] font-bold" style={{ color: 'var(--text-secondary)' }}>
          ดูรายละเอียด <Share2 size={13} className="inline ml-1" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {portfolio.positions.slice(0, 8).map(pos => (
          <span
            key={pos.ticker}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors"
            style={{ background: 'var(--divider)', color: 'var(--text-secondary)' }}
            onClick={() => navigate(`/stock/${pos.ticker}`)}
          >
            {pos.ticker}
          </span>
        ))}
        {portfolio.positions.length > 8 && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--divider)', color: 'var(--text-tertiary)' }}>
            +{portfolio.positions.length - 8}
          </span>
        )}
      </div>
    </button>
  )
}
