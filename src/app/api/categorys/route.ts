import { NextRequest, NextResponse } from 'next/server'

import { RESPONSE } from '@/enums'
import { initDb, getCategorysList, createCategory, getCategoryTree } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    initDb()
    const searchParams = request.nextUrl.searchParams
    const pageIndex = Number(searchParams.get('pageIndex') || '0')
    const pageSize = Number(searchParams.get('pageSize') || '10')
    const name = searchParams.get('name')
    const tree = searchParams.get('tree') === '1'

    if (Number.isNaN(pageIndex) || Number.isNaN(pageSize) || pageIndex < 0 || pageSize <= 0) {
      return NextResponse.json(responseMessage(null, '参数错误', RESPONSE.ERROR))
    }

    // 检查登录态 + 显式 showPrivate 参数
    const user = await getCurrentUser(request)
    const showPrivate = searchParams.get('showPrivate') === '1' ? true : searchParams.get('showPrivate') === '0' ? false : !!user

    if (tree) {
      // 树形结构（首页目录用）
      const categories = getCategoryTree({ showPrivate })
      return NextResponse.json(responseMessage(categories))
    }

    const { list, total } = getCategorysList({ pageIndex, pageSize, name, showPrivate })

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
      const data = createCategory({
        name: body.name,
        sort: body.sort,
        private: body.private,
        parent_id: body.parent_id,
        userId: user.sub,
        email: user.email,
      })
      return NextResponse.json(responseMessage(data))
    } catch (err: unknown) {
      const msg = (err as Error).message || ''
      if (msg.includes('UNIQUE constraint') || msg.includes('SQLITE_CONSTRAINT')) {
        return NextResponse.json(responseMessage(null, '分类名称已存在！', -1))
      }
      throw err
    }
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
