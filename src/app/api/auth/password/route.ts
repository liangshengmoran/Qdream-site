import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { initDb } from '@/lib/db'
import { getDb } from '@/lib/db/connection'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json(responseMessage(null, '未登录', -1))

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json(responseMessage(null, '参数不完整', 500))
    }
    if (newPassword.length < 6) {
      return NextResponse.json(responseMessage(null, '新密码长度至少6位', 500))
    }

    const db = getDb()
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.sub) as { password_hash: string }
    const valid = await bcrypt.compare(currentPassword, row.password_hash)
    if (!valid) return NextResponse.json(responseMessage(null, '当前密码错误', 500))

    const hash = await bcrypt.hash(newPassword, 10)
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(hash, new Date().toISOString(), user.sub)

    return NextResponse.json(responseMessage(null))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
