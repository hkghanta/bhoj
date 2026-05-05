import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { BadgeType } from '@prisma/client'

const BADGE_EXPIRY_DAYS = 30

/**
 * POST /api/admin/badges/recalculate
 * Recalculate all vendor badges based on criteria (admin only).
 *
 * TOP_RATED:       avg overall_rating >= 4.5, min 5 reviews
 * FAST_RESPONDER:  median quote response < 2h over last 30 days, min 5 quotes
 * POPULAR:         10+ accepted quotes in last 90 days
 * NEW_VENDOR:      joined within 30 days, 0 accepted quotes
 */
export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const vendors = await prisma.vendor.findMany({
    where: { is_active: true },
    select: { id: true, created_at: true },
  })

  const now = new Date()
  const expiresAt = new Date(now.getTime() + BADGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  let awarded = 0
  let revoked = 0

  for (const vendor of vendors) {
    const earned: BadgeType[] = []

    // TOP_RATED: avg rating >= 4.5, min 5 reviews
    const reviews = await prisma.review.findMany({
      where: { vendor_id: vendor.id, is_published: true },
      select: { overall_rating: true },
    })
    if (reviews.length >= 5) {
      const avg = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length
      if (avg >= 4.5) earned.push('TOP_RATED')
    }

    // FAST_RESPONDER: median response time < 2h, min 5 quotes in last 30 days
    const recentQuotes = await prisma.quote.findMany({
      where: {
        vendor_id: vendor.id,
        created_at: { gte: thirtyDaysAgo },
      },
      select: { created_at: true, match: { select: { created_at: true } } },
    })
    if (recentQuotes.length >= 5) {
      const responseTimes = recentQuotes
        .map(q => q.created_at.getTime() - q.match.created_at.getTime())
        .sort((a, b) => a - b)
      const median = responseTimes[Math.floor(responseTimes.length / 2)]
      if (median < 2 * 60 * 60 * 1000) earned.push('FAST_RESPONDER')
    }

    // POPULAR: 10+ accepted quotes in last 90 days
    const acceptedCount = await prisma.quote.count({
      where: {
        vendor_id: vendor.id,
        status: 'ACCEPTED',
        created_at: { gte: ninetyDaysAgo },
      },
    })
    if (acceptedCount >= 10) earned.push('POPULAR')

    // NEW_VENDOR: joined within 30 days, 0 accepted quotes
    const totalAccepted = await prisma.quote.count({
      where: { vendor_id: vendor.id, status: 'ACCEPTED' },
    })
    if (vendor.created_at >= thirtyDaysAgo && totalAccepted === 0) {
      earned.push('NEW_VENDOR')
    }

    // Sync badges: award missing, revoke unearned
    const existing = await prisma.vendorBadge.findMany({
      where: { vendor_id: vendor.id },
    })
    const existingTypes = new Set(existing.map(b => b.badge_type))

    for (const badgeType of earned) {
      if (!existingTypes.has(badgeType)) {
        await prisma.vendorBadge.create({
          data: { vendor_id: vendor.id, badge_type: badgeType, expires_at: expiresAt },
        })
        awarded++
      } else {
        // Refresh expiry
        await prisma.vendorBadge.update({
          where: { vendor_id_badge_type: { vendor_id: vendor.id, badge_type: badgeType } },
          data: { expires_at: expiresAt },
        })
      }
    }

    // Revoke auto-calculated badges that are no longer earned
    // Don't revoke VERIFIED or PREMIUM (manually assigned)
    const autoTypes: BadgeType[] = ['TOP_RATED', 'FAST_RESPONDER', 'POPULAR', 'NEW_VENDOR']
    for (const badge of existing) {
      if (autoTypes.includes(badge.badge_type) && !earned.includes(badge.badge_type)) {
        await prisma.vendorBadge.delete({
          where: { id: badge.id },
        })
        revoked++
      }
    }
  }

  return NextResponse.json({
    vendors_evaluated: vendors.length,
    badges_awarded: awarded,
    badges_revoked: revoked,
  })
}
