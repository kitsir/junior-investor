import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import StockDetail from './pages/StockDetail.jsx'
import InvestorsPage from './pages/InvestorsPage.jsx'
import PortfolioPage from './pages/PortfolioPage.jsx'
import LearnPage from './pages/LearnPage.jsx'
import CommunityPage, { SharedPortfolioPage } from './pages/CommunityPage.jsx'

import CeoPortfolioDetail from './pages/CeoPortfolioDetail.jsx'

import DcaCalculatorPage from './pages/DcaCalculatorPage.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <main className="max-w-[1600px] w-full mx-auto px-6 md:px-8 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
          <Route path="/investors" element={<InvestorsPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/dca-calculator" element={<DcaCalculatorPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/share/:token" element={<SharedPortfolioPage />} />
          <Route path="/ceo-portfolio" element={<CeoPortfolioDetail />} />
        </Routes>
      </main>
    </div>
  )
}
