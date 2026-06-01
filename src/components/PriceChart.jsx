import { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts'

const RANGES = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
  { label: '5Y', value: '5y' },
]

export default function PriceChart({ bars, levels = [], range, onRangeChange, loading }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const volumeRef = useRef(null)
  const priceLineRefs = useRef([])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#FFFFFF' },
        textColor: '#AEAEB2',
        fontFamily: '-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(0,0,0,0.04)' },
        horzLines: { color: 'rgba(0,0,0,0.04)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(0,0,0,0.2)', labelBackgroundColor: '#1D1D1F' },
        horzLine: { color: 'rgba(0,0,0,0.2)', labelBackgroundColor: '#1D1D1F' },
      },
      rightPriceScale: {
        borderColor: 'rgba(0,0,0,0.06)',
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: 'rgba(0,0,0,0.06)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#30D158',
      downColor: '#FF453A',
      borderUpColor: '#30D158',
      borderDownColor: '#FF453A',
      wickUpColor: '#30D158',
      wickDownColor: '#FF453A',
    })

    const volSeries = chart.addHistogramSeries({
      color: 'rgba(0,0,0,0.06)',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })

    chartRef.current = chart
    seriesRef.current = candleSeries
    volumeRef.current = volSeries

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(containerRef.current)

    return () => { ro.disconnect(); chart.remove() }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || !bars?.length) return
    seriesRef.current.setData(bars.map(b => ({
      time: b.time, open: b.open, high: b.high, low: b.low, close: b.close,
    })))
    volumeRef.current.setData(bars.map(b => ({
      time: b.time, value: b.volume,
      color: b.close >= b.open ? 'rgba(48,209,88,0.18)' : 'rgba(255,69,58,0.18)',
    })))
    chartRef.current?.timeScale().fitContent()
  }, [bars])

  useEffect(() => {
    if (!seriesRef.current) return
    priceLineRefs.current.forEach(pl => { try { seriesRef.current.removePriceLine(pl) } catch {} })
    priceLineRefs.current = []
    levels.forEach(level => {
      const pl = seriesRef.current.createPriceLine({
        price: level.price,
        color: level.type === 'resistance' ? 'rgba(255,69,58,0.5)' : 'rgba(48,209,88,0.5)',
        lineWidth: 1,
        lineStyle: 3,
        axisLabelVisible: true,
        title: `${level.type === 'resistance' ? 'R' : 'S'}`,
      })
      priceLineRefs.current.push(pl)
    })
  }, [levels])

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px 12px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Price
        </span>
        <div style={{
          display: 'flex', gap: 2,
          background: 'rgba(0,0,0,0.05)',
          borderRadius: 10, padding: 3,
        }}>
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => onRangeChange?.(r.value)}
              style={{
                padding: '3px 10px',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                background: range === r.value ? '#fff' : 'transparent',
                color: range === r.value ? '#1D1D1F' : '#6E6E73',
                boxShadow: range === r.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          }}>
            <div style={{
              width: 22, height: 22, border: '2px solid #0071E3',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }} />
          </div>
        )}
        <div ref={containerRef} style={{ height: 360 }} />
      </div>
    </div>
  )
}
