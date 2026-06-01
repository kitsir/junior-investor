import { useMemo } from 'react'
import {
  findSupportResistanceLevels, splitLevels,
  calculatePriceTargets, calculateMomentum, avgVolume,
} from '../utils/analysis.js'
import { fmt } from '../utils/formatters.js'
import { Skeleton, SectionHeader } from './MetricCard.jsx'

function LevelRow({ level, currentPrice }) {
  const dist = ((level.price - currentPrice) / currentPrice) * 100
  const isR = level.type === 'resistance'
  const color = isR ? '#C93226' : '#1A7F3C'
  const bg = isR ? 'rgba(255,69,58,0.08)' : 'rgba(48,209,88,0.08)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div style={{ width: 3, height: 32, borderRadius: 99, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F', fontVariantNumeric: 'tabular-nums' }}>
          {fmt.price(level.price)}
        </div>
        <div style={{ fontSize: 11, color: '#AEAEB2' }}>
          {isR ? 'Resistance' : 'Support'} · {level.touches} touch{level.touches !== 1 ? 'es' : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color, background: bg,
          padding: '2px 8px', borderRadius: 99,
        }}>
          {dist >= 0 ? '+' : ''}{dist.toFixed(2)}%
        </span>
        <div style={{ display: 'flex', gap: 2, marginTop: 4, justifyContent: 'flex-end' }}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: 99,
              background: i < Math.ceil(level.strength / 20) ? color : 'rgba(0,0,0,0.08)',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TargetRow({ label, price, currentPrice }) {
  if (!price) return null
  const upside = ((price - currentPrice) / currentPrice) * 100
  const up = upside >= 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
      <span style={{ fontSize: 13, color: '#6E6E73' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1F', fontVariantNumeric: 'tabular-nums' }}>
          {fmt.price(price)}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
          color: up ? '#1A7F3C' : '#C93226',
          background: up ? 'rgba(48,209,88,0.1)' : 'rgba(255,69,58,0.1)',
        }}>
          {up ? '+' : ''}{upside.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

function Panel({ title, right, children }) {
  return (
    <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
      <SectionHeader title={title} right={right} />
      {children}
    </div>
  )
}

export default function AnalysisPanel({ bars, fundamentals, quote, loading, srLevels: srLevelsProp }) {
  // Use pre-computed 2Y-based levels if provided, else compute from display bars
  const srLevels = useMemo(() => {
    if (srLevelsProp?.length) return srLevelsProp
    if (!bars?.length) return []
    return findSupportResistanceLevels(bars, { lookback: 10, maxLevels: 8 })
  }, [bars, srLevelsProp])

  const { resistance, support } = useMemo(() => {
    if (!quote?.price) return { resistance: [], support: [] }
    return splitLevels(srLevels, quote.price)
  }, [srLevels, quote])

  const targets = useMemo(() => {
    if (!fundamentals || !quote?.price) return null
    return calculatePriceTargets(fundamentals, quote.price)
  }, [fundamentals, quote])

  const momentum = useMemo(() => {
    if (!bars?.length) return {}
    return calculateMomentum(bars)
  }, [bars])

  const avgVol = useMemo(() => avgVolume(bars), [bars])

  if (loading) {
    return (
      <div>
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="card" style={{ padding: 18, marginBottom: 12 }}>
            <Skeleton style={{ height: 12, width: 80, marginBottom: 12 }} />
            {Array(4).fill(0).map((_, j) => <Skeleton key={j} style={{ height: 11, width: '100%', marginBottom: 8 }} />)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Price Targets */}
      {targets && (
        <Panel title="Price Targets">
          <TargetRow label="Conservative (Graham Number)" price={targets.conservative} currentPrice={quote?.price} />
          <TargetRow label="Base Case (Forward P/E ×20)" price={targets.base} currentPrice={quote?.price} />
          <TargetRow label="Optimistic (PEG-based)" price={targets.optimistic} currentPrice={quote?.price} />
          {targets.analystTarget && <>
            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />
            <TargetRow label="Analyst Low"  price={targets.analystLow}    currentPrice={quote?.price} />
            <TargetRow label="Analyst Mean" price={targets.analystTarget} currentPrice={quote?.price} />
            <TargetRow label="Analyst High" price={targets.analystHigh}   currentPrice={quote?.price} />
          </>}
          <div style={{ fontSize: 11, color: '#AEAEB2', marginTop: 10, lineHeight: 1.5 }}>
            คำนวณจาก EPS, Book Value, Growth Rate · ไม่ใช่ investment advice
          </div>
        </Panel>
      )}

      {/* Resistance */}
      <Panel title="Resistance" right={`${resistance.length} levels`}>
        {resistance.length === 0 ? (
          <div style={{ fontSize: 13, color: '#AEAEB2', padding: '8px 0' }}>No resistance levels above current price</div>
        ) : (
          resistance.slice(0, 5).map((l, i) => <LevelRow key={i} level={l} currentPrice={quote?.price || 0} />)
        )}
      </Panel>

      {/* Support */}
      <Panel title="Support" right={`${support.length} levels`}>
        {support.length === 0 ? (
          <div style={{ fontSize: 13, color: '#AEAEB2', padding: '8px 0' }}>No support levels below current price</div>
        ) : (
          support.slice(0, 5).map((l, i) => <LevelRow key={i} level={l} currentPrice={quote?.price || 0} />)
        )}
      </Panel>

      {/* Momentum */}
      <Panel title="Momentum">
        {[['1 Month', momentum['1m']], ['3 Months', momentum['3m']], ['6 Months', momentum['6m']], ['1 Year', momentum['1y']]].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 13, color: '#6E6E73' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: val == null ? '#AEAEB2' : val >= 0 ? '#1A7F3C' : '#C93226' }}>
              {val == null ? '—' : `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`}
            </span>
          </div>
        ))}
      </Panel>

      {/* 52W Range */}
      {quote && (
        <Panel title="52-Week Range">
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#AEAEB2', marginBottom: 6 }}>
              <span>{fmt.price(quote.week52Low)}</span>
              <span>{fmt.price(quote.week52High)}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'visible', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${momentum.positionIn52wk || 0}%`,
                background: 'linear-gradient(90deg, #30D158, #0071E3)',
                borderRadius: 99,
                maxWidth: '100%',
              }} />
              <div style={{
                position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
                left: `${momentum.positionIn52wk || 0}%`,
                width: 14, height: 14,
                background: '#fff', border: '2px solid #0071E3',
                borderRadius: 99, boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#AEAEB2', marginTop: 8 }}>
              {fmt.price(quote.price)} · {momentum.positionIn52wk ?? '—'}% of 52-week range
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 8 }}>
            {[
              ['From 52W High', momentum.fromHigh52, true],
              ['From 52W Low',  momentum.fromLow52,  false],
              avgVol ? ['Avg Volume (20d)', `${(avgVol/1e6).toFixed(1)}M`, null] : null,
            ].filter(Boolean).map(([label, val, forceSide]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: 13, color: '#6E6E73' }}>{label}</span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: forceSide === null ? '#1D1D1F' : (typeof val === 'number' && val < 0) ? '#C93226' : '#1A7F3C',
                }}>
                  {typeof val === 'number' ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : val}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
