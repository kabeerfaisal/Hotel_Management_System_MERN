import jwt from 'jsonwebtoken'

/**
 * Protect a route by requiring a valid Bearer token.
 * On success attaches { id, role } to req.user for downstream handlers.
 */
export function protect(req, res, next) {
  const authorization = req.headers.authorization ?? ''

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: a Bearer token is required',
    })
  }

  const token = authorization.slice('Bearer '.length).trim()

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: a Bearer token is required',
    })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    req.user = {
      id: payload.id,
      role: payload.role,
    }

    return next()
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Session expired, please log in again'
        : 'Invalid or expired token'

    return res.status(401).json({ success: false, message })
  }
}

/**
 * Restrict a route to one or more roles.
 * Must run after `protect` so req.user is populated.
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: authentication is required',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: you do not have permission to access this resource',
      })
    }

    return next()
  }
}

export default protect
