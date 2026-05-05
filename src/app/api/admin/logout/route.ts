import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.redirect(new URL('/admin/login', process.env.NEXTAUTH_URL ?? 'http://localhost:3002'))
  res.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
  return res
}
