import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { findUserByEmail, signJwt } from '@/lib/auth/jwt'
import { getCookieOptions } from '@/lib/auth/server'
import { initDb } from '@/lib/db'
import { responseMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  initDb()
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(responseMessage(null, '邮箱和密码不能为空', 500))
    }

    const user = findUserByEmail(email)
    if (!user) {
      return NextResponse.json(responseMessage(null, '用户不存在', 500))
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json(responseMessage(null, '密码错误', 500))
    }

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      provider: user.provider,
    })

    const response = NextResponse.json(
      responseMessage({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        provider: user.provider,
      })
    )
    response.cookies.set('auth_token', token, getCookieOptions())
    return response
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
