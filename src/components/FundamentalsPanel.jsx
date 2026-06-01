import { MetricRow, ScoreBar, Skeleton, SectionHeader } from './MetricCard.jsx'
import { fmt, scoreColor, scoreLabel } from '../utils/formatters.js'
import { calculateFundamentalScore } from '../utils/analysis.js'

function Panel({ children, style }) {
  return (
    <div className="card" style={{ padding: '16px 18px', marginBottom: 12, ...style }}>
      {children}
    </div>
  )
}

export default function FundamentalsPanel({ fundamentals, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <Skeleton style={{ height: 14, width: 100, marginBottom: 12 }} />
            {Array(4).fill(0).map((_, j) => (
              <Skeleton key={j} style={{ height: 12, width: '100%', marginBottom: 8 }} />
            ))}
          </div>
        ))}
      </div>
    )
  }
  if (!fundamentals) return null

  const f = fundamentals
  const score = calculateFundamentalScore(f)

  const scoreC = score.total >= 80 ? '#30D158'
    : score.total >= 60 ? '#0071E3'
    : score.total >= 40 ? '#FF9F0A'
    : '#FF453A'

  const ratingColor = {
    buy: '#1A7F3C', strongbuy: '#1A7F3C', hold: '#D97706',
    sell: '#C93226', strongsell: '#C93226',
  }

  return (
    <div>
      {/* Score */}
      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Fundamental Score
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: scoreC, letterSpacing: '-0.03em' }}>{score.total}</span>
            <span style={{ fontSize: 13, color: '#AEAEB2' }}>/100</span>
            <div style={{ fontSize: 11, fontWeight: 700, color: scoreC, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {scoreLabel(score.total)}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ScoreBar label="Profitability" value={score.profitability} max={25} />
          <ScoreBar label="Growth" value={score.growth} max={25} />
          <ScoreBar label="Valuation" value={score.value} max={25} />
          <ScoreBar label="Financial Health" value={score.health} max={25} />
        </div>
      </Panel>

      {/* Valuation */}
      <Panel>
        <SectionHeader title="Valuation" />
        <MetricRow label="Market Cap"    value={fmt.large(f.marketCap)} />
        <MetricRow label="Trailing P/E"  value={fmt.num(f.trailingPE)} />
        <MetricRow label="Forward P/E"   value={fmt.num(f.forwardPE)} />
        <MetricRow label="PEG Ratio"     value={fmt.num(f.pegRatio)} />
        <MetricRow label="Price / Book"  value={fmt.num(f.priceToBook)} />
        <MetricRow label="Price / Sales" value={fmt.num(f.priceToSales)} />
        <MetricRow label="EV / EBITDA"   value={fmt.num(f.enterpriseToEbitda)} />
      </Panel>

      {/* Profitability */}
      <Panel>
        <SectionHeader title="Profitability" />
        <MetricRow label="Net Margin"    value={fmt.pct(f.profitMargins, 1)} color={f.profitMargins > 0 ? '#1A7F3C' : '#C93226'} />
        <MetricRow label="Gross Margin"  value={fmt.pct(f.grossMargins, 1)} />
        <MetricRow label="Oper. Margin"  value={fmt.pct(f.operatingMargins, 1)} />
        <MetricRow label="ROE"           value={fmt.pct(f.returnOnEquity, 1)} color={f.returnOnEquity > 0.15 ? '#1A7F3C' : undefined} />
        <MetricRow label="ROA"           value={fmt.pct(f.returnOnAssets, 1)} />
      </Panel>

      {/* Growth */}
      <Panel>
        <SectionHeader title="Growth" />
        <MetricRow
          label="Revenue Growth" value={fmt.pct(f.revenueGrowth, 1)}
          color={f.revenueGrowth > 0 ? '#1A7F3C' : '#C93226'}
        />
        <MetricRow
          label="Earnings Growth" value={fmt.pct(f.earningsGrowth, 1)}
          color={f.earningsGrowth > 0 ? '#1A7F3C' : '#C93226'}
        />
        <MetricRow label="EPS (TTM)"     value={fmt.price(f.eps)} />
        <MetricRow label="Forward EPS"   value={fmt.price(f.forwardEps)} />
        <MetricRow label="Revenue"       value={fmt.large(f.totalRevenue)} />
      </Panel>

      {/* Balance Sheet */}
      <Panel>
        <SectionHeader title="Balance Sheet" />
        <MetricRow label="Debt / Equity"   value={fmt.num(f.debtToEquity, 1)} color={f.debtToEquity < 80 ? '#1A7F3C' : f.debtToEquity < 150 ? '#D97706' : '#C93226'} />
        <MetricRow label="Current Ratio"   value={fmt.num(f.currentRatio, 2)} color={f.currentRatio > 1.5 ? '#1A7F3C' : f.currentRatio > 1 ? '#D97706' : '#C93226'} />
        <MetricRow label="Quick Ratio"     value={fmt.num(f.quickRatio, 2)} />
        <MetricRow label="Total Cash"      value={fmt.large(f.totalCash)} />
        <MetricRow label="Free Cash Flow"  value={fmt.large(f.freeCashflow)} color={f.freeCashflow > 0 ? '#1A7F3C' : '#C93226'} />
        <MetricRow label="Book Value / Sh" value={fmt.price(f.bookValue)} />
      </Panel>

      {/* Analyst */}
      {f.analystRating && (
        <Panel>
          <SectionHeader title="Analyst Consensus" right={f.numberOfAnalysts ? `${f.numberOfAnalysts} analysts` : ''} />
          <MetricRow
            label="Rating"
            value={f.analystRating?.toUpperCase().replace('_', ' ')}
            color={ratingColor[f.analystRating]}
          />
          <MetricRow label="Target (Mean)" value={fmt.price(f.targetMeanPrice)} />
          <MetricRow label="Target (High)" value={fmt.price(f.targetHighPrice)} />
          <MetricRow label="Target (Low)"  value={fmt.price(f.targetLowPrice)} />
        </Panel>
      )}

      {/* Dividends */}
      {f.dividendYield > 0 && (
        <Panel>
          <SectionHeader title="Dividends" />
          <MetricRow label="Yield"        value={fmt.pct(f.dividendYield, 2)} />
          <MetricRow label="Rate"         value={fmt.price(f.dividendRate)} />
          <MetricRow label="Payout Ratio" value={fmt.pct(f.payoutRatio, 1)} />
        </Panel>
      )}

      {/* Company */}
      {f.sector && (
        <Panel>
          <SectionHeader title="Company" />
          <MetricRow label="Sector"       value={f.sector} />
          <MetricRow label="Industry"     value={f.industry} />
          <MetricRow label="Employees"    value={f.employees?.toLocaleString()} />
          <MetricRow label="Beta"         value={fmt.num(f.beta, 2)} />
          <MetricRow label="Inst. Hold."  value={fmt.pct(f.heldPercentInstitutions)} />
          <MetricRow label="Insider Hold." value={fmt.pct(f.heldPercentInsiders)} />
        </Panel>
      )}
    </div>
  )
}
