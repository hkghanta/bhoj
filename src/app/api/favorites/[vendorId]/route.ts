import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/favorites/[vendorId]
 * Check if the authenticated customer has favorited a vendor.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { vendorId } = await params

  const favorite = await prisma.favorite.findUnique({
    where: { customer_id_vendor_id: { customer_id: userId, vendor_id: vendorId } },
  })

  return NextResponse.json({ favorited: !!favorite })
}

/**
 * DELETE /api/favorites/[vendorId]
 * Remove a vendor from the customer's favorites.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { vendorId } = await params

  await prisma.favorite.deleteMany({
    where: { customer_id: userId, vendor_id: vendorId },
  })

  return NextResponse.json({ success: true })
}
