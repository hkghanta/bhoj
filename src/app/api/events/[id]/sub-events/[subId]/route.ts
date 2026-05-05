import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  event_date: z.string().datetime().optional(),
  venue: z.string().nullable().optional(),
  guest_count: z.number().int().positive().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
})

async function getAuthedSubEvent(subId: string, eventId: string, customerId: string) {
  return prisma.subEvent.findFirst({
    where: { id: subId, event_id: eventId, event: { customer_id: customerId } },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, subId } = await params
  const existing = await getAuthedSubEvent(subId, id, session.user!.id as string)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { event_date, ...rest } = parsed.data
  const updated = await prisma.subEvent.update({
    where: { id: subId },
    data: { ...rest, ...(event_date ? { event_date: new Date(event_date) } : {}) },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, subId } = await params
  const existing = await getAuthedSubEvent(subId, id, session.user!.id as string)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.subEvent.delete({ where: { id: subId } })
  return new NextResponse(null, { status: 204 })
}
