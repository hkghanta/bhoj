import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  match_id: z.string(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const { searchParams } = new URL(req.url)

  if (role === 'customer') {
    const eventId = searchParams.get('eventId')
    if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

    const quotes = await prisma.quote.findMany({
      where: {
        match: {
          event_request: {
            event: { id: eventId, customer_id: (session.user!.id as string) },
          },
        },
      },
      include: {
        vendor: { select: { id: true, business_name: true, city: true, profile_photo_url: true } },
        menu_items: { orderBy: [{ category: 'asc' }, { sort_order: 'asc' }] },
        match: { select: { score: true, rank: true } },
      },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json(quotes)
  }

  if (role === 'vendor') {
    const quotes = await prisma.quote.findMany({
      where: { vendor_id: (session.user!.id as string) },
      include: {
        match: {
          include: {
            event_request: {
              include: {
                event: {
                  select: { event_name: true, event_date: true, guest_count: true, city: true },
                },
                menu_preference: true,
              },
            },
          },
        },
        menu_items: true,
      },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json(quotes)
  }

  return NextResponse.json({ error: 'Invalid role' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const match = await prisma.match.findFirst({
    where: {
      id: parsed.data.match_id,
      event_request: {
        event: { customer_id: (session.user!.id as string) },
      },
    },
    include: { event_request: true },
  })
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const existing = await prisma.quote.findFirst({
    where: { match_id: match.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'Quote already exists for this match' }, { status: 409 })
  }

  const quote = await prisma.quote.create({
    data: {
      match_id: match.id,
      vendor_id: match.vendor_id,
      total_estimate: 0,
      currency: 'GBP',
      status: 'DRAFT',
    },
  })

  await prisma.match.update({
    where: { id: match.id },
    data: { status: 'QUOTED' },
  })

  return NextResponse.json(quote, { status: 201 })
}
