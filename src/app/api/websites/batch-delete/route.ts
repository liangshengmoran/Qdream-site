import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

import { initDb, getWebsiteById, deleteWebsite } from '@/lib/db'
import { getDb } from '@/lib/db/connection'
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
      return NextResponse.json(responseMessage(null, '请选择要删除的网站', -1))
    }

    let deleted = 0
    let failed = 0

    for (const id of ids) {
      try {
        // Delete logo file if exists
        const website = getWebsiteById(id)
        if (website?.logo && !website.logo.startsWith('http')) {
          const logoPath = path.join(process.cwd(), 'public', 'uploads', 'logos', website.logo)
          if (fs.existsSync(logoPath)) {
            fs.unlinkSync(logoPath)
          }
        }

        deleteWebsite(id)
        deleted++
      } catch {
        failed++
      }
    }

    return NextResponse.json(responseMessage({ deleted, failed }))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
