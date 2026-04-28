import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role

  const conversations = await prisma.conversation.findMany({
    where: {
      ...(role === 'customer'
        ? { customer_id: (session.user!.id as string) }
        : { vendor_id: (session.user!.id as string) }),
    },
    select: { id: true },
  })

  const count = await prisma.message.count({
    where: {
      conversation_id: { in: conversations.map(c => c.id) },
      is_read: false,
      sender_type: role === 'customer' ? 'VENDOR' : 'CUSTOMER',
    },
  })

  return NextResponse.json({ count })
}
