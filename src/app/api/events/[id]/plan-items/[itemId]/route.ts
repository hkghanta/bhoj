import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  role: z.string().max(100).optional().nullable(),
  contact_name: z.string().max(100).optional().nullable(),
  contact_phone: z.string().max(30).optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal('')),
  start_time: z.string().datetime().optional().nullable(),
  end_time: z.string().datetime().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  sort_order: z.number().int().optional(),
})

type Params = { id: string; itemId: string }

async function verifyOwnership(eventId: string, itemId: string, customerId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
    select: { id: true },
  })
  if (!event) return null
  return prisma.eventPlanItem.findFirst({
    where: { id: itemId, event_id: eventId },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, itemId } = await params
  const item = await verifyOwnership(id, itemId, session.user!.id as string)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (data.start_time) data.start_time = new Date(data.start_time as string)
  if (data.end_time) data.end_time = new Date(data.end_time as string)
  if (data.contact_email === '') data.contact_email = null

  const updated = await prisma.eventPlanItem.update({
    where: { id: itemId },
    data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, itemId } = await params
  const item = await verifyOwnership(id, itemId, session.user!.id as string)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.eventPlanItem.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}
