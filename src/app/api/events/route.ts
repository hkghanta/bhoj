import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { resolveMetro } from '@/lib/geo/resolve-metro'
import { addDays } from 'date-fns'

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

  const eventDate = new Date(event_date)

  const event = await prisma.event.create({
    data: {
      ...rest,
      event_date: eventDate,
      customer_id: customerId,
      metro_city: metro?.metro_city ?? null,
      metro_state: metro?.metro_state ?? null,
    },
  })

  // Auto-apply playbook: create checklist items + sub-events based on event type
  const playbook = await prisma.eventPlaybook.findUnique({
    where: { event_type: rest.event_type },
  })

  if (playbook) {
    const checklistData = playbook.checklist as Array<{
      category: string
      items: Array<{ name: string; due_offset_days: number }>
    }>
    if (checklistData?.length) {
      await prisma.eventChecklistItem.createMany({
        data: checklistData.flatMap(cat =>
          cat.items.map(item => ({
            event_id: event.id,
            category: cat.category,
            item_name: item.name,
            due_date: addDays(eventDate, item.due_offset_days),
          })),
        ),
      })
    }

    const subEventsData = playbook.sub_events as Array<{
      name: string; type: string; offset_days: number
    }> | null
    if (subEventsData?.length) {
      await prisma.subEvent.createMany({
        data: subEventsData.map((se, idx) => ({
          event_id: event.id,
          name: se.name,
          event_type: se.type,
          event_date: addDays(eventDate, se.offset_days),
          sort_order: idx,
        })),
      })
    }
  }

  // Re-fetch with checklist items included
  const full = await prisma.event.findUnique({
    where: { id: event.id },
    include: { checklist_items: true },
  })

  return NextResponse.json(full, { status: 201 })
}
