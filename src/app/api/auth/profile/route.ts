import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { getDb } from '@/lib/db/connection'
import { getCurrentUser } from '@/lib/auth/server'
import { findUserByEmail, signJwt } from '@/lib/auth/jwt'
import { getCookieOptions } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json(responseMessage(null, '未登录', -1))

    const { name, email } = await request.json()
    const db = getDb()

    if (email && email !== user.email) {
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        return NextResponse.json(responseMessage(null, '邮箱格式不正确', 500))
      }
      const existing = findUserByEmail(email)
      if (existing) return NextResponse.json(responseMessage(null, '该邮箱已被使用', 500))
    }

    const sets: string[] = []
    const vals: unknown[] = []
    if (name !== undefined) { sets.push('name = ?'); vals.push(name) }
    if (email && email !== user.email) { sets.push('email = ?'); vals.push(email) }

    if (sets.length === 0) {
      return NextResponse.json(responseMessage(null, '没有需要更新的信息'))
    }

    sets.push('updated_at = ?'); vals.push(new Date().toISOString())
    vals.push(user.sub)
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals)

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.sub) as Record<string, unknown>

    const token = await signJwt({
      sub: updated.id as string,
      email: updated.email as string,
      name: (updated.name as string) || null,
      avatar_url: (updated.avatar_url as string) || null,
      provider: updated.provider as string,
    })

    const resp = NextResponse.json(responseMessage({ name: updated.name, email: updated.email }))
    resp.cookies.set('auth_token', token, getCookieOptions())
    return resp
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
