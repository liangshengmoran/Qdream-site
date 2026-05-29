import { NextRequest, NextResponse } from 'next/server'

import { responseMessage } from '@/lib/utils'

async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DreamSite/1.0)',
        'Accept': 'text/html',
      },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function extractRedirect(html: string): string | null {
  // JS redirect: location.replace("http://...") 或 location.href = "http://..."
  const jsMatch = html.match(/location\.(?:replace|href)\s*[=\(]\s*["']([^"']+)["']/)
  if (jsMatch) return jsMatch[1]

  // meta refresh: <meta http-equiv="refresh" content="0;url=http://...">
  const metaMatch = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["']\d+;url=([^"'\s]+)["']/i)
  if (metaMatch) return metaMatch[1]

  return null
}

function decodeHtml(s: string): string {
  return s.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
}

async function fetchMetadata(url: string): Promise<{ title: string | null; description: string | null }> {
  const seen = new Set<string>()
  let currentUrl = url

  for (let i = 0; i < 3; i++) {
    if (seen.has(currentUrl)) break
    seen.add(currentUrl)

    const html = await fetchPage(currentUrl)
    if (!html) break

    // 如果响应很短（可能是跳转页），尝试提取跳转地址
    if (html.length < 500) {
      const redirect = extractRedirect(html)
      if (redirect) {
        currentUrl = redirect
        continue
      }
      // 如果是 https 且没有找到跳转，尝试 http
      if (currentUrl.startsWith('https://')) {
        currentUrl = currentUrl.replace('https://', 'http://')
        continue
      }
    }

    // 先检查是否仍是跳转页
    const redirect = extractRedirect(html)
    if (redirect && html.length < 1000) {
      currentUrl = redirect
      continue
    }

    // 提取 <title>
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    let title = titleMatch ? titleMatch[1].trim() : null

    // 提取 <meta name="description">
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
    let description = descMatch ? descMatch[1].trim() : null

    if (title) title = decodeHtml(title)
    if (description) description = decodeHtml(description)

    return { title, description }
  }

  return { title: null, description: null }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url) {
      return NextResponse.json(responseMessage(null, '缺少 url 参数', -1))
    }

    const metadata = await fetchMetadata(url)
    return NextResponse.json(responseMessage(metadata))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
