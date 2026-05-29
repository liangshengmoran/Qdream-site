import { NextRequest, NextResponse } from 'next/server'

import { RESPONSE } from '@/enums'
import { initDb, updateCategory, deleteCategory } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json(responseMessage(null, '未登录', -1))
    const { id } = await params
    const body = await request.json()

    try {
      const data = updateCategory(id, {
        name: body.name,
        sort: body.sort,
        private: body.private,
        parent_id: body.parent_id,
      })
      if (!data) {
        return NextResponse.json(responseMessage(null, '分类不存在', RESPONSE.ERROR))
      }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json(responseMessage(null, '未登录', -1))
    const { id } = await params

    const data = deleteCategory(id)
    if (!data) {
      return NextResponse.json(responseMessage(null, '分类不存在或存在子分类，无法删除', RESPONSE.ERROR))
    }
    return NextResponse.json(responseMessage(data))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
