import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const schema = z.object({
  event_id: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const event = await prisma.event.findFirst({
    where: { id: parsed.data.event_id, customer_id: session.user!.id as string },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const existing = await prisma.customerEventPass.findFirst({
    where: { customer_id: session.user!.id as string, event_id: parsed.data.event_id, status: 'ACTIVE' },
  })
  if (existing) {
    return NextResponse.json({ error: 'You already have an active pass for this event' }, { status: 409 })
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.user!.id as string } })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Bhoj Event Pass',
            description: `Unlimited quotes + collaborators + PDF export for "${event.event_name}"`,
          },
          unit_amount: 999,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/events/${event.id}?pass_purchased=1`,
    cancel_url: `${appUrl}/events/${event.id}`,
    metadata: {
      customer_id: session.user!.id as string,
      event_id: event.id,
    },
    ...(customer?.email ? { customer_email: customer.email } : {}),
  })

  return NextResponse.json({ url: checkoutSession.url })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })

  const pass = await prisma.customerEventPass.findFirst({
    where: {
      customer_id: session.user!.id as string,
      event_id: eventId,
      status: 'ACTIVE',
      expires_at: { gt: new Date() },
    },
  })

  return NextResponse.json({ has_pass: !!pass, pass })
}
