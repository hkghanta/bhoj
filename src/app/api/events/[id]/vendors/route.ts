import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/events/[id]/vendors
 * List all vendors attached to an event with their quotes and timelines.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user!.id as string },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const eventVendors = await prisma.eventVendor.findMany({
    where: { event_id: id },
    include: {
      vendor: {
        select: {
          id: true,
          business_name: true,
          vendor_type: true,
          city: true,
          profile_photo_url: true,
          sustainability_tags: true,
          badges: {
            where: { OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }] },
            select: { badge_type: true },
          },
        },
      },
      quote: {
        select: {
          id: true,
          total_estimate: true,
          price_per_head: true,
          currency: true,
          status: true,
        },
      },
    },
    orderBy: { created_at: 'asc' },
  })

  const totalSpend = eventVendors.reduce(
    (sum, ev) => sum + (ev.quote ? Number(ev.quote.total_estimate) : 0),
    0
  )

  return NextResponse.json({
    vendors: eventVendors,
    total_spend: totalSpend,
    currency: event.currency,
  })
}
