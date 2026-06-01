import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { stocksApi } from '../api/client.js'

export default function StockSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
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
    }, 280)
  }, [query])

  const pick = (ticker) => {
    setQuery('')
    setOpen(false)
    navigate(`/stock/${ticker}`)
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative flex items-center">
        <Search
          size={14}
          className="absolute left-3 text-tertiary pointer-events-none"
        />
        <input
          className="w-full py-1.5 pl-9 pr-3 rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[14px] text-ink outline-none transition-all focus:border-[#3B82F6] focus:bg-[rgba(15,17,21,0.9)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] placeholder:text-tertiary"
          placeholder="Search ticker or company..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length) setOpen(true)
          }}
        />
        {loading && (
          <div className="absolute right-3 w-3 h-3 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#1A1D24] rounded-lg shadow-card-md overflow-hidden z-50 border border-[rgba(255,255,255,0.05)]">
          {results.map((r, i) => (
            <button
              key={r.ticker}
              onClick={() => pick(r.ticker)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left bg-transparent border-none cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.05)] ${
                i < results.length - 1 ? 'border-b border-[rgba(255,255,255,0.05)]' : ''
              }`}
            >
              <span className="font-bold text-[13px] text-ink w-14 shrink-0">
                {r.ticker}
              </span>
              <span className="text-[13px] text-secondary truncate flex-1">
                {r.name}
              </span>
              {r.exchange && (
                <span className="text-[11px] text-tertiary shrink-0">{r.exchange}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
