import { NextResponse } from 'next/server'
import { initDb, getCategoryTree } from '@/lib/db'
import { getDb } from '@/lib/db/connection'

function folderToHtml(cats: App.Category[], indent = ''): string {
  let html = ''
  for (const cat of cats) {
    html += `${indent}<DT><H3>${escapeHtml(cat.name)}</H3>\n`
    html += `${indent}<DL><p>\n`

    // Websites
    for (const w of cat.websites) {
      html += `${indent}  <DT><A HREF="${escapeAttr(w.url)}">${escapeHtml(w.name)}</A>\n`
    }

    // Children
    html += folderToHtml(cat.children || [], indent + '  ')

    html += `${indent}</DL><p>\n`
  }
  return html
}

function escapeHtml(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function escapeAttr(s: string) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;') }

export async function GET() {
  initDb()
  const db = getDb()
  const settings = db.prepare('SELECT key, value FROM site_settings').all() as { key: string; value: string }[]
  const settingMap: Record<string, string> = {}
  for (const s of settings) settingMap[s.key] = s.value

  const appName = settingMap.app_name || process.env.NEXT_PUBLIC_APP_NAME || 'Dream Site'
  const categories = getCategoryTree({ showPrivate: true })

  const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>${escapeHtml(appName)} - Bookmarks</TITLE>
<H1>${escapeHtml(appName)} - Bookmarks</H1>
<DL><p>
  <DT><H3>${escapeHtml(appName)}</H3>
  <DL><p>
${folderToHtml(categories, '    ')}
  </DL><p>
</DL><p>
`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="dream-site-bookmarks.html"`,
    },
  })
}
