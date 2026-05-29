import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createUser, findUserByEmail, signJwt } from '@/lib/auth/jwt'
import { getCookieOptions } from '@/lib/auth/server'
import { initDb } from '@/lib/db'
import { getDb } from '@/lib/db/connection'
import { responseMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  initDb()
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(responseMessage(null, '邮箱和密码不能为空', 500))
    }

    const db = getDb()
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c

    // Only allow setup when no users exist
    if (userCount > 0) {
      return NextResponse.json(responseMessage(null, '已存在管理员账号，禁止注册', 500))
    }

    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      return NextResponse.json(responseMessage(null, '邮箱格式不正确', 500))
    }

    if (password.length < 6) {
      return NextResponse.json(responseMessage(null, '密码长度至少6位', 500))
    }

    const existing = findUserByEmail(email)
    if (existing) {
      return NextResponse.json(responseMessage(null, '该邮箱已被注册', 500))
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = createUser({ email, passwordHash })

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      provider: user.provider,
    })

    const response = NextResponse.json(
      responseMessage({ id: user.id, email: user.email })
    )
    response.cookies.set('auth_token', token, getCookieOptions())
    return response
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
