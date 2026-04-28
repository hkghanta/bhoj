import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? 'change-me-in-production'
const COOKIE_NAME = 'admin_session'

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const value = cookieStore.get(COOKIE_NAME)?.value
  return value === ADMIN_SECRET
}

export function isAdminRequest(req: NextRequest): boolean {
  const value = req.cookies.get(COOKIE_NAME)?.value
  return value === ADMIN_SECRET
}
