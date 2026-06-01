# StockVision — Development Log

## 2026-06-01 — Session 1: Project Init

### เป้าหมาย Session นี้
- [x] สร้าง folder structure
- [x] เขียน CLAUDE.md (project bible)
- [x] Setup package.json + Vite + Tailwind
- [x] Backend: Express + SQLite + Yahoo Finance proxy
- [x] Frontend: React Router + Zustand store
- [x] Analysis algorithms: S/R, price targets, fundamental score
- [x] UI components: Header, Chart, Fundamentals, Analysis, Investors
- [x] Pages: Dashboard, StockDetail, Investors, Portfolio

### Tech Decisions
- **Vite** แทน CRA — เร็วกว่ามาก, HMR ดี
- **better-sqlite3** แทน postgres — ไม่ต้องตั้ง server, เก็บใน file เดียว
- **lightweight-charts** (TradingView free OSS) — candlestick chart สวย
- **Zustand** แทน Redux — lightweight, hooks-based, ไม่มี boilerplate
- **concurrently** — run Express + Vite พร้อมกันด้วย `npm run dev`
- **ไม่ใช้ AI API** — ประมวลผลทุกอย่างในโค้ดเอง

### Data Source Decision
Yahoo Finance (unofficial) ฟรี 100% ไม่ต้องใช้ API key:
- OHLCV: v8/finance/chart endpoint
- Fundamentals: v10/finance/quoteSummary endpoint
- Search: v1/finance/search endpoint
ต้องผ่าน Express proxy เพราะ CORS

### Analysis Algorithm v1
**S/R:** Swing high/low + clustering ภายใน 1.5%
**Score:** Weighted rubric 0-100 ใน 4 หมวด (Profitability/Growth/Value/Health)
**Price Target:** Graham Number (conservative) + P/E-based (base) + PEG-based (optimistic)

### Investor Data
Hardcoded Q4 2024 13F data สำหรับ Buffett, Cathie Wood, Ackman, Dalio, Burry
Update quarterly เมื่อ SEC release 13F ใหม่

---

## 2026-06-01 — Session 2: Apple-Style UI Redesign

### เป้าหมาย
- [x] Screenshot ดู UI เดิม วิเคราะห์ปัญหา
- [x] Redesign ทั้งหมดตามหลัก Apple HIG
- [x] แก้ bug Yahoo Finance 401 (quoteSummary ต้อง crumb)
- [x] แก้ bug chart endpoint (range → period1/period2)
- [x] Fix 52W High/Low field name (fiftyTwoWeekHigh ≠ 52WeekHigh)
- [x] ทดสอบทุกหน้าใน browser

### Design Changes
- **tailwind.config.js**: Apple system colors (#F5F5F7, #1D1D1F, #6E6E73, #AEAEB2, #30D158, #FF453A, #0071E3)
- **index.css**: ลบ border จาก card (ใช้แค่ shadow), pill buttons, stat-row component
- **Header**: glass blur effect, pill-shaped nav active state
- **Dashboard**: Index chips แบบ compact, Watchlist clean rows, Investors sidebar
- **StockDetail**: Hero price 48px, OHLCV strip, Apple-style tab bar
- **FundamentalsPanel**: Section headers uppercase, clean stat rows
- **AnalysisPanel**: Color bars สำหรับ S/R strength, price target rows

### Bug Fixes
- **yahoo-finance2 v3**: ต้อง `new YahooFinance()` แทน default import
- **chart()**: ต้องใช้ `period1/period2` ไม่ใช่ `range`
- **52W fields**: `fiftyTwoWeekHigh/Low` ไม่ใช่ `52WeekHigh/Low`
- **quoteSummary 401**: เปลี่ยนจาก axios manual → yahoo-finance2 ที่จัดการ crumb อัตโนมัติ

### ผลลัพธ์
- Dashboard: Markets + Watchlist + Investors sidebar ✅
- StockDetail: Price hero + Chart + S/R lines + Fundamentals panel ✅  
- Investors: Left panel list + Right detail + Weight bars ✅
- Portfolio: P&L tracking ✅
- Search: Autocomplete ✅

---

## 2026-06-01 — Session 3: Auth · CEO Portfolio · Education · Community

### เป้าหมาย
- [x] ระบบล็อกอิน (Register/Login ด้วย JWT + bcrypt)
- [x] CEO Portfolio — พอร์ตตัวอย่างอัพเดตตามราคาตลาดจริง
- [x] หน้า /learn — Education page แบบ scroll animation 9 บท
- [x] หน้า Community — พอร์ตที่นักลงทุนแชร์สาธารณะ
- [x] หน้า /share/:token — ดูพอร์ตที่แชร์ มี live P&L
- [x] Header ใหม่ — Login button, user dropdown menu

### New Files
- `server/middleware/auth.js` — JWT sign/verify, requireAuth, optionalAuth
- `server/routes/auth.js` — register, login, me, togglePublic
- `server/routes/ceo.js` — CEO Portfolio ดึงราคา live จาก Yahoo Finance
- `src/store/useAuth.js` — Zustand auth store with persist
- `src/components/AuthModal.jsx` — Register/Login modal
- `src/pages/LearnPage.jsx` — Education page, 9 sections, scroll fade-in
- `src/pages/CommunityPage.jsx` — Public portfolios + SharedPortfolioPage

### Updated Files
- `server/db.js` — เพิ่ม users table, safe ALTER TABLE migration
- `server/index.js` — เพิ่ม /api/auth, /api/ceo routes
- `server/routes/portfolio.js` — เพิ่ม /community, /share/:token endpoints
- `src/api/client.js` — เพิ่ม authApi, ceoApi, JWT interceptor
- `src/App.jsx` — routes: /learn, /community, /share/:token
- `src/components/Header.jsx` — Login button + user dropdown
- `src/pages/Dashboard.jsx` — CeoPortfolioStrip section

### ผลลัพธ์
- CEO Portfolio: +81.3% total gain (live), ARM +176.8%, LLY +289.4%
- Auth register/login ✅ JWT 30 วัน, bcrypt salt 10
- Build ผ่าน ✅ 0 errors

### Education Page Content (9 บท)
1. คำศัพท์พื้นฐาน (Stock, Market Cap, P/E, EPS, Dividend, Beta, ROE, FCF)
2. แนวรับแนวต้าน (Support / Resistance / Breakout)
3. จะเริ่มซื้อหุ้นดูอะไรก่อน (6 ขั้นตอน)
4. หุ้น vs ETF vs ตราสารหนี้ (Comparison + Risk bars)
5. S&P 500 (500 บริษัท, Sector weights, Top 10 holdings, VOO/SPY/IVV)
6. Nasdaq 100 (100 บริษัท, Top 10 holdings, QQQM/QQQ)
7. VTI (3700+ หุ้น, Total Market)
8. การแบ่งพอร์ต (Conservative/Moderate/Aggressive, Rule of Thumb, กฎ 5%)
9. DCA ค่าเฉลี่ยต้นทุน (ตัวอย่าง + ทำไม DCA ถึงได้ผล)

### Next Session
- Deploy: Frontend → Vercel, Backend → Railway (PostgreSQL migration)
- Stock Screener: กรองตาม Fundamental Score, P/E, Market Cap
- Portfolio sharing: toggle public/private ใน UI
- PortfolioPage: integrate user_id เพื่อ save ตาม user
- หน้า Screener (/screener)

---

## Session Template (copy for next session)

## YYYY-MM-DD — Session N: [Topic]

### เป้าหมาย
- [ ] ...

### Changes
- ...

### Issues / Bugs
- ...

### Next Session
- ...
