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
          city: true,
          venue: true,
          invite_image_url: true,
          invite_message: true,
          invite_theme: true,
          dietary_options: true,
          collect_allergens: true,
        },
      },
      invites: {
        include: {
          sub_event: {
            select: { id: true, name: true, event_date: true, venue: true },
          },
          attendees: true,
        },
        orderBy: { sub_event: { event_date: 'asc' } },
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
    },
    event: household.event,
    invites: household.invites.map(inv => ({
      id: inv.id,
      sub_event: inv.sub_event,
      responded_at: inv.responded_at,
      attendees: inv.attendees,
    })),
  })
}
