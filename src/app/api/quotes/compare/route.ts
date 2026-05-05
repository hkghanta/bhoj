import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const eventRequestId = searchParams.get('eventRequestId')
  if (!eventRequestId) return NextResponse.json({ error: 'eventRequestId required' }, { status: 400 })

  const eventRequest = await prisma.eventRequest.findFirst({
    where: {
      id: eventRequestId,
      event: { customer_id: (session.user!.id as string) },
    },
    include: { event: true, menu_preference: true },
  })
  if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const quotes = await prisma.quote.findMany({
    where: {
      match: { event_request_id: eventRequestId },
      status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'NEGOTIATING'] },
    },
    include: {
      vendor: {
        select: {
          id: true,
          business_name: true,
          city: true,
          tier: true,
          is_verified: true,
          profile_photo_url: true,
          sustainability_tags: true,
          badges: {
            where: { OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }] },
            select: { badge_type: true },
          },
          cancellation_policies: {
            orderBy: { hours_before_event: 'desc' },
            select: { hours_before_event: true, refund_percent: true },
          },
          cancellation_preset: {
            select: { name: true, tiers: true },
          },
          stations: {
            where: { is_active: true },
            include: { station_template: { select: { name: true } } },
          },
        },
      },
      menu_items: { orderBy: [{ category: 'asc' }, { sort_order: 'asc' }] },
      match: { select: { score: true, rank: true, created_at: true } },
    },
    orderBy: { total_estimate: 'asc' },
  })

  // Compute auto-tags
  // Get vendor ratings
  const vendorIds = quotes.map(q => q.vendor_id)
  const reviews = await prisma.review.groupBy({
    by: ['vendor_id'],
    where: { vendor_id: { in: vendorIds }, is_published: true },
    _avg: { overall_rating: true },
    _count: { id: true },
  })
  const ratingMap = new Map(reviews.map(r => [r.vendor_id, { avg: r._avg.overall_rating ?? 0, count: r._count.id }]))

  let cheapestId: string | null = null
  let highestRatedId: string | null = null
  let fastestId: string | null = null
  let lowestPrice = Infinity
  let highestRating = 0
  let fastestTime = Infinity

  for (const q of quotes) {
    const total = Number(q.total_estimate)
    if (total < lowestPrice) { lowestPrice = total; cheapestId = q.id }

    const rating = ratingMap.get(q.vendor_id)
    if (rating && rating.avg > highestRating) { highestRating = rating.avg; highestRatedId = q.id }

    const responseTime = q.created_at.getTime() - q.match.created_at.getTime()
    if (responseTime < fastestTime) { fastestTime = responseTime; fastestId = q.id }
  }

  const enrichedQuotes = quotes.map(q => ({
    ...q,
    tags: [
      ...(q.id === cheapestId ? ['Cheapest'] : []),
      ...(q.id === highestRatedId ? ['Highest Rated'] : []),
      ...(q.id === fastestId ? ['Fastest Response'] : []),
    ],
    vendor_rating: ratingMap.get(q.vendor_id) ?? { avg: 0, count: 0 },
    response_time_ms: q.created_at.getTime() - q.match.created_at.getTime(),
  }))

  return NextResponse.json({ event_request: eventRequest, quotes: enrichedQuotes })
}
