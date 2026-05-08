import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  event_type: z.string().min(1).max(100),
  event_date: z.string().datetime().nullish(),
  start_time: z.string().max(20).nullish(),
  end_time: z.string().max(20).nullish(),
  venue: z.string().max(300).nullish(),
  city: z.string().max(100).nullish(),
  description: z.string().max(2000).nullish(),
  sort_order: z.number().int().nullish(),
})

type Params = { id: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
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

  const subEvents = await prisma.subEvent.findMany({
    where: { event_id: id },
    orderBy: [{ sort_order: 'asc' }, { event_date: 'asc' }],
  })

  return NextResponse.json(subEvents)
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
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

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const subEvent = await prisma.subEvent.create({
    data: {
      event_id: id,
      name: data.name,
      event_type: data.event_type,
      event_date: data.event_date ? new Date(data.event_date) : null,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      venue: data.venue || null,
      city: data.city || null,
      description: data.description || null,
      sort_order: data.sort_order ?? 0,
    },
  })

  return NextResponse.json(subEvent, { status: 201 })
}
