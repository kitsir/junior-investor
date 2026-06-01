import { useState } from 'react'
import { X } from 'lucide-react'
import { authApi } from '../api/client.js'
import useAuth from '../store/useAuth.js'

export default function AuthModal({ onClose }) {
  const { login } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'login' ? authApi.login : authApi.register
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }
      const res = await fn(payload)
      if (!res.success) throw new Error(res.error)
      login(res.user, res.token)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 380, padding: '28px 28px 24px', position: 'relative' }}>
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          <X size={14} />
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.025em', marginBottom: 4 }}>
          {mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
        </h2>
        <p style={{ fontSize: 13, color: '#6E6E73', marginBottom: 24 }}>
          {mode === 'login' ? 'ยินดีต้อนรับกลับมา' : 'บันทึกพอร์ตและแชร์ให้คนอื่นดูได้'}
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6E6E73', display: 'block', marginBottom: 5 }}>
                ชื่อ
              </label>
              <input
                className="input"
                placeholder="ชื่อของคุณ"
                value={form.name}
                onChange={set('name')}
                required
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6E6E73', display: 'block', marginBottom: 5 }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6E6E73', display: 'block', marginBottom: 5 }}>
              รหัสผ่าน
            </label>
            <input
              className="input"
              type="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#C93226', background: 'rgba(255,69,58,0.08)', padding: '8px 12px', borderRadius: 10 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4, padding: '10px 0', fontSize: 14 }}
            disabled={loading}
          >
            {loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
            style={{ fontSize: 13, color: '#0071E3', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {mode === 'login' ? 'ยังไม่มีบัญชี? สร้างบัญชีใหม่' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
          </button>
        </div>
      </div>
    </div>
  )
}
