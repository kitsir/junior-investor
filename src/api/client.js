import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
const api = axios.create({ baseURL: BASE, timeout: 15000 })

// Attach JWT automatically
api.interceptors.request.use(cfg => {
  try {
    const raw = localStorage.getItem('sv-auth')
    if (raw) {
      const { state } = JSON.parse(raw)
      if (state?.token) cfg.headers.Authorization = `Bearer ${state.token}`
    }
  } catch {}
  return cfg
})

export const stocksApi = {
  search: (q) => api.get(`/stocks/search?q=${encodeURIComponent(q)}`).then(r => r.data),
  quote: (ticker) => api.get(`/stocks/${ticker}/quote`).then(r => r.data),
  chart: (ticker, range = '1y', interval = '1d') =>
    api.get(`/stocks/${ticker}/chart?range=${range}&interval=${interval}`).then(r => r.data),
  fundamentals: (ticker) => api.get(`/stocks/${ticker}/fundamentals`).then(r => r.data),
}

export const portfolioApi = {
  getWatchlist: () => api.get('/portfolio/watchlist').then(r => r.data),
  addWatchlist: (ticker) => api.post('/portfolio/watchlist', { ticker }).then(r => r.data),
  removeWatchlist: (ticker) => api.delete(`/portfolio/watchlist/${ticker}`).then(r => r.data),

  getPositions: () => api.get('/portfolio/positions').then(r => r.data),
  addPosition: (data) => api.post('/portfolio/positions', data).then(r => r.data),
  updatePosition: (id, data) => api.put(`/portfolio/positions/${id}`, data).then(r => r.data),
  deletePosition: (id) => api.delete(`/portfolio/positions/${id}`).then(r => r.data),

  getNotes: (ticker) => api.get(`/portfolio/notes/${ticker}`).then(r => r.data),
  addNote: (ticker, content) => api.post('/portfolio/notes', { ticker, content }).then(r => r.data),
  deleteNote: (id) => api.delete(`/portfolio/notes/${id}`).then(r => r.data),

  community: () => api.get('/portfolio/community').then(r => r.data),
  shared: (token) => api.get(`/portfolio/share/${token}`).then(r => r.data),
}

export const investorsApi = {
  getAll: () => api.get('/investors').then(r => r.data),
  getOne: (id) => api.get(`/investors/${id}`).then(r => r.data),
}

export const ceoApi = {
  get: () => api.get('/ceo').then(r => r.data),
}

export const authApi = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
  togglePublic: (isPublic) => api.patch('/auth/public', { isPublic }).then(r => r.data),
}
