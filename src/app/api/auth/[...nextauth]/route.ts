import { handlers } from '@/lib/auth'
import type { NextRequest } from 'next/server'

// next-auth beta.31 types don't yet match Next.js 16's Promise<params> signature
// Runtime behavior is fully compatible
export const GET = (req: NextRequest) => handlers.GET(req)
export const POST = (req: NextRequest) => handlers.POST(req)
