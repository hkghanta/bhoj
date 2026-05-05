import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { GuestDietaryType } from '@prisma/client'

const attendeeSchema = z.object({
  name: z.string().optional(),
  dietary_type: z.nativeEnum(GuestDietaryType).default('NON_VEG'),
  allergens: z.array(z.string()).default([]),
})

const submitSchema = z.union([
  z.object({ declined: z.literal(true), attendees: z.array(attendeeSchema).optional() }),
  z.object({ declined: z.undefined().optional(), attendees: z.array(attendeeSchema).min(1).max(20) }),
])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; inviteId: string }> }
) {
  const { token, inviteId } = await params

  const invite = await prisma.guestSubEventInvite.findFirst({
    where: {
      id: inviteId,
      household: { token },
    },
    include: { sub_event: { select: { event_date: true } } },
  })
  if (!invite) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  if (invite.sub_event.event_date < new Date()) {
    return NextResponse.json({ error: 'This event has already taken place' }, { status: 410 })
  }

  const body = await req.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const isDecline = 'declined' in parsed.data && parsed.data.declined === true

  await prisma.$transaction([
    prisma.guestAttendee.deleteMany({ where: { invite_id: inviteId } }),
    ...(!isDecline && parsed.data.attendees ? [
      prisma.guestAttendee.createMany({
        data: parsed.data.attendees.map(a => ({ ...a, invite_id: inviteId })),
      }),
    ] : []),
    prisma.guestSubEventInvite.update({
      where: { id: inviteId },
      data: { responded_at: new Date() },
    }),
  ])

  return NextResponse.json({ success: true })
}
