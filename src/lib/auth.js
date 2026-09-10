import { SignJWT, jwtVerify } from 'jose'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return new TextEncoder().encode(secret)
}

// Hashed password for the admin account.
// bcrypt hash generated at build time - stored in env or hardcoded
export const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$rOzJqKqKqKqKqKqKqKqKqOzJqKqKqKqKqKqKqKqKqKqKqKqKqKqKq'
export const ADMIN_USERNAME = 'admin'

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(getSecret())
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

export function getAuthCookie(request) {
  return request.cookies.get('void_auth')?.value
}
