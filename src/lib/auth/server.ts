import { type NextRequest } from 'next/server'
import { verifyJwt, type JwtPayload } from './jwt'

const COOKIE_NAME = 'auth_token'

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  }
}

export async function getCurrentUser(
  request: NextRequest
): Promise<JwtPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyJwt(token)
}
