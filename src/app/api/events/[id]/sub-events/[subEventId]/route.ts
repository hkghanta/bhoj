import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  event_type: z.string().min(1).max(100).optional(),
  event_date: z.string().datetime().nullish(),
  start_time: z.string().max(20).nullish(),
  end_time: z.string().max(20).nullish(),
  venue: z.string().max(300).nullish(),
  city: z.string().max(100).nullish(),
  description: z.string().max(2000).nullish(),
  sort_order: z.number().int().nullish(),
})

type Params = Promise<{ id: string; subEventId: string }>

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, subEventId } = await params
  const userId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const existing = await prisma.subEvent.findFirst({
    where: { id: subEventId, event_id: id },
  })
  if (!existing) return NextResponse.json({ error: 'Sub-event not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const updated = await prisma.subEvent.update({
    where: { id: subEventId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.event_type !== undefined && { event_type: data.event_type }),
      ...(data.event_date !== undefined && { event_date: data.event_date ? new Date(data.event_date) : null }),
      ...(data.start_time !== undefined && { start_time: data.start_time || null }),
      ...(data.end_time !== undefined && { end_time: data.end_time || null }),
      ...(data.venue !== undefined && { venue: data.venue || null }),
      ...(data.city !== undefined && { city: data.city || null }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.sort_order !== undefined && { sort_order: data.sort_order ?? 0 }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, subEventId } = await params
  const userId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const existing = await prisma.subEvent.findFirst({
    where: { id: subEventId, event_id: id },
  })
  if (!existing) return NextResponse.json({ error: 'Sub-event not found' }, { status: 404 })

  await prisma.subEvent.delete({ where: { id: subEventId } })

  return NextResponse.json({ success: true })
}
