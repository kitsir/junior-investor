import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'stockvision-secret-2024'

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'ต้องล็อกอินก่อน' })
  }
  try {
    req.user = verifyToken(header.slice(7))
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Token หมดอายุ' })
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try { req.user = verifyToken(header.slice(7)) } catch {}
  }
  next()
}
