import { type NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from './jwt'
import { getDb } from '@/lib/db/connection'
import { initDb } from '@/lib/db'

const COOKIE_NAME = 'auth_token'

function hasUsers(): boolean {
  initDb()
  const db = getDb()
  const r = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  return r.c > 0
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const path = request.nextUrl.pathname

  // Home page and API routes are always allowed
  if (path === '/' || path.startsWith('/api/')) {
    return response
  }

  // Setup page is always allowed
  if (path === '/setup') {
    // If users already exist, redirect away from setup
    if (hasUsers()) {
      const token = request.cookies.get(COOKIE_NAME)?.value
      const u = token ? await verifyJwt(token) : null
      return NextResponse.redirect(new URL(u ? '/admin' : '/login', request.url))
    }
    return response
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const user = token ? await verifyJwt(token) : null

  // No users exist yet → redirect to setup
  if (!hasUsers() && path !== '/setup') {
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  if (user && path.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!user && !path.startsWith('/login')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  return response
}
