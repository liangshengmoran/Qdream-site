import { getDb } from './connection'

function rowToCategory(row: Record<string, unknown>): App.Category {
  return {
    id: row.id as string,
    name: row.name as string,
    sort: row.sort as number,
    private: !!row.private,
    parent_id: (row.parent_id as string) || null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user_id: row.user_id as string,
    email: row.email as string,
    websites: [],
  }
}

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
    category: null as unknown as App.Category,
  }
}

function fillCategory(cat: App.Category) {
  for (const w of cat.websites) {
    w.category = { ...cat, websites: [], children: [] }
  }
  for (const ch of (cat.children || [])) {
    fillCategory(ch)
  }
}

export function getCategorysList(params: {
  pageIndex: number
  pageSize: number
  name?: string | null
  showPrivate?: boolean
}): { list: App.Category[]; total: number } {
  const db = getDb()
  const { pageIndex, pageSize, name, showPrivate = true } = params
  const offset = pageIndex * pageSize

  const conditions: string[] = []
  const bindParams: unknown[] = []

  if (name) {
    conditions.push('c.name LIKE ?')
    bindParams.push(`%${name}%`)
  }
  if (!showPrivate) {
    conditions.push('c.private = 0')
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM ds_categorys c ${whereClause}`)
    .get(...bindParams) as { total: number }
  const total = countRow.total

  const categories = db
    .prepare(
      `SELECT c.* FROM ds_categorys c ${whereClause}
       ORDER BY c.sort DESC, c.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...bindParams, pageSize, offset) as Array<Record<string, unknown>>

  const list = categories.map(rowToCategory)

  if (list.length > 0) {
    const ids = list.map((c) => c.id)
    const placeholders = ids.map(() => '?').join(',')
    const websiteRows = db
      .prepare(
        `SELECT * FROM ds_websites WHERE category_id IN (${placeholders})
         ORDER BY pinned DESC, sort DESC, recommend DESC, created_at DESC`
      )
      .all(...ids) as Array<Record<string, unknown>>

    const websitesByCategory: Record<string, App.Website[]> = {}
    for (const row of websiteRows) {
      const site = rowToWebsite(row)
      const cid = row.category_id as string
      if (!websitesByCategory[cid]) websitesByCategory[cid] = []
      websitesByCategory[cid].push(site)
    }

    for (const cat of list) {
      cat.websites = websitesByCategory[cat.id] || []
    }
  }

  return { list, total }
}

/** 单次查询 + 内存建树，消除 N+1 */
export function getCategoryTree(params: {
  showPrivate?: boolean
}): App.Category[] {
  const db = getDb()
  const { showPrivate = false } = params

  // 1. 一次查询获取所有分类
  const cond = showPrivate ? '' : 'WHERE private = 0'
  const allRows = db
    .prepare(`SELECT * FROM ds_categorys ${cond} ORDER BY sort DESC, name ASC`)
    .all() as Array<Record<string, unknown>>

  const allCats = allRows.map(rowToCategory)
  const catMap = new Map<string, App.Category>()
  for (const c of allCats) { catMap.set(c.id, c); c.children = [] }

  // 2. 一次查询获取所有网站
  const ids = allCats.map(c => c.id)
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',')
    const siteRows = db
      .prepare(
        `SELECT * FROM ds_websites WHERE category_id IN (${placeholders})
         ORDER BY pinned DESC, sort DESC, recommend DESC, created_at DESC`
      )
      .all(...ids) as Array<Record<string, unknown>>

    for (const row of siteRows) {
      const site = rowToWebsite(row)
      const cid = row.category_id as string
      const cat = catMap.get(cid)
      if (cat) cat.websites.push(site)
    }
  }

  // 3. 内存中构建树
  const roots: App.Category[] = []
  for (const c of allCats) {
    if (c.parent_id) {
      const parent = catMap.get(c.parent_id)
      if (parent) parent.children!.push(c)
    } else {
      roots.push(c)
    }
  }

  // 4. 回填 category 引用
  for (const r of roots) fillCategory(r)

  return roots
}

export function createCategory(data: {
  name: string
  sort?: number
  private?: boolean
  parent_id?: string | null
  userId: string
  email: string
}): App.Category {
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const row = db
    .prepare(
      `INSERT INTO ds_categorys (id, name, sort, private, parent_id, user_id, email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    )
    .get(id, data.name, data.sort ?? 0, data.private ? 1 : 0, data.parent_id ?? null, data.userId, data.email, now, now) as Record<string, unknown>
  return rowToCategory(row)
}

export function updateCategory(
  id: string,
  data: { name?: string; sort?: number; private?: boolean; parent_id?: string | null }
): App.Category | null {
  const db = getDb()
  const now = new Date().toISOString()
  const sets: string[] = ['updated_at = ?']
  const vals: unknown[] = [now]

  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name) }
  if (data.sort !== undefined) { sets.push('sort = ?'); vals.push(data.sort) }
  if (data.private !== undefined) { sets.push('private = ?'); vals.push(data.private ? 1 : 0) }
  if (data.parent_id !== undefined) { sets.push('parent_id = ?'); vals.push(data.parent_id ?? null) }

  vals.push(id)
  const row = db
    .prepare(`UPDATE ds_categorys SET ${sets.join(', ')} WHERE id = ? RETURNING *`)
    .get(...vals) as Record<string, unknown> | undefined
  return row ? rowToCategory(row) : null
}

export function deleteCategory(id: string): App.Category | null {
  const db = getDb()
  const childCount = db.prepare('SELECT COUNT(*) as c FROM ds_categorys WHERE parent_id = ?').get(id) as { c: number }
  if (childCount.c > 0) return null

  const row = db
    .prepare('DELETE FROM ds_categorys WHERE id = ? RETURNING *')
    .get(id) as Record<string, unknown> | undefined
  return row ? rowToCategory(row) : null
}

export function getAllCategories(showPrivate = true): App.Category[] {
  const db = getDb()
  const cond = showPrivate ? '' : 'WHERE private = 0'
  const rows = db.prepare(`SELECT * FROM ds_categorys ${cond} ORDER BY sort DESC, name ASC`).all() as Array<Record<string, unknown>>
  return rows.map(rowToCategory)
}
