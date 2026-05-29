import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { initDb } from '@/lib/db'
import { getDb } from '@/lib/db/connection'
import { getCurrentUser } from '@/lib/auth/server'
import { signJwt } from '@/lib/auth/jwt'
import { getCookieOptions } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars')

export async function POST(request: NextRequest) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json(responseMessage(null, '未登录', -1))

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json(responseMessage(null, '缺少文件', -1))

    // Ensure upload directory exists
    const userDir = path.join(UPLOAD_DIR, user.sub)
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true })

    const ext = file.name.split('.').pop() || 'png'
    const filename = `avatar.${ext}`
    const filePath = path.join(userDir, filename)
    fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()))
    console.log('[avatar] saved to:', filePath, 'exists:', fs.existsSync(filePath))

    const avatarUrl = `/api/avatar/${user.sub}?t=${Date.now()}`
    const db = getDb()
    db.prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?').run(avatarUrl, new Date().toISOString(), user.sub)

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.sub) as Record<string, unknown>
    const token = await signJwt({
      sub: updated.id as string,
      email: updated.email as string,
      name: (updated.name as string) || null,
      avatar_url: avatarUrl,
      provider: updated.provider as string,
    })

    const resp = NextResponse.json(responseMessage({ avatar_url: avatarUrl }))
    resp.cookies.set('auth_token', token, getCookieOptions())
    return resp
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
