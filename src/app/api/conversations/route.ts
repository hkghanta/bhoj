import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = (session.user!.id as string)

  const conversations = await prisma.conversation.findMany({
    where: {
      is_archived: false,
      ...(role === 'customer' ? { customer_id: userId } : { vendor_id: userId }),
    },
    include: {
      messages: { orderBy: { created_at: 'desc' }, take: 1 },
      customer: { select: { id: true, name: true, avatar_url: true } },
      vendor: { select: { id: true, business_name: true, profile_photo_url: true } },
      match: {
        include: {
          event_request: {
            include: {
              event: { select: { event_name: true, event_date: true } },
            },
          },
        },
      },
    },
    orderBy: { last_message_at: 'desc' },
  })

  const unreadCounts = await prisma.message.groupBy({
    by: ['conversation_id'],
    where: {
      conversation_id: { in: conversations.map(c => c.id) },
      is_read: false,
      sender_type: role === 'customer' ? 'VENDOR' : 'CUSTOMER',
    },
    _count: { id: true },
  })

  const unreadMap = Object.fromEntries(unreadCounts.map(u => [u.conversation_id, u._count.id]))

  return NextResponse.json(
    conversations.map(c => ({
      ...c,
      unread_count: unreadMap[c.id] ?? 0,
    }))
  )
}

const createSchema = z.object({
  match_id: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const match = await prisma.match.findFirst({
    where: {
      id: parsed.data.match_id,
      event_request: { event: { customer_id: (session.user!.id as string) } },
    },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const conversation = await prisma.conversation.upsert({
    where: { match_id: match.id },
    update: {},
    create: {
      match_id: match.id,
      customer_id: (session.user!.id as string),
      vendor_id: match.vendor_id,
    },
  })

  return NextResponse.json(conversation, { status: 201 })
}
