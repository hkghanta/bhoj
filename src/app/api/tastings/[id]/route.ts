import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

/**
 * GET /api/tastings/[id]
 * Get tasting details. Customer or vendor party only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  const { id } = await params

  const tasting = await prisma.tastingBooking.findUnique({
    where: { id },
  })

  if (!tasting) {
    return NextResponse.json({ error: 'Tasting not found' }, { status: 404 })
  }

  // Only the customer or vendor involved can view
  const isParty =
    (role === 'customer' && tasting.customer_id === userId) ||
    (role === 'vendor' && tasting.vendor_id === userId)

  if (!isParty) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ tasting })
}

/**
 * PATCH /api/tastings/[id]
 * Update status (vendor confirms/reschedules) or update details. Both parties.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  const { id } = await params

  const tasting = await prisma.tastingBooking.findUnique({
    where: { id },
  })

  if (!tasting) {
    return NextResponse.json({ error: 'Tasting not found' }, { status: 404 })
  }

  const isParty =
    (role === 'customer' && tasting.customer_id === userId) ||
    (role === 'vendor' && tasting.vendor_id === userId)

  if (!isParty) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { status, date, time_slot, location, notes, guest_count, booking_type } = body as {
    status?: string
    date?: string
    time_slot?: string | null
    location?: string | null
    notes?: string | null
    guest_count?: number
    booking_type?: string
  }

  const updated = await prisma.tastingBooking.update({
    where: { id },
    data: {
      ...(status !== undefined && { status: status as 'REQUESTED' | 'CONFIRMED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(time_slot !== undefined && { time_slot }),
      ...(location !== undefined && { location }),
      ...(notes !== undefined && { notes }),
      ...(guest_count !== undefined && { guest_count }),
      ...(booking_type !== undefined && { booking_type }),
    },
  })

  return NextResponse.json({ tasting: updated })
}

/**
 * DELETE /api/tastings/[id]
 * Cancel tasting. Either party can cancel.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  const { id } = await params

  const tasting = await prisma.tastingBooking.findUnique({
    where: { id },
  })

  if (!tasting) {
    return NextResponse.json({ error: 'Tasting not found' }, { status: 404 })
  }

  const isParty =
    (role === 'customer' && tasting.customer_id === userId) ||
    (role === 'vendor' && tasting.vendor_id === userId)

  if (!isParty) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.tastingBooking.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json({ success: true })
}
