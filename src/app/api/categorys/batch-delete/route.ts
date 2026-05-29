import { NextRequest, NextResponse } from 'next/server'

import { initDb, deleteCategory, getCategorysList } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(responseMessage(null, '未登录', -1))
    }

    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(responseMessage(null, '请选择要删除的分类', -1))
    }

    // 检查是否有关联网站
    const { list } = getCategorysList({ pageIndex: 0, pageSize: 9999 })
    const withWebsites: string[] = []

    for (const id of ids) {
      const cat = list.find((c) => c.id === id)
      if (cat && cat.websites.length > 0) {
        withWebsites.push(cat.name)
      }
    }

    if (withWebsites.length > 0) {
      return NextResponse.json(
        responseMessage(null, `以下分类存在关联网站，无法删除：${withWebsites.join('、')}`, -1)
      )
    }

    let deleted = 0
    let failed = 0

    for (const id of ids) {
      try {
        const result = deleteCategory(id)
        if (result) deleted++
        else failed++
      } catch {
        failed++
      }
    }

    return NextResponse.json(responseMessage({ deleted, failed }))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
