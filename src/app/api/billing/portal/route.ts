import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscription = await prisma.subscription.findFirst({
    where: { vendor_id: session.user!.id as string, status: 'active' },
    orderBy: { created_at: 'desc' },
  })

  if (!subscription?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
  const customerId = stripeSub.customer as string

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
