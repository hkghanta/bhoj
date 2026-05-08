import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bodySchema = z.object({
  target: z.enum(['not_sent', 'not_opened', 'not_responded', 'missing_meal', 'all']),
})

type Params = { id: string }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user!.id as string },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = bodySchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: 'Invalid body', details: body.error.flatten() }, { status: 400 })
  }

  const { target } = body.data
  const now = new Date()

  // Build the where clause based on target
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = { event_id: id }

  switch (target) {
    case 'not_sent':
      where.invite_sent_at = null
      break
    case 'not_opened':
      where.invite_sent_at = { not: null }
      where.invite_opened_at = null
      break
    case 'not_responded':
      where.invite_sent_at = { not: null }
      where.responded_at = null
      where.declined = false
      break
    case 'missing_meal':
      where.rsvp_count = { gt: 0 }
      where.declined = false
      where.meal_preference = null
      break
    case 'all':
      // no additional filters
      break
  }

  const matched = await prisma.guestHousehold.findMany({
    where,
    select: { id: true, invite_sent_at: true },
  })

  // Update each matched household
  for (const household of matched) {
    await prisma.guestHousehold.update({
      where: { id: household.id },
      data: {
        reminder_count: { increment: 1 },
        last_reminder_at: now,
        // If invite was never sent, mark it as sent now
        ...(household.invite_sent_at === null ? { invite_sent_at: now } : {}),
      },
    })
  }

  return NextResponse.json({ reminded: matched.length, target })
}
