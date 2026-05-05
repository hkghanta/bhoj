import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/tastings
 * List tastings for the current user.
 * Customer sees their bookings, vendor sees bookings with them.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  const where =
    role === 'vendor'
      ? { vendor_id: userId }
      : { customer_id: userId }

  const tastings = await prisma.tastingBooking.findMany({
    where,
    orderBy: { date: 'asc' },
  })

  return NextResponse.json({ tastings })
}

/**
 * POST /api/tastings
 * Request a tasting. Customer only.
 * Body: { vendor_id, event_id?, quote_id?, booking_type?, date, time_slot?, location?, notes?, guest_count? }
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    vendor_id,
    event_id,
    quote_id,
    booking_type,
    date,
    time_slot,
    location,
    notes,
    guest_count,
  } = body as {
    vendor_id: string
    event_id?: string
    quote_id?: string
    booking_type?: string
    date: string
    time_slot?: string
    location?: string
    notes?: string
    guest_count?: number
  }

  if (!vendor_id || !date) {
    return NextResponse.json({ error: 'vendor_id and date are required' }, { status: 400 })
  }

  const tasting = await prisma.tastingBooking.create({
    data: {
      vendor_id,
      customer_id: userId,
      event_id: event_id ?? null,
      quote_id: quote_id ?? null,
      booking_type: booking_type ?? 'TASTING',
      date: new Date(date),
      time_slot: time_slot ?? null,
      location: location ?? null,
      notes: notes ?? null,
      guest_count: guest_count ?? 2,
    },
  })

  return NextResponse.json({ tasting }, { status: 201 })
}
