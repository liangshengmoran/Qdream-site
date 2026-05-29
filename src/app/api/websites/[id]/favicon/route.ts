import { NextRequest, NextResponse } from 'next/server'

import { initDb, updateWebsite, getWebsiteById } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'
import { responseMessage } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) return NextResponse.json(responseMessage(null, '未登录', -1))

    const { id } = await params
    const website = getWebsiteById(id)
    if (!website) return NextResponse.json(responseMessage(null, '网站不存在', -1))

    try {
      const domain = new URL(website.url).hostname
      const faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`
      const data = updateWebsite(id, { logo: faviconUrl })
      return NextResponse.json(responseMessage(data))
    } catch {
      return NextResponse.json(responseMessage(null, '无效的 URL', -1))
    }
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
