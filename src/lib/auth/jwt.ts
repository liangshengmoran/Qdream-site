import { SignJWT, jwtVerify } from 'jose'
import { getDb } from '@/lib/db/connection'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars!!'
)

export interface JwtPayload {
  sub: string
  email: string
  name: string | null
  avatar_url: string | null
  provider: string
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

export interface UserRecord {
  id: string
  email: string
  password_hash: string
  name: string | null
  avatar_url: string | null
  provider: string
  created_at: string
  updated_at: string
}

export function findUserByEmail(email: string): UserRecord | null {
  const db = getDb()
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRecord | null
}

export function findUserById(id: string): UserRecord | null {
  const db = getDb()
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRecord | null
}

export function createUser(data: {
  email: string
  passwordHash: string
  name?: string | null
}): UserRecord {
  const db = getDb()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, provider, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'email', ?, ?)`
  ).run(id, data.email, data.passwordHash, data.name ?? null, now, now)
  return findUserById(id)!
}
