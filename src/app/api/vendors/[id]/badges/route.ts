import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/vendors/[id]/badges
 * Public endpoint — list all non-expired badges for a vendor.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const badges = await prisma.vendorBadge.findMany({
    where: {
      vendor_id: id,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    },
    select: {
      id: true,
      badge_type: true,
      earned_at: true,
      expires_at: true,
    },
    orderBy: { earned_at: 'desc' },
  })

  return NextResponse.json(badges)
}
