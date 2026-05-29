import { NextRequest, NextResponse } from 'next/server'

import { initDb, createCategory, createWebsite } from '@/lib/db'
import { getDb } from '@/lib/db/connection'
import { getCurrentUser } from '@/lib/auth/server'
import { parseBookmarkHtml } from '@/lib/bookmark-parser'
import type { ParsedFolder } from '@/lib/bookmark-parser'
import { responseMessage } from '@/lib/utils'

async function fetchDescription(url: string): Promise<string | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DreamSite/1.0)', 'Accept': 'text/html' },
    })
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
    return match ? match[1].trim() : null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

interface ImportContext {
  user: { sub: string; email: string }
  existingCategories: Map<string, string>
  existingUrls: Set<string>
  createdCategories: number
  createdWebsites: number
  skippedCategories: number
  skippedWebsites: number
  createdIds: string[]
  sortCounter: number
}

function importFolder(folder: ParsedFolder, ctx: ImportContext, parentId: string | null = null) {
  // Create or reuse the category
  let categoryId = ctx.existingCategories.get(folder.name)

  if (!categoryId) {
    try {
      const cat = createCategory({
        name: folder.name,
        parent_id: parentId,
        sort: ctx.sortCounter--,
        userId: ctx.user.sub,
        email: ctx.user.email,
      })
      categoryId = cat.id
      ctx.existingCategories.set(folder.name, categoryId)
      ctx.createdCategories++
    } catch {
      ctx.skippedCategories++
      return
    }
  }

  // Create websites for this folder
  for (const bm of folder.bookmarks) {
    if (!bm.url || ctx.existingUrls.has(bm.url)) {
      ctx.skippedWebsites++
      continue
    }
    try {
      const site = createWebsite({
        name: bm.title || bm.url,
        url: bm.url,
        category_id: categoryId,
        sort: ctx.sortCounter--,
        userId: ctx.user.sub,
        email: ctx.user.email,
      })
      ctx.existingUrls.add(bm.url)
      ctx.createdWebsites++
      ctx.createdIds.push(site.id)
    } catch {
      ctx.skippedWebsites++
    }
  }

  // Recursively process children
  for (const child of folder.children) {
    importFolder(child, ctx, categoryId)
  }
}

export async function POST(request: NextRequest) {
  try {
    initDb()
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(responseMessage(null, '未登录', -1))
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(responseMessage(null, '缺少文件', -1))
    }

    const html = await file.text()
    const folders = parseBookmarkHtml(html)

    const db = getDb()
    const existingCategories = db.prepare('SELECT id, name FROM ds_categorys').all() as { id: string; name: string }[]
    const existingWebsites = db.prepare('SELECT url FROM ds_websites').all() as { url: string }[]

    const ctx: ImportContext = {
      user: { sub: user.sub, email: user.email },
      existingCategories: new Map(existingCategories.map((c) => [c.name, c.id])),
      existingUrls: new Set(existingWebsites.map((w) => w.url)),
      createdCategories: 0,
      createdWebsites: 0,
      skippedCategories: 0,
      skippedWebsites: 0,
      createdIds: [],
      sortCounter: 99999,
    }

    for (const folder of folders) {
      importFolder(folder, ctx, null)
    }

    // 直接使用外部 favicon URL + 获取描述
    if (ctx.createdIds.length > 0) {
      const db2 = getDb()
      const sites = db2
        .prepare(`SELECT id, url FROM ds_websites WHERE id IN (${ctx.createdIds.map(() => '?').join(',')})`)
        .all(...ctx.createdIds) as { id: string; url: string }[]

      Promise.allSettled(
        sites.map((w) => {
          try {
            const domain = new URL(w.url).hostname
            db2.prepare('UPDATE ds_websites SET logo = ? WHERE id = ?').run(`https://icons.duckduckgo.com/ip3/${domain}.ico`, w.id)
          } catch { /* ignore */ }
          fetchDescription(w.url).then((desc) => {
            if (desc) db2.prepare('UPDATE ds_websites SET "desc" = ? WHERE id = ?').run(desc, w.id)
          }).catch(() => {})
        })
      ).catch(() => {})
    }

    return NextResponse.json(
      responseMessage({
        createdCategories: ctx.createdCategories,
        createdWebsites: ctx.createdWebsites,
        skippedCategories: ctx.skippedCategories,
        skippedWebsites: ctx.skippedWebsites,
      })
    )
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
