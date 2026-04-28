import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { enqueueNotification } from '@/lib/notifications/enqueue'
import { NOTIFICATION_EVENTS } from '@/lib/notifications/types'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = (session.user as { role?: string }).role

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      ...(role === 'customer'
        ? { customer_id: (session.user!.id as string) }
        : { vendor_id: (session.user!.id as string) }),
    },
  })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: {
      conversation_id: id,
      is_read: false,
      sender_type: role === 'customer' ? 'VENDOR' : 'CUSTOMER',
    },
    data: { is_read: true },
  })

  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')

  const messages = await prisma.message.findMany({
    where: {
      conversation_id: id,
      ...(since ? { created_at: { gt: new Date(since) } } : {}),
    },
    orderBy: { created_at: 'asc' },
    take: 100,
  })

  return NextResponse.json(messages)
}

const sendSchema = z.object({
  body: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = (session.user as { role?: string }).role

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      ...(role === 'customer'
        ? { customer_id: (session.user!.id as string) }
        : { vendor_id: (session.user!.id as string) }),
    },
  })
  if (!conversation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const message = await prisma.message.create({
    data: {
      conversation_id: id,
      sender_id: (session.user!.id as string),
      sender_type: role === 'customer' ? 'CUSTOMER' : 'VENDOR',
      body: parsed.data.body,
    },
  })

  await prisma.conversation.update({
    where: { id },
    data: { last_message_at: message.created_at },
  })

  // Notify the other party
  const otherPartyId = role === 'customer' ? conversation.vendor_id : conversation.customer_id
  const otherPartyType: 'customer' | 'vendor' = role === 'customer' ? 'vendor' : 'customer'
  const senderName = (session.user as any).name ?? (role === 'vendor' ? 'Vendor' : 'Customer')

  prisma.conversation.findUnique({
    where: { id },
    include: { match: { include: { event_request: { include: { event: { select: { event_name: true } } } } } } },
  }).then(convo => {
    const eventName = convo?.match?.event_request?.event?.event_name ?? 'your event'
    enqueueNotification(
      NOTIFICATION_EVENTS.NEW_MESSAGE,
      otherPartyId,
      otherPartyType,
      {
        conversationId: id,
        senderName,
        bodyPreview: parsed.data.body.slice(0, 100),
        eventName,
        recipientName: 'there',
      }
    ).catch(err => console.error('[messages] Failed to enqueue message notification:', err.message))
  }).catch(() => {})

  return NextResponse.json(message, { status: 201 })
}
