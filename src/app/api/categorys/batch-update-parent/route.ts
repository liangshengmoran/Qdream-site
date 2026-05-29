import { NextRequest, NextResponse } from 'next/server'
import { initDb, updateCategory } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json(responseMessage(null, '未登录', -1))

    const { ids, parent_id } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(responseMessage(null, '请选择分类', -1))
    }

    let updated = 0
    for (const id of ids) {
      try {
        const result = updateCategory(id, { parent_id: parent_id || null })
        if (result) updated++
      } catch { /* skip */ }
    }

    return NextResponse.json(responseMessage({ updated }))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
