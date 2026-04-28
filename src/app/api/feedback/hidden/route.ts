import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  vendor_id: z.string(),
  event_request_id: z.string(),
  match_id: z.string(),
  would_recommend: z.boolean(),
  communication_score: z.number().int().min(1).max(5),
  professionalism_score: z.number().int().min(1).max(5),
  quote_accuracy: z.number().int().min(1).max(5),
  overall_experience: z.number().int().min(1).max(5),
  notes: z.string().max(1000).optional(),
  booked_offline: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const eventRequest = await prisma.eventRequest.findFirst({
    where: { id: parsed.data.event_request_id, event: { customer_id: (session.user!.id as string) } },
    include: { event: { select: { event_date: true } } },
  })
  if (!eventRequest) return NextResponse.json({ error: 'Event request not found' }, { status: 404 })
  if (eventRequest.event.event_date > new Date()) {
    return NextResponse.json({ error: 'Feedback can only be submitted after the event' }, { status: 422 })
  }

  const existing = await prisma.hiddenFeedback.findFirst({
    where: {
      vendor_id: parsed.data.vendor_id,
      customer_id: (session.user!.id as string),
      event_request_id: parsed.data.event_request_id,
    },
  })
  if (existing) return NextResponse.json({ error: 'Feedback already submitted' }, { status: 409 })

  const feedback = await prisma.hiddenFeedback.create({
    data: { ...parsed.data, customer_id: (session.user!.id as string) },
  })

  return NextResponse.json(feedback, { status: 201 })
}
