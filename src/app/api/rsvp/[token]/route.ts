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
    },
    event: {
      ...household.event,
      event_date: household.event.event_date.toISOString(),
    },
  })
}
