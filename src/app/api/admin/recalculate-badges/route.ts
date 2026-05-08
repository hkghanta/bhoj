import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { BadgeType } from '@prisma/client'

/**
 * POST /api/admin/recalculate-badges
 * Recalculate vendor stats and badges for all active vendors.
 * Open endpoint (no auth) for cron job usage.
 *
 * For each active vendor:
 *  - avg_rating, total_reviews from Reviews
 *  - avg_response_hrs from Match -> first Quote response time
 *  - total_bookings from accepted quotes
 *  - Badges awarded based on criteria (upsert)
 */
export async function POST() {
  const vendors = await prisma.vendor.findMany({
    where: { is_active: true },
    select: {
      id: true,
      created_at: true,
      is_verified: true,
      tier: true,
    },
  })

  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  let totalAwarded = 0
  let totalVendors = vendors.length

  for (const vendor of vendors) {
    // --- Calculate avg_rating and total_reviews ---
    const reviews = await prisma.review.findMany({
      where: { vendor_id: vendor.id, is_published: true },
      select: { overall_rating: true },
    })
    const totalReviews = reviews.length
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.overall_rating, 0) / totalReviews
        : null

    // --- Calculate avg_response_hrs ---
    // For each match, find the earliest quote created_at and compute delta from match.created_at
    const matchesWithQuotes = await prisma.match.findMany({
      where: { vendor_id: vendor.id },
      select: {
        created_at: true,
        quotes: {
          select: { created_at: true },
          orderBy: { created_at: 'asc' },
          take: 1,
        },
      },
    })

    const responseTimes: number[] = []
    for (const m of matchesWithQuotes) {
      if (m.quotes.length > 0) {
        const deltaMs = m.quotes[0].created_at.getTime() - m.created_at.getTime()
        if (deltaMs >= 0) {
          responseTimes.push(deltaMs / (1000 * 60 * 60)) // convert to hours
        }
      }
    }
    const avgResponseHrs =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : null

    // --- Count total bookings (accepted quotes) ---
    const totalBookings = await prisma.quote.count({
      where: { vendor_id: vendor.id, status: 'ACCEPTED' },
    })

    // --- Update vendor stats ---
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        avg_rating: avgRating,
        total_reviews: totalReviews,
        avg_response_hrs: avgResponseHrs,
        total_bookings: totalBookings,
      },
    })

    // --- Determine which badges to award ---
    const earned: BadgeType[] = []

    // TOP_RATED: avg_rating >= 4.5 AND total_reviews >= 3
    if (avgRating !== null && avgRating >= 4.5 && totalReviews >= 3) {
      earned.push('TOP_RATED')
    }

    // FAST_RESPONDER: avg_response_hrs <= 4
    if (avgResponseHrs !== null && avgResponseHrs <= 4) {
      earned.push('FAST_RESPONDER')
    }

    // POPULAR: total_bookings >= 5
    if (totalBookings >= 5) {
      earned.push('POPULAR')
    }

    // NEW_VENDOR: created within last 90 days AND no other badges earned yet
    const existingBadges = await prisma.vendorBadge.findMany({
      where: { vendor_id: vendor.id },
    })
    if (
      vendor.created_at >= ninetyDaysAgo &&
      existingBadges.length === 0 &&
      earned.length === 0
    ) {
      earned.push('NEW_VENDOR')
    }

    // VERIFIED: is_verified = true
    if (vendor.is_verified) {
      earned.push('VERIFIED')
    }

    // PREMIUM: tier = PREMIUM
    if (vendor.tier === 'PREMIUM') {
      earned.push('PREMIUM')
    }

    // --- Upsert badges ---
    for (const badgeType of earned) {
      await prisma.vendorBadge.upsert({
        where: {
          vendor_id_badge_type: { vendor_id: vendor.id, badge_type: badgeType },
        },
        create: {
          vendor_id: vendor.id,
          badge_type: badgeType,
        },
        update: {}, // no-op if exists
      })
      totalAwarded++
    }

    // Remove auto-calculated badges that are no longer earned
    const autoTypes: BadgeType[] = [
      'TOP_RATED',
      'FAST_RESPONDER',
      'POPULAR',
      'NEW_VENDOR',
      'VERIFIED',
      'PREMIUM',
    ]
    for (const badge of existingBadges) {
      if (autoTypes.includes(badge.badge_type) && !earned.includes(badge.badge_type)) {
        await prisma.vendorBadge.delete({ where: { id: badge.id } })
      }
    }
  }

  return NextResponse.json({
    success: true,
    vendors_evaluated: totalVendors,
    badges_upserted: totalAwarded,
  })
}
