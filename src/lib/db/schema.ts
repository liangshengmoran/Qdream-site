export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  provider      TEXT NOT NULL DEFAULT 'email',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ds_categorys (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  sort       INTEGER NOT NULL DEFAULT 0,
  private    INTEGER DEFAULT 0,
  parent_id  TEXT REFERENCES ds_categorys(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_id    TEXT NOT NULL REFERENCES users(id),
  email      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ds_websites (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  "desc"       TEXT,
  logo         TEXT,
  logoAccent   TEXT,
  url          TEXT NOT NULL,
  tags         TEXT DEFAULT '[]',
  pinned       INTEGER DEFAULT 0,
  recommend    INTEGER DEFAULT 0,
  vpn          INTEGER DEFAULT 0,
  commonlyUsed INTEGER DEFAULT 0,
  visitCount   INTEGER DEFAULT 0,
  sort         INTEGER NOT NULL DEFAULT 0,
  category_id  TEXT NOT NULL REFERENCES ds_categorys(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  user_id      TEXT NOT NULL REFERENCES users(id),
  email        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categorys_user_id ON ds_categorys(user_id);
CREATE INDEX IF NOT EXISTS idx_categorys_sort ON ds_categorys(sort);
CREATE INDEX IF NOT EXISTS idx_websites_category_id ON ds_websites(category_id);
CREATE INDEX IF NOT EXISTS idx_websites_user_id ON ds_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_pinned ON ds_websites(pinned);
CREATE INDEX IF NOT EXISTS idx_websites_sort ON ds_websites(sort);
CREATE INDEX IF NOT EXISTS idx_categorys_parent_id ON ds_categorys(parent_id);
CREATE INDEX IF NOT EXISTS idx_websites_category_sort ON ds_websites(category_id, pinned, sort, recommend, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`
