import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runMatchJob } from '@/lib/jobs/match'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  const eventRequestId = searchParams.get('eventRequestId')

  const customerId = session.user!.id as string

  // Legacy: single event request
  if (eventRequestId) {
    const eventRequest = await prisma.eventRequest.findFirst({
      where: { id: eventRequestId, customer_id: customerId },
    })
    if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const matches = await prisma.match.findMany({
      where: { event_request_id: eventRequestId },
      include: {
        vendor: {
          include: {
            photos: { where: { is_cover: true }, take: 1 },
            menu_packages: { where: { is_active: true }, take: 3 },
            reviews: { where: { is_published: true }, take: 5 },
          },
        },
      },
      orderBy: { rank: 'asc' },
    })

    return NextResponse.json(matches.map(m => ({
      ...m,
      vendor: {
        ...m.vendor,
        avg_rating: m.vendor.reviews.length
          ? m.vendor.reviews.reduce((s, r) => s + r.overall_rating, 0) / m.vendor.reviews.length
          : null,
      },
    })))
  }

  if (!eventId) return NextResponse.json({ error: 'eventId or eventRequestId required' }, { status: 400 })

  // Verify event belongs to customer
  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Get existing EventRequests (only those the customer explicitly created)
  const existingRequests = await prisma.eventRequest.findMany({
    where: { event_id: eventId, customer_id: customerId },
  })

  // For OPEN requests with no matches yet, run matching now
  for (const req of existingRequests) {
    if (req.status === 'OPEN') {
      const existingMatchCount = await prisma.match.count({ where: { event_request_id: req.id } })
      if (existingMatchCount === 0) {
        await runMatchJob({ eventRequestId: req.id }).catch(err =>
          console.error(`[matches] runMatchJob failed for ${req.vendor_type}:`, err.message)
        )
      }
    }
  }

  // Fetch all matches for this event
  const matches = await prisma.match.findMany({
    where: {
      event_request: { event_id: eventId, customer_id: customerId },
    },
    include: {
      vendor: {
        include: {
          photos: { where: { is_cover: true }, take: 1 },
          menu_packages: { where: { is_active: true }, take: 3 },
          reviews: { where: { is_published: true }, take: 5 },
        },
      },
    },
    orderBy: [{ vendor_type: 'asc' }, { rank: 'asc' }],
  })

  const enriched = matches.map(m => ({
    ...m,
    vendor: {
      ...m.vendor,
      avg_rating: m.vendor.reviews.length
        ? m.vendor.reviews.reduce((s, r) => s + r.overall_rating, 0) / m.vendor.reviews.length
        : null,
    },
  }))

  const grouped: Record<string, typeof enriched> = {}
  for (const m of enriched) {
    if (!grouped[m.vendor_type]) grouped[m.vendor_type] = []
    grouped[m.vendor_type].push(m)
  }

  return NextResponse.json({ matches: enriched, grouped })
}
