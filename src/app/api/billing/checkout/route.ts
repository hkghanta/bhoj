import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, PLANS } from '@/lib/stripe'
import { z } from 'zod'

const schema = z.object({
  tier: z.enum(['PRO', 'PREMIUM']),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const vendor = await prisma.vendor.findUnique({
    where: { id: session.user!.id as string },
    include: {
      subscriptions: { orderBy: { created_at: 'desc' }, take: 1 },
    },
  })
  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

  const plan = PLANS[parsed.data.tier]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${appUrl}/vendor/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
    cancel_url: `${appUrl}/vendor/billing?status=cancelled`,
    metadata: {
      vendor_id: vendor.id,
      tier: parsed.data.tier,
    },
    subscription_data: {
      metadata: { vendor_id: vendor.id, tier: parsed.data.tier },
    },
    ...(vendor.email ? { customer_email: vendor.email } : {}),
  })

  return NextResponse.json({ url: checkoutSession.url })
}
