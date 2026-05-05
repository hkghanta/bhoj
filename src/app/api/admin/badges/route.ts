import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/badges
 * List all badges (admin only). Includes vendor info.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const badges = await prisma.vendorBadge.findMany({
    include: {
      vendor: {
        select: {
          id: true,
          business_name: true,
          vendor_type: true,
          city: true,
          profile_photo_url: true,
        },
      },
    },
    orderBy: { earned_at: 'desc' },
  })

  return NextResponse.json(badges)
}

/**
 * POST /api/admin/badges
 * Award a badge to a vendor (admin only).
 * Body: { vendor_id: string, badge_type: BadgeType, expires_at?: string }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { vendor_id, badge_type, expires_at } = body as {
    vendor_id: string
    badge_type: string
    expires_at?: string
  }

  if (!vendor_id || !badge_type) {
    return NextResponse.json({ error: 'vendor_id and badge_type are required' }, { status: 400 })
  }

  const existing = await prisma.vendorBadge.findUnique({
    where: { vendor_id_badge_type: { vendor_id, badge_type: badge_type as any } },
  })

  if (existing) {
    return NextResponse.json({ error: 'Vendor already has this badge' }, { status: 409 })
  }

  const badge = await prisma.vendorBadge.create({
    data: {
      vendor_id,
      badge_type: badge_type as any,
      ...(expires_at ? { expires_at: new Date(expires_at) } : {}),
    },
  })

  return NextResponse.json(badge, { status: 201 })
}
