import { NextResponse } from 'next/server'
import { getCookieOptions } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function POST() {
  const response = NextResponse.json(responseMessage(null, '已退出登录'))
  response.cookies.set('auth_token', '', { ...getCookieOptions(), maxAge: 0 })
  return response
}
