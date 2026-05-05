import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/vendors/[id]/cancellation-policy
 * Public endpoint — list a vendor's cancellation tiers ordered by hours_before_event DESC.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vendorId } = await params

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId, is_active: true },
    select: { id: true },
  })

  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  const tiers = await prisma.cancellationPolicy.findMany({
    where: { vendor_id: vendorId },
    orderBy: { hours_before_event: 'desc' },
  })

  return NextResponse.json({ tiers })
}
