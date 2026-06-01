# StockVision — Claude Instructions

เว็บแอปวิเคราะห์หุ้นสหรัฐ เน้นปัจจัยพื้นฐาน + Technical S/R ทำเองทั้งหมดโดยไม่ใช้ AI ในการประมวลผลกราฟ

## Architecture

```
Browser (Vite :5173)
    ↓ /api/* proxy
Express Server (:3001)
    ↓ fetch
Yahoo Finance API (free, 15-min delay)
    ↓
SQLite (server/data.db) — portfolio, watchlist, cache, notes
```

## Start Commands

```bash
cd stock-vision
npm install           # first time
npm run dev          # starts both Express + Vite concurrently
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Free Data Sources (No API Key)

| Data | Endpoint |
|------|----------|
| Quote + OHLCV | `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1y` |
| Fundamentals | `https://query1.finance.yahoo.com/v10/finance/quoteSummary/{ticker}?modules=...` |
| Search | `https://query1.finance.yahoo.com/v1/finance/search?q={query}&newsCount=0` |

Yahoo Finance ไม่ต้องใช้ API key แต่ต้องผ่าน Express proxy เพราะ browser CORS

## File Structure

```
stock-vision/
├── CLAUDE.md           ← คุณอยู่ที่นี่
├── DEVLOG.md           ← บันทึกการพัฒนา
├── package.json
├── vite.config.js      ← proxy /api → :3001
├── tailwind.config.js
├── index.html
├── server/
│   ├── index.js        ← Express entry, port 3001
│   ├── db.js           ← SQLite (better-sqlite3)
│   └── routes/
│       ├── stocks.js   ← Yahoo Finance proxy
│       ├── portfolio.js← Portfolio CRUD
│       └── investors.js← Top 5 investor data (hardcoded 13F)
└── src/
    ├── App.jsx          ← React Router setup
    ├── index.css        ← Tailwind + custom vars
    ├── utils/
    │   ├── analysis.js  ← S/R algo, price targets, fundamental score
    │   └── formatters.js← Number/date formatting helpers
    ├── api/
    │   └── client.js    ← Axios calls to /api/*
    ├── store/
    │   └── useStore.js  ← Zustand global state
    ├── components/
    │   ├── Header.jsx
    │   ├── StockSearch.jsx
    │   ├── PriceChart.jsx    ← TradingView Lightweight Charts
    │   ├── FundamentalsPanel.jsx
    │   ├── AnalysisPanel.jsx ← S/R levels + price targets
    │   └── MetricCard.jsx
    └── pages/
        ├── Dashboard.jsx
        ├── StockDetail.jsx
        ├── InvestorsPage.jsx
        └── PortfolioPage.jsx
```

## Database Schema (SQLite)

```sql
watchlist  — ticker, added_at
positions  — ticker, shares, avg_cost, added_at
notes      — ticker, content, created_at
cache      — ticker (PK), data JSON, updated_at
```

## Analysis Algorithms (src/utils/analysis.js)

### Support/Resistance — findSupportResistanceLevels(bars, options)
1. หา swing high/low โดยใช้ rolling window (default lookback=10)
2. Swing high = bar.high > high ของทุก bar ใน window ซ้าย/ขวา
3. Cluster levels ที่ใกล้กัน (ภายใน 1.5%) เข้าหากัน
4. Score แต่ละ cluster ด้วย: จำนวน touches, recency, ระยะจาก current price
5. Return top 8 levels เรียง price สูง→ต่ำ พร้อม type (support/resistance)

### Price Targets — calculatePriceTargets(fundamentals, currentPrice)
- **Conservative:** Graham Number = √(22.5 × EPS × BVPS)
- **Base:** Forward EPS × Sector avg P/E (20x)
- **Optimistic:** Forward EPS × min(growth%, 35) — PEG-based
- แสดง upside% จาก current price

### Fundamental Score — calculateFundamentalScore(metrics) → 0-100
- Profitability 25pts: ROE, Net Margin, ROA
- Growth 25pts: Revenue growth, Earnings growth
- Value 25pts: P/E ratio, P/B ratio, EV/EBITDA
- Financial Health 25pts: Debt/Equity, Current ratio, Free Cash Flow

### คะแนน Interpretation
- 80-100 = Excellent (ซื้อได้)
- 60-79 = Good
- 40-59 = Average
- 20-39 = Weak
- 0-19 = Poor (ระวัง)

## Top 5 Investor Portfolios (server/routes/investors.js)

ข้อมูล 13F hardcoded จาก Q4 2024:
1. **Warren Buffett** (Berkshire Hathaway) — value investing ระยะยาว
2. **Cathie Wood** (ARK Invest) — growth/innovation
3. **Bill Ackman** (Pershing Square) — concentrated activist
4. **Ray Dalio** (Bridgewater) — all-weather macro
5. **Michael Burry** (Scion Asset Mgmt) — contrarian value

## UI Design System

- **Background:** #F8FAFC (light gray-white)
- **Card:** #FFFFFF + shadow-sm
- **Text:** #0F172A (dark navy)
- **Green (up/positive):** #16A34A / #DCFCE7
- **Red (down/negative):** #DC2626 / #FEE2E2
- **Accent:** #2563EB (blue buttons/links)
- **Border:** #E2E8F0
- Font: Inter (clean, modern)

## Adding New Features

1. Backend route → `server/routes/newroute.js` แล้ว register ใน `server/index.js`
2. API call → `src/api/client.js`
3. State → `src/store/useStore.js`
4. Component → `src/components/NewComponent.jsx`
5. Page → `src/pages/NewPage.jsx` แล้วเพิ่ม route ใน `src/App.jsx`

## Known Limitations

- Yahoo Finance ไม่รับประกัน uptime — ถ้า 429 error ให้รอ 1-2 นาที
- Delayed ~15 min (ตลาดเปิด), realtime หลังตลาดปิด
- ข้อมูล 13F ของ investors อัพเดต quarterly (ล่าช้า 45 วัน)
- OHLCV history จาก Yahoo จำกัดที่ ~5 ปีสำหรับ range=5y

## Development Log

→ ดู DEVLOG.md
