import Stripe from 'stripe'

// Lazily validate so the module can be imported for PLANS constants even without the key
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia' as any,
    typescript: true,
  })
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    leads_limit: 3,
    features: [
      'Up to 3 leads per month',
      'Basic profile listing',
      'Dish library (up to 20 items)',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    leads_limit: 999,
    features: [
      'Unlimited leads',
      'Featured placement',
      'Full portfolio (unlimited photos)',
      'Priority in search results',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    price: 79,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    leads_limit: 999,
    features: [
      'Everything in Pro',
      'Verified badge',
      'Analytics dashboard',
      'Multiple service areas',
      'Priority matching score boost',
    ],
  },
} as const

export const EVENT_PASS_PRICE = 9.99
