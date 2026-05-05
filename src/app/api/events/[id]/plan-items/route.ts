import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  source: z.enum(['EXTERNAL', 'PERSONAL']),
  title: z.string().min(1).max(200),
  role: z.string().max(100).optional(),
  contact_name: z.string().max(100).optional(),
  contact_phone: z.string().max(30).optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  sort_order: z.number().int().optional(),
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

  const items = await prisma.eventPlanItem.findMany({
    where: { event_id: id },
    orderBy: [{ sort_order: 'asc' }, { start_time: 'asc' }, { created_at: 'asc' }],
  })

  return NextResponse.json(items)
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
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

  const data = parsed.data
  const item = await prisma.eventPlanItem.create({
    data: {
      event_id: id,
      source: data.source,
      title: data.title,
      role: data.role || null,
      contact_name: data.contact_name || null,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      start_time: data.start_time ? new Date(data.start_time) : null,
      end_time: data.end_time ? new Date(data.end_time) : null,
      location: data.location || null,
      notes: data.notes || null,
      sort_order: data.sort_order ?? 0,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
