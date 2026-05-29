import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { getDb } from '@/lib/db/connection'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

const ENV_DEFAULTS: Record<string, string> = {
  app_name: process.env.NEXT_PUBLIC_APP_NAME || '',
  app_desc: process.env.NEXT_PUBLIC_APP_DESC || '',
  app_keywords: process.env.NEXT_PUBLIC_APP_KEYWORDS || '',
  app_url: process.env.NEXT_PUBLIC_APP_URL || '',
  copyright: process.env.NEXT_PUBLIC_COPYRIGHT || '',
  copyright_url: process.env.NEXT_PUBLIC_APP_URL || '',
  icp: process.env.NEXT_PUBLIC_ICP || '',
  guan_icp: process.env.NEXT_PUBLIC_GUAN_ICP || '',
  umami_id: process.env.NEXT_PUBLIC_UMAMI_ID || '',
  google_id: process.env.NEXT_PUBLIC_GOOGLE_ID || '',
  clarity_id: process.env.NEXT_PUBLIC_CLARITY_ID || '',
  github_url: 'https://github.com/baiwumm/dream-site',
  blog_url: 'https://baiwumm.com',
  site_logo: '',
}

export async function GET() {
  initDb()
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM site_settings').all() as { key: string; value: string }[]

  const settings: Record<string, string> = { ...ENV_DEFAULTS }
  for (const row of rows) {
    if (row.value !== undefined && row.value !== null) settings[row.key] = row.value
  }

  return NextResponse.json(responseMessage(settings))
}

export async function POST(request: NextRequest) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json(responseMessage(null, '未登录', -1))

    const body = await request.json()
    const db = getDb()
    const upsert = db.prepare('INSERT OR REPLACE INTO site_settings (key, value) VALUES (?, ?)')

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        upsert.run(key, value)
      }
    }

    return NextResponse.json(responseMessage(null))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
