import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(responseMessage(null, '未登录', -1))
    }
    return NextResponse.json(
      responseMessage({
        id: user.sub,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        provider: user.provider,
      })
    )
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
