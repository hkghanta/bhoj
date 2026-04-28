import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { storePushToken } from '@/lib/notifications/channels/push-token-store'
import { z } from 'zod'

const schema = z.object({
  token: z.string().min(10),
  platform: z.enum(['ios', 'android']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any).role
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  await storePushToken(session.user!.id as string, role, parsed.data.token)
  return NextResponse.json({ ok: true })
}
