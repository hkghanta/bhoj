import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { id: string }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user!.id as string },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const households = await prisma.guestHousehold.findMany({
    where: { event_id: id },
    select: {
      invite_sent_at: true,
      invite_opened_at: true,
      responded_at: true,
      declined: true,
      rsvp_count: true,
      meal_preference: true,
    },
  })

  const total = households.length
  const invited = households.filter(h => h.invite_sent_at !== null).length
  const opened = households.filter(h => h.invite_opened_at !== null).length
  const responded = households.filter(h => h.responded_at !== null).length
  const attending = households.filter(h => (h.rsvp_count ?? 0) > 0 && !h.declined).length
  const declined = households.filter(h => h.declined).length
  const pending = total - responded
  const missing_meal = households.filter(
    h => (h.rsvp_count ?? 0) > 0 && !h.declined && !h.meal_preference
  ).length
  const total_guests = households
    .filter(h => (h.rsvp_count ?? 0) > 0 && !h.declined)
    .reduce((sum, h) => sum + (h.rsvp_count ?? 0), 0)

  return NextResponse.json({
    total,
    invited,
    opened,
    responded,
    attending,
    declined,
    pending,
    missing_meal,
    total_guests,
  })
}
