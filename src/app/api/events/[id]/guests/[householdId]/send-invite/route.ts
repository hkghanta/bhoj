import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { InviteEmail } from '@/lib/notifications/templates/invite-email'
import { render } from '@react-email/render'
import { format } from 'date-fns'
import * as React from 'react'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oneseva.com'
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; householdId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, householdId } = await params

  const household = await prisma.guestHousehold.findFirst({
    where: { id: householdId, event_id: id, event: { customer_id: session.user!.id as string } },
    include: {
      event: true,
    },
  })
  if (!household) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!household.email) return NextResponse.json({ error: 'No email address for this household' }, { status: 400 })

  const rsvpUrl = `${APP_URL}/e/${household.token}`
  const subEvents: { name: string; date: string; venue: string | null }[] = [{
    name: household.event.event_name,
    date: format(household.event.event_date, 'EEE d MMM yyyy, h:mm a'),
    venue: household.event.venue,
  }]

  const html = await render(
    React.createElement(InviteEmail, {
      householdLabel: household.label,
      eventName: household.event.event_name,
      inviteMessage: household.event.invite_message,
      inviteImageUrl: household.event.invite_image_url,
      subEvents,
      rsvpUrl,
    })
  )

  const { error } = await resend.emails.send({
    from: FROM,
    to: household.email,
    subject: `You're invited to ${household.event.event_name}`,
    html,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sent: true })
}
