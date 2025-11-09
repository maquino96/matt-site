import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'

const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-in-production'
// Decode from base64 if encoded, otherwise use as-is
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH 
  ? (process.env.ADMIN_PASSWORD_HASH.startsWith('BASE64:')
      ? Buffer.from(process.env.ADMIN_PASSWORD_HASH.substring(7), 'base64').toString('utf-8')
      : process.env.ADMIN_PASSWORD_HASH)
  : undefined

interface SessionPayload {
  authenticated: boolean
  timestamp: number
}

/**
 * Verify the admin password against the stored hash
 */
export async function verifyPassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) {
    console.error('[Auth] ADMIN_PASSWORD_HASH not configured')
    return false
  }

  console.log('[Auth Debug] Password length:', password.length)
  console.log('[Auth Debug] Hash length:', ADMIN_PASSWORD_HASH.length)
  console.log('[Auth Debug] Hash starts with:', ADMIN_PASSWORD_HASH.substring(0, 10))

  try {
    const result = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
    console.log('[Auth Debug] Comparison result:', result)
    return result
  } catch (error) {
    console.error('[Auth] Password verification error:', error)
    return false
  }
}

/**
 * Create a session token
 */
export function createSessionToken(): string {
  const payload: SessionPayload = {
    authenticated: true,
    timestamp: Date.now(),
  }

  return jwt.sign(payload, SESSION_SECRET, {
    // No expiration - session expires when browser closes
  })
}

/**
 * Verify the admin session from cookies (server-side)
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('admin_session')

    if (!sessionToken) {
      return false
    }

    const decoded = jwt.verify(sessionToken.value, SESSION_SECRET) as SessionPayload

    return decoded.authenticated === true
  } catch {
    // Token invalid, expired, or malformed
    return false
  }
}

/**
 * Hash a password (utility for generating ADMIN_PASSWORD_HASH)
 * Usage: node -e "require('./lib/auth/admin-auth').hashPassword('your-password')"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

