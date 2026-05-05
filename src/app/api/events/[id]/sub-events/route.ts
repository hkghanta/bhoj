import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  event_date: z.string().datetime(),
  venue: z.string().optional(),
  guest_count: z.number().int().positive().optional(),
  budget: z.number().positive().optional(),
  notes: z.string().optional(),
  sort_order: z.number().int().default(0),
})

async function getAuthedEvent(eventId: string, customerId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await getAuthedEvent(id, session.user!.id as string)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const subEvents = await prisma.subEvent.findMany({
    where: { event_id: id },
    orderBy: [{ sort_order: 'asc' }, { event_date: 'asc' }],
  })
  return NextResponse.json(subEvents)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await getAuthedEvent(id, session.user!.id as string)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { event_date, ...rest } = parsed.data
  const subEvent = await prisma.subEvent.create({
    data: { ...rest, event_id: id, event_date: new Date(event_date) },
  })
  return NextResponse.json(subEvent, { status: 201 })
}
