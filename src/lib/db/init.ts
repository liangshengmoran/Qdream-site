import { getDb } from './connection'
import { SCHEMA } from './schema'

let initialized = false

function columnExists(table: string, column: string): boolean {
  const db = getDb()
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
  return rows.some((r) => r.name === column)
}

export function initDb(): void {
  if (initialized) return
  const db = getDb()
  db.exec(SCHEMA)

  // 兼容旧数据库
  if (!columnExists('ds_categorys', 'private')) {
    db.exec('ALTER TABLE ds_categorys ADD COLUMN private INTEGER DEFAULT 0')
  }
  if (!columnExists('ds_categorys', 'parent_id')) {
    db.exec('ALTER TABLE ds_categorys ADD COLUMN parent_id TEXT REFERENCES ds_categorys(id)')
  }

  // 新增复合索引
  db.exec('CREATE INDEX IF NOT EXISTS idx_categorys_parent_id ON ds_categorys(parent_id)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_websites_category_sort ON ds_websites(category_id, pinned, sort, recommend, created_at)')

  initialized = true
}
