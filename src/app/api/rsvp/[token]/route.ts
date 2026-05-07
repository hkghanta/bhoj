import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const household = await prisma.guestHousehold.findUnique({
    where: { token },
    include: {
      event: {
        select: {
          event_name: true,
          event_date: true,
          city: true,
          venue: true,
          invite_image_url: true,
          invite_message: true,
          invite_theme: true,
          dietary_options: true,
          collect_allergens: true,
        },
      },
    },
  })

  if (!household) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  return NextResponse.json({
    household: {
      id: household.id,
      label: household.label,
      declined: household.declined,
      rsvp_status: household.rsvp_status,
      rsvp_count: household.rsvp_count,
      meal_preference: household.meal_preference,
      allergens: household.allergens,
      rsvp_note: household.rsvp_note,
      responded_at: household.responded_at?.toISOString() ?? null,
    },
    event: {
      ...household.event,
      event_date: household.event.event_date.toISOString(),
    },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await req.json()

  const household = await prisma.guestHousehold.findUnique({
    where: { token },
  })

  if (!household) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  const { rsvp_status, rsvp_count, meal_preference, allergens, rsvp_note } = body

  if (!rsvp_status || !['attending', 'not_attending', 'maybe'].includes(rsvp_status)) {
    return NextResponse.json({ error: 'Invalid RSVP status' }, { status: 400 })
  }

  const updated = await prisma.guestHousehold.update({
    where: { token },
    data: {
      rsvp_status,
      rsvp_count: rsvp_count != null ? Number(rsvp_count) : null,
      meal_preference: meal_preference ?? null,
      allergens: Array.isArray(allergens) ? allergens : [],
      rsvp_note: rsvp_note ?? null,
      responded_at: new Date(),
      declined: rsvp_status === 'not_attending',
    },
  })

  return NextResponse.json({
    household: {
      id: updated.id,
      label: updated.label,
      declined: updated.declined,
      rsvp_status: updated.rsvp_status,
      rsvp_count: updated.rsvp_count,
      meal_preference: updated.meal_preference,
      allergens: updated.allergens,
      rsvp_note: updated.rsvp_note,
      responded_at: updated.responded_at?.toISOString() ?? null,
    },
  })
}
