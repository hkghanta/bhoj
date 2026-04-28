import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  vendor_id: z.string(),
  event_id: z.string(),
  overall_rating: z.number().int().min(1).max(5),
  food_quality_rating: z.number().int().min(1).max(5).optional(),
  service_rating: z.number().int().min(1).max(5).optional(),
  value_rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
  event_type: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reqBody = await req.json()
  const parsed = createSchema.safeParse(reqBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const event = await prisma.event.findFirst({
    where: { id: parsed.data.event_id, customer_id: (session.user!.id as string) },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (event.event_date > new Date()) {
    return NextResponse.json({ error: 'Reviews can only be submitted after the event date' }, { status: 422 })
  }

  const existing = await prisma.review.findFirst({
    where: { vendor_id: parsed.data.vendor_id, customer_id: (session.user!.id as string), event_id: parsed.data.event_id },
  })
  if (existing) {
    return NextResponse.json({ error: 'You have already reviewed this vendor for this event' }, { status: 409 })
  }

  const review = await prisma.review.create({
    data: {
      ...parsed.data,
      customer_id: (session.user!.id as string),
      event_date: event.event_date,
      is_verified: true,
    },
  })

  return NextResponse.json(review, { status: 201 })
}
