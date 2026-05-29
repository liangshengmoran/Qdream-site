import { getDb } from './connection'

function rowToWebsite(row: Record<string, unknown>): App.Website {
  return {
    id: row.id as string,
    name: row.name as string,
    desc: (row.desc as string) || null,
    logo: (row.logo as string) || null,
    logoAccent: (row.logoAccent as string) || null,
    url: row.url as string,
    tags: JSON.parse((row.tags as string) || '[]'),
    pinned: !!row.pinned,
    recommend: !!row.recommend,
    vpn: !!row.vpn,
    commonlyUsed: !!row.commonlyUsed,
    visitCount: (row.visitCount as number) || 0,
    sort: row.sort as number,
    category_id: row.category_id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user_id: row.user_id as string,
    email: row.email as string,
    category: {
      id: (row.c_id as string) || row.category_id as string,
      name: (row.c_name as string) || '',
      sort: (row.c_sort as number) || 0,
      created_at: (row.c_created_at as string) || '',
      updated_at: (row.c_updated_at as string) || '',
      user_id: (row.c_user_id as string) || '',
      email: (row.c_email as string) || '',
      websites: [],
    },
  }
}

export function getWebsitesList(params: {
  pageIndex: number
  pageSize: number
  name?: string | null
  category_id?: string | null
}): { list: App.Website[]; total: number } {
  const db = getDb()
  const { pageIndex, pageSize, name, category_id } = params
  const offset = pageIndex * pageSize

  const conditions: string[] = []
  const bindParams: unknown[] = []

  if (name) {
    conditions.push('w.name LIKE ?')
    bindParams.push(`%${name}%`)
  }
  if (category_id) {
    conditions.push('w.category_id = ?')
    bindParams.push(category_id)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM ds_websites w ${whereClause}`)
    .get(...bindParams) as { total: number }

  const rows = db
    .prepare(
      `SELECT w.*, c.id as c_id, c.name as c_name, c.sort as c_sort,
              c.created_at as c_created_at, c.updated_at as c_updated_at,
              c.user_id as c_user_id, c.email as c_email
       FROM ds_websites w
       LEFT JOIN ds_categorys c ON w.category_id = c.id
       ${whereClause}
       ORDER BY w.pinned DESC, w.sort DESC, w.recommend DESC, w.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...bindParams, pageSize, offset) as Array<Record<string, unknown>>

  return {
    list: rows.map(rowToWebsite),
    total: countRow.total,
  }
}

export function createWebsite(data: {
  id?: string
  name: string
  desc?: string | null
  url: string
  logo?: string | null
  logoAccent?: string | null
  tags?: string[]
  pinned?: boolean
  recommend?: boolean
  vpn?: boolean
  commonlyUsed?: boolean
  sort?: number
  category_id: string
  userId: string
  email: string
}): App.Website {
  const db = getDb()
  const id = data.id || crypto.randomUUID()
  const now = new Date().toISOString()
  const tags = JSON.stringify(data.tags || [])

  const row = db
    .prepare(
      `INSERT INTO ds_websites (id, name, "desc", url, logo, logoAccent, tags, pinned,
       recommend, vpn, commonlyUsed, sort, category_id, user_id, email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .get(
      id,
      data.name,
      data.desc ?? null,
      data.url,
      data.logo ?? null,
      data.logoAccent ?? null,
      tags,
      data.pinned ? 1 : 0,
      data.recommend ? 1 : 0,
      data.vpn ? 1 : 0,
      data.commonlyUsed ? 1 : 0,
      data.sort ?? 0,
      data.category_id,
      data.userId,
      data.email,
      now,
      now
    ) as Record<string, unknown>

  const site = rowToWebsite(row)

  // Fetch category info
  const cat = db.prepare('SELECT * FROM ds_categorys WHERE id = ?').get(data.category_id) as Record<string, unknown> | undefined
  if (cat) {
    site.category = {
      id: cat.id as string,
      name: cat.name as string,
      sort: cat.sort as number,
      created_at: cat.created_at as string,
      updated_at: cat.updated_at as string,
      user_id: cat.user_id as string,
      email: cat.email as string,
      websites: [],
    }
  }

  return site
}

export function updateWebsite(
  id: string,
  data: {
    name?: string
    desc?: string | null
    url?: string
    logo?: string | null
    logoAccent?: string | null
    tags?: string[]
    pinned?: boolean
    recommend?: boolean
    vpn?: boolean
    commonlyUsed?: boolean
    sort?: number
    category_id?: string
  }
): App.Website | null {
  const db = getDb()
  const now = new Date().toISOString()
  const sets: string[] = ['updated_at = ?']
  const vals: unknown[] = [now]

  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name) }
  if (data.desc !== undefined) { sets.push('"desc" = ?'); vals.push(data.desc ?? null) }
  if (data.url !== undefined) { sets.push('url = ?'); vals.push(data.url) }
  if (data.logo !== undefined) { sets.push('logo = ?'); vals.push(data.logo ?? null) }
  if (data.logoAccent !== undefined) { sets.push('logoAccent = ?'); vals.push(data.logoAccent ?? null) }
  if (data.tags !== undefined) { sets.push('tags = ?'); vals.push(JSON.stringify(data.tags)) }
  if (data.pinned !== undefined) { sets.push('pinned = ?'); vals.push(data.pinned ? 1 : 0) }
  if (data.recommend !== undefined) { sets.push('recommend = ?'); vals.push(data.recommend ? 1 : 0) }
  if (data.vpn !== undefined) { sets.push('vpn = ?'); vals.push(data.vpn ? 1 : 0) }
  if (data.commonlyUsed !== undefined) { sets.push('commonlyUsed = ?'); vals.push(data.commonlyUsed ? 1 : 0) }
  if (data.sort !== undefined) { sets.push('sort = ?'); vals.push(data.sort) }
  if (data.category_id !== undefined) { sets.push('category_id = ?'); vals.push(data.category_id) }

  vals.push(id)
  const row = db
    .prepare(`UPDATE ds_websites SET ${sets.join(', ')} WHERE id = ? RETURNING *`)
    .get(...vals) as Record<string, unknown> | undefined

  if (!row) return null

  const site = rowToWebsite(row)
  const cat = db.prepare('SELECT * FROM ds_categorys WHERE id = ?').get(row.category_id as string) as Record<string, unknown> | undefined
  if (cat) {
    site.category = {
      id: cat.id as string,
      name: cat.name as string,
      sort: cat.sort as number,
      created_at: cat.created_at as string,
      updated_at: cat.updated_at as string,
      user_id: cat.user_id as string,
      email: cat.email as string,
      websites: [],
    }
  }
  return site
}

export function deleteWebsite(id: string): App.Website | null {
  const db = getDb()
  const row = db
    .prepare('DELETE FROM ds_websites WHERE id = ? RETURNING *')
    .get(id) as Record<string, unknown> | undefined
  return row ? rowToWebsite(row) : null
}

export function getWebsiteById(id: string): App.Website | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM ds_websites WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? rowToWebsite(row) : null
}

export function incrementVisitCount(id: string): void {
  const db = getDb()
  const increment = Math.floor(Math.random() * 10) + 1
  db.prepare('UPDATE ds_websites SET visitCount = COALESCE(visitCount, 0) + ? WHERE id = ?').run(increment, id)
}
