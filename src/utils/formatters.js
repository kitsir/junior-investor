export const fmt = {
  price: (v, decimals = 2) => {
    if (v == null) return '—'
    return `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  },

  pct: (v, decimals = 2) => {
    if (v == null) return '—'
    const sign = v >= 0 ? '+' : ''
    return `${sign}${(Number(v) * 100).toFixed(decimals)}%`
  },

  pctRaw: (v, decimals = 2) => {
    if (v == null) return '—'
    const sign = v >= 0 ? '+' : ''
    return `${sign}${Number(v).toFixed(decimals)}%`
  },

  large: (v) => {
    if (v == null) return '—'
    const abs = Math.abs(v)
    if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
    if (abs >= 1e9) return `$${(v / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `$${(v / 1e6).toFixed(2)}M`
    if (abs >= 1e3) return `$${(v / 1e3).toFixed(2)}K`
    return `$${v}`
  },

  num: (v, decimals = 2) => {
    if (v == null) return '—'
    return Number(v).toFixed(decimals)
  },

  mult: (v) => {
    if (v == null) return '—'
    return `${Number(v).toFixed(1)}x`
  },

  date: (ts) => {
    if (!ts) return '—'
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  },

  shortDate: (ts) => {
    if (!ts) return ''
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  },
}

export function scoreColor(score) {
  if (score >= 80) return 'text-up'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-amber-600'
  if (score >= 20) return 'text-orange-600'
  return 'text-down'
}

export function scoreLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Average'
  if (score >= 20) return 'Weak'
  return 'Poor'
}

export function changeBadge(pct) {
  if (pct == null) return { text: '—', className: 'text-ink-muted' }
  const sign = pct >= 0 ? '+' : ''
  return {
    text: `${sign}${Number(pct).toFixed(2)}%`,
    className: pct >= 0 ? 'text-up' : 'text-down',
  }
}
