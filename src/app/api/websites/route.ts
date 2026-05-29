import { NextRequest, NextResponse } from 'next/server'

import { RESPONSE } from '@/enums'
import { initDb, getWebsitesList, createWebsite } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    initDb()
    const searchParams = request.nextUrl.searchParams
    const pageIndex = Number(searchParams.get('pageIndex') || '0')
    const pageSize = Number(searchParams.get('pageSize') || '10')
    const name = searchParams.get('name')
    const category_id = searchParams.get('category_id')

    if (Number.isNaN(pageIndex) || Number.isNaN(pageSize) || pageIndex < 0 || pageSize <= 0) {
      return NextResponse.json(responseMessage(null, '参数错误', RESPONSE.ERROR))
    }

    const { list, total } = getWebsitesList({ pageIndex, pageSize, name, category_id })

    return NextResponse.json(responseMessage({
      list,
      total,
      page: pageIndex + 1,
      pageSize,
    }))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}

export async function POST(request: NextRequest) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(responseMessage(null, '请先登录', -1))
    }

    const body = await request.json()

    try {
      const data = createWebsite({
        name: body.name,
        desc: body.desc,
        url: body.url,
        logo: body.logo,
        logoAccent: body.logoAccent,
        tags: body.tags,
        pinned: body.pinned,
        recommend: body.recommend,
        vpn: body.vpn,
        commonlyUsed: body.commonlyUsed,
        sort: body.sort,
        category_id: body.category_id,
        userId: user.sub,
        email: user.email,
      })
      return NextResponse.json(responseMessage(data))
    } catch (err: unknown) {
      const msg = (err as Error).message || ''
      if (msg.includes('UNIQUE constraint') || msg.includes('SQLITE_CONSTRAINT')) {
        return NextResponse.json(responseMessage(null, '网站名称已存在！', -1))
      }
      throw err
    }
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
