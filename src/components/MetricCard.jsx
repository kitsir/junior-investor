export function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || '#1D1D1F', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#AEAEB2', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function MetricRow({ label, value, color }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={color ? { color } : {}}>{value ?? '—'}</span>
    </div>
  )
}

export function ScoreBar({ label, value, max = 25 }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct >= 80 ? '#30D158' : pct >= 60 ? '#0071E3' : pct >= 40 ? '#FF9F0A' : '#FF453A'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: '#6E6E73', width: 110, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.06)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 42, textAlign: 'right', flexShrink: 0 }}>
        {value}/{max}
      </span>
    </div>
  )
}

export function Skeleton({ className, style }) {
  return (
    <div
      className={className}
      style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite', ...style }}
    />
  )
}

export function SectionHeader({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </span>
      {right && <span style={{ fontSize: 12, color: '#AEAEB2' }}>{right}</span>}
    </div>
  )
}
