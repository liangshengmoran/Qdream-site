import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

import { initDb, updateWebsite } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(responseMessage(null, '未登录', -1))
    }

    const { id } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(responseMessage(null, '缺少 file 参数', -1))
    }

    const ext = file.name.split('.').pop()
    const filename = `${crypto.randomUUID()}.${ext}`
    const relativeDir = `${user.sub}/${id}`
    const dir = path.join(process.cwd(), 'public', 'uploads', 'logos', relativeDir)

    fs.mkdirSync(dir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = path.join(dir, filename)
    fs.writeFileSync(filePath, buffer)

    const logoPath = `${relativeDir}/${filename}`

    const data = updateWebsite(id, { logo: logoPath })
    if (!data) {
      // Rollback: delete uploaded file
      fs.unlinkSync(filePath)
      return NextResponse.json(responseMessage(null, '网站不存在', -1))
    }

    return NextResponse.json(responseMessage(data))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
