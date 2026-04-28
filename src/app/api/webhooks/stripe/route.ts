import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { VendorTier } from '@prisma/client'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[stripe-webhook] Invalid signature:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription') {
          await handleSubscriptionCreated(session)
        } else if (session.mode === 'payment') {
          await handleEventPassPurchased(session)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(sub)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(sub)
        break
      }

      default:
        break
    }
  } catch (err: any) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err.message)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

const TIER_LIMITS: Record<VendorTier, number> = { FREE: 3, PRO: 999, PREMIUM: 999 }

async function handleSubscriptionCreated(session: Stripe.Checkout.Session) {
  const vendorId = session.metadata?.vendor_id
  const tier = session.metadata?.tier as VendorTier | undefined
  if (!vendorId || !tier) return

  await prisma.subscription.upsert({
    where: { stripe_subscription_id: session.subscription as string },
    update: {
      status: 'active',
      tier,
      leads_limit: TIER_LIMITS[tier],
    },
    create: {
      vendor_id: vendorId,
      tier,
      stripe_subscription_id: session.subscription as string,
      status: 'active',
      leads_limit: TIER_LIMITS[tier],
      leads_this_month: 0,
    },
  })

  await prisma.vendor.update({ where: { id: vendorId }, data: { tier } })

  console.log(`[stripe-webhook] Subscription created for vendor ${vendorId} → ${tier}`)
}

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  const vendorId = stripeSub.metadata?.vendor_id
  if (!vendorId) return

  const tier = stripeSub.metadata?.tier as VendorTier | undefined
  const status = stripeSub.status === 'active' ? 'active' : 'inactive'
  const currentPeriodEnd = new Date((stripeSub as any).current_period_end * 1000)

  await prisma.subscription.updateMany({
    where: { stripe_subscription_id: stripeSub.id },
    data: {
      status,
      ...(tier ? { tier } : {}),
      current_period_end: currentPeriodEnd,
    },
  })

  if (tier) {
    await prisma.vendor.update({ where: { id: vendorId }, data: { tier } })
  }

  console.log(`[stripe-webhook] Subscription updated for vendor ${vendorId}: ${status}`)
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const vendorId = stripeSub.metadata?.vendor_id
  if (!vendorId) return

  await prisma.subscription.updateMany({
    where: { stripe_subscription_id: stripeSub.id },
    data: { status: 'cancelled', tier: 'FREE', leads_limit: 3 },
  })

  await prisma.vendor.update({ where: { id: vendorId }, data: { tier: 'FREE' } })

  console.log(`[stripe-webhook] Subscription cancelled for vendor ${vendorId} → downgraded to FREE`)
}

async function handleEventPassPurchased(session: Stripe.Checkout.Session) {
  const customerId = session.metadata?.customer_id
  const eventId = session.metadata?.event_id
  if (!customerId || !eventId) return

  const amount = (session.amount_total ?? 0) / 100
  const currency = (session.currency ?? 'gbp').toUpperCase()

  await prisma.customerEventPass.create({
    data: {
      customer_id: customerId,
      event_id: eventId,
      stripe_payment_intent_id: session.payment_intent as string,
      amount,
      currency,
      status: 'ACTIVE',
      expires_at: new Date(Date.now() + 365 * 86400000),
    },
  })

  console.log(`[stripe-webhook] Event Pass purchased: customer ${customerId} for event ${eventId}`)
}
