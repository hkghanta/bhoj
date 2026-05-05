import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { EventStatus } from '@prisma/client'
import { resolveMetro } from '@/lib/geo/resolve-metro'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: (session.user!.id as string) },
    include: {
      checklist_items: { orderBy: [{ category: 'asc' }, { created_at: 'asc' }] },
      requests: {
        include: {
          matches: {
            include: { vendor: { select: { id: true, business_name: true, profile_photo_url: true } } },
          },
        },
      },
    },
  })

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(event)
}

const updateSchema = z.object({
  event_name: z.string().optional(),
  event_date: z.string().datetime().optional(),
  city: z.string().min(2).optional(),
  state: z.string().optional(),
  country: z.string().length(2).optional(),
  venue: z.string().optional(),
  guest_count: z.number().int().positive().optional(),
  total_budget: z.number().positive().optional(),
  status: z.nativeEnum(EventStatus).optional(),
})

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
    include: {
      requests: {
        include: { matches: { select: { id: true } } },
      },
    },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Check if any vendor has been matched or quoted
  const hasActivity = event.requests.some(r => r.matches.length > 0)

  if (hasActivity) {
    // Soft cancel — keep record, close all requests
    await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      prisma.eventRequest.updateMany({
        where: { event_id: id },
        data: { status: 'CLOSED', public_status: 'FILLED' },
      }),
    ])
    return NextResponse.json({ deleted: false, cancelled: true })
  } else {
    // Hard delete — no vendor activity
    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ deleted: true, cancelled: false })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const existing = await prisma.event.findFirst({ where: { id, customer_id: (session.user!.id as string) } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.event_date) data.event_date = new Date(parsed.data.event_date)

  // Re-resolve metro if city changed
  if (parsed.data.city) {
    const metro = await resolveMetro(
      parsed.data.city,
      parsed.data.state ?? existing.state,
      parsed.data.country ?? existing.country,
    )
    data.metro_city = metro?.metro_city ?? null
    data.metro_state = metro?.metro_state ?? null
  }

  const event = await prisma.event.update({ where: { id }, data })
  return NextResponse.json(event)
}
