import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { initDb } from '@/lib/db'
import { getDb } from '@/lib/db/connection'
import { getCurrentUser } from '@/lib/auth/server'
import { signJwt } from '@/lib/auth/jwt'
import { getCookieOptions } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json(responseMessage(null, '未登录', -1))

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json(responseMessage(null, '缺少文件', -1))

    const ext = file.name.split('.').pop()
    const filename = `avatar.${ext}`
    const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars', user.sub)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, filename), Buffer.from(await file.arrayBuffer()))

    const avatarUrl = `/uploads/avatars/${user.sub}/${filename}?t=${Date.now()}`
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
