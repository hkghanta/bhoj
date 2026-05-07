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

// POST body: { mode: 'all' | 'pending' }
// 'all' — sends to every household with an email
// 'pending' — sends only to those who haven't responded yet
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { mode = 'all' } = await req.json() as { mode?: 'all' | 'pending' }

  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user!.id as string },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const households = await prisma.guestHousehold.findMany({
    where: {
      event_id: id,
      email: { not: null },
      declined: false,
    },
  })

  let sent = 0
  let skipped = 0

  for (const household of households) {
    if (!household.email) { skipped++; continue }
    try {
      const rsvpUrl = `${APP_URL}/e/${household.token}`
      const subEvents: { name: string; date: string; venue: string | null }[] = [{
        name: event.event_name,
        date: format(event.event_date, 'EEE d MMM yyyy, h:mm a'),
        venue: event.venue,
      }]

      const isReminder = mode === 'pending'
      const html = await render(
        React.createElement(InviteEmail, {
          householdLabel: household.label,
          eventName: event.event_name,
          inviteMessage: isReminder
            ? `Just a friendly reminder — we'd love to know if you can make it!`
            : event.invite_message,
          inviteImageUrl: event.invite_image_url,
          subEvents,
          rsvpUrl,
        })
      )

      await resend.emails.send({
        from: FROM,
        to: household.email,
        subject: isReminder
          ? `Reminder: RSVP for ${event.event_name}`
          : `You're invited to ${event.event_name}`,
        html,
      })
      sent++
      await new Promise(r => setTimeout(r, 100))
    } catch {
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
