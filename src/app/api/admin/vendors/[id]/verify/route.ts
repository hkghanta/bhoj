import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get('admin_token')?.value === process.env.ADMIN_SECRET
}

/**
 * POST /api/admin/vendors/[id]/verify
 * Toggle the is_verified flag on a vendor.
 * Body: { verified: boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: vendorId } = await params
  const { verified } = await req.json()

  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      is_verified: verified,
      verified_at: verified ? new Date() : null,
    },
    select: { id: true, business_name: true, is_verified: true, verified_at: true },
  })

  return NextResponse.json(vendor)
}
