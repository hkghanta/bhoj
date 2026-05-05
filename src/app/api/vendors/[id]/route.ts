import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/vendors/[id]
 * Public vendor profile. No auth required for basic profile.
 * Authenticated customers also get match context when matchId/eventId is provided.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  const { id: vendorId } = await params
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  const eventId = searchParams.get('eventId')

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId, is_active: true },
    select: {
      id: true,
      business_name: true,
      city: true,
      country: true,
      vendor_type: true,
      profile_type: true,
      first_name: true,
      last_name: true,
      profile_photo_url: true,
      description: true,
      website: true,
      instagram: true,
      is_verified: true,
      photos: {
        orderBy: [{ is_cover: 'desc' }, { sort_order: 'asc' }],
        select: { id: true, url: true, caption: true, is_cover: true },
      },
      menu_packages: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          description: true,
          price_per_head: true,
          currency: true,
          min_guests: true,
          max_guests: true,
          is_halal: true,
          is_jain: true,
          is_vegetarian: true,
          is_vegan: true,
          nut_free: true,
          gluten_free: true,
          dairy_free: true,
          includes_service: true,
          includes_setup: true,
          cuisine_type: true,
        },
        orderBy: { price_per_head: 'asc' },
      },
      reviews: {
        where: { is_published: true },
        select: {
          id: true,
          overall_rating: true,
          food_quality_rating: true,
          service_rating: true,
          value_rating: true,
          title: true,
          body: true,
          event_type: true,
          created_at: true,
          customer: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
      },
      metrics: {
        orderBy: { period: 'desc' },
        take: 1,
        select: { avg_rating: true },
      },
      badges: {
        where: { OR: [{ expires_at: null }, { expires_at: { gte: new Date() } }] },
        select: { badge_type: true, earned_at: true },
      },
      sustainability_tags: true,
      stations: {
        where: { is_active: true },
        include: { station_template: { select: { name: true, icon: true } } },
        orderBy: { created_at: 'desc' },
      },
      cancellation_policies: {
        orderBy: { hours_before_event: 'desc' },
      },
    },
  })

  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

  const avgRating = vendor.metrics[0]?.avg_rating
    ? Number(vendor.metrics[0].avg_rating)
    : vendor.reviews.length
      ? vendor.reviews.reduce((s, r) => s + r.overall_rating, 0) / vendor.reviews.length
      : null

  // Match context if authenticated customer is viewing within an event
  let matchContext: { id: string; score: number; rank: number; status: string } | null = null
  if (session) {
    if (matchId) {
      const match = await prisma.match.findFirst({
        where: { id: matchId, vendor_id: vendorId },
        select: { id: true, score: true, rank: true, status: true },
      })
      matchContext = match
    } else if (eventId && (session.user as any).role === 'customer') {
      const match = await prisma.match.findFirst({
        where: {
          vendor_id: vendorId,
          event_request: { event_id: eventId, customer_id: session.user!.id as string },
        },
        orderBy: { rank: 'asc' },
        select: { id: true, score: true, rank: true, status: true },
      })
      matchContext = match
    }
  }

  const { metrics: _metrics, ...vendorData } = vendor
  return NextResponse.json({
    ...vendorData,
    avg_rating: avgRating,
    review_count: vendor.reviews.length,
    match: matchContext,
  })
}
