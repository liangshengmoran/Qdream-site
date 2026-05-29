import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

import { RESPONSE } from '@/enums'
import { initDb, updateWebsite, deleteWebsite, getWebsiteById } from '@/lib/db'
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
      const data = updateWebsite(id, body)
      if (!data) {
        return NextResponse.json(responseMessage(null, '网站不存在', RESPONSE.ERROR))
      }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(responseMessage(null, '未登录', -1))
    }

    const { id: siteId } = await params

    const website = getWebsiteById(siteId)
    // 只删除本地 logo 文件（跳过外部 URL）
    if (website?.logo && !website.logo.startsWith('http')) {
      const logoPath = path.join(process.cwd(), 'public', 'uploads', 'logos', website.logo)
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath)
      }
      // Clean up empty parent directories
      const siteDir = path.dirname(logoPath)
      try {
        fs.rmdirSync(siteDir)
      } catch { /* directory not empty, ignore */ }
      try {
        const userDir = path.dirname(siteDir)
        fs.rmdirSync(userDir)
      } catch { /* directory not empty, ignore */ }
    }

    const data = deleteWebsite(siteId)
    if (!data) {
      return NextResponse.json(responseMessage(null, '网站不存在', RESPONSE.ERROR))
    }
    return NextResponse.json(responseMessage(data))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
