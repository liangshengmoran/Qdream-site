import { NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { getDb } from '@/lib/db/connection'
import { responseMessage } from '@/lib/utils'

export async function GET() {
  initDb()
  const db = getDb()
  const c = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  return NextResponse.json(responseMessage({ hasUsers: c > 0 }))
}
