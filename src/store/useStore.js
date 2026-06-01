import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // Active symbol
      symbol: 'AAPL',
      setSymbol: (symbol) => set({ symbol: symbol.toUpperCase() }),

      // Quote cache
      quotes: {},
      setQuote: (ticker, quote) => set(s => ({ quotes: { ...s.quotes, [ticker]: quote } })),

      // Chart range selection
      chartRange: '1y',
      setChartRange: (range) => set({ chartRange: range }),

      // Watchlist (local state, synced with backend)
      watchlist: [],
      setWatchlist: (list) => set({ watchlist: list }),

      // Portfolio positions
      positions: [],
      setPositions: (positions) => set({ positions }),

      // UI state
      sidebarOpen: true,
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      theme: 'light',
    }),
    {
      name: 'stockvision-store',
      partialMerge: true,
    }
  )
)

export default useStore
