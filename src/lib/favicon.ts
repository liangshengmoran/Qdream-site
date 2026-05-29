import fs from 'fs'
import path from 'path'

interface FaviconSource {
  name: string
  getUrl: (domain: string) => string
}

const SOURCES: FaviconSource[] = [
  {
    name: 'DuckDuckGo',
    getUrl: (domain) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  },
  {
    name: 'Google',
    getUrl: (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  },
  {
    name: 'Direct',
    getUrl: (domain) => `https://${domain}/favicon.ico`,
  },
]

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

async function tryDownload(url: string, timeoutMs = 5000): Promise<Buffer | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DreamSite/1.0)',
      },
    })
    if (!res.ok) return null

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('image') && !contentType.includes('octet-stream') && !contentType.includes('icon')) {
      return null
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    return buffer.length > 0 ? buffer : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchAndSaveFavicon(
  websiteUrl: string,
  userId: string,
  websiteId: string
): Promise<string | null> {
  const domain = extractDomain(websiteUrl)
  if (!domain) return null

  for (const source of SOURCES) {
    const url = source.getUrl(domain)
    const buffer = await tryDownload(url)
    if (buffer) {
      const relativeDir = `${userId}/${websiteId}`
      const dir = path.join(process.cwd(), 'public', 'uploads', 'logos', relativeDir)
      fs.mkdirSync(dir, { recursive: true })

      const filename = `${crypto.randomUUID()}.ico`
      const filePath = path.join(dir, filename)
      fs.writeFileSync(filePath, buffer)

      return `${relativeDir}/${filename}`
    }
  }

  return null
}
