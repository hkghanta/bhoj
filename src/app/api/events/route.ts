import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { resolveMetro } from '@/lib/geo/resolve-metro'

const createSchema = z.object({
  event_name: z.string().min(2),
  event_type: z.string().min(2),
  event_date: z.string().datetime(),
  city: z.string().min(2),
  state: z.string().optional(),
  country: z.string().length(2).default('US'),
  venue: z.string().optional(),
  guest_count: z.number().int().positive(),
  total_budget: z.number().positive(),
  currency: z.string().length(3).default('USD'),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const events = await prisma.event.findMany({
    where: { customer_id: (session.user!.id as string) },
    include: {
      checklist_items: true,
      _count: { select: { requests: true } },
    },
    orderBy: { event_date: 'asc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { event_date, ...rest } = parsed.data
  const customerId = session.user!.id as string

  const metro = await resolveMetro(rest.city, rest.state, rest.country)

  const event = await prisma.event.create({
    data: {
      ...rest,
      event_date: new Date(event_date),
      customer_id: customerId,
      metro_city: metro?.metro_city ?? null,
      metro_state: metro?.metro_state ?? null,
    },
    include: { checklist_items: true },
  })

  return NextResponse.json(event, { status: 201 })
}
