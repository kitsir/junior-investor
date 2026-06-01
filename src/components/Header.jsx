import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TrendingUp, LogIn, LogOut, User, ChevronDown, Moon, Sun } from 'lucide-react'
import StockSearch from './StockSearch.jsx'
import AuthModal from './AuthModal.jsx'
import useAuth from '../store/useAuth.js'
import TickerTape from './TickerTape.jsx'

const NAV = [
  { path: '/', label: 'Dashboard' },
  { path: '/investors', label: 'Investors' },
  { path: '/community', label: 'Community' },
  { path: '/learn', label: 'Investment Education' },
  { path: '/dca-calculator', label: 'DCA Calculator' },
  { path: '/portfolio', label: 'Portfolio' },
]

export default function Header() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  
  // Theme toggle
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return (
    <>
      <header className="sticky top-0 z-40 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--glass)', backdropFilter: 'blur(16px)' }}>
        <TickerTape />
        <div className="max-w-[1600px] w-full mx-auto px-6 md:px-8 h-[60px] flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 no-underline">
            <div
              className="w-[32px] h-[32px] rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg, var(--primary), #60A5FA)' }}
            >
              <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-bold text-ink tracking-tight">
              Junior Investor
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV.map(({ path, label }) => {
              const active = pathname === path || (path !== '/' && pathname.startsWith(path))
              return (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-1.5 rounded-md text-[14px] font-medium transition-all no-underline ${
                    active 
                      ? 'text-white' 
                      : 'text-secondary hover:text-ink'
                  }`}
                  style={{ background: active ? 'var(--primary)' : 'transparent' }}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side: search + auth */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="w-[300px]">
              <StockSearch />
            </div>

            <button 
              onClick={() => setIsDark(!isDark)}
              className="btn-icon"
              title="Toggle theme"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(m => !m)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold text-[13px] border-none cursor-pointer transition-colors"
                  style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}
                >
                  <User size={14} />
                  {user.name}
                  <ChevronDown size={12} />
                </button>
                {showMenu && (
                  <div
                    className="card absolute right-0 top-[110%] min-w-[160px] py-2 z-[100]"
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    <Link
                      to="/portfolio"
                      className="block px-4 py-2.5 text-[14px] text-ink no-underline"
                      onClick={() => setShowMenu(false)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--divider)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      พอร์ตของฉัน
                    </Link>
                    <Link
                      to={`/share/${user.shareToken}`}
                      className="block px-4 py-2.5 text-[14px] text-ink no-underline"
                      onClick={() => setShowMenu(false)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--divider)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      ลิงก์แชร์พอร์ต
                    </Link>
                    <hr className="divider my-1" />
                    <button
                      onClick={() => { logout(); setShowMenu(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-[14px] text-[#EF4444] bg-transparent border-none cursor-pointer transition-colors"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--down-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={13} />
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-[14px]"
              >
                <LogIn size={14} />
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
