import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars', userId)
  if (!fs.existsSync(dir)) return new NextResponse('Not Found', { status: 404 })

  // 找到目录下第一个文件
  const files = fs.readdirSync(dir).filter(f => f.startsWith('avatar.'))
  if (files.length === 0) return new NextResponse('Not Found', { status: 404 })

  const filePath = path.join(dir, files[0])
  const ext = path.extname(filePath).slice(1)
  const mimeMap: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon' }
  const contentType = mimeMap[ext] || 'application/octet-stream'

  const buffer = fs.readFileSync(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
