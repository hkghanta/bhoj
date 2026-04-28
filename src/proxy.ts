import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const CUSTOMER_ROUTES = ['/dashboard', '/events', '/quotes']
const VENDOR_ROUTES = ['/vendor/dashboard', '/vendor/leads', '/vendor/menu']

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isCustomerRoute = CUSTOMER_ROUTES.some(r => nextUrl.pathname.startsWith(r))
  const isVendorRoute = VENDOR_ROUTES.some(r => nextUrl.pathname.startsWith(r))

  if ((isCustomerRoute || isVendorRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
