'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PricingCard } from '@/components/billing/PricingCard'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PLANS } from '@/lib/stripe'

type Subscription = {
  tier: string
  status: string
  leads_this_month: number
  leads_limit: number
  current_period_end: string | null
}

export default function VendorBillingPage() {
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)

  useEffect(() => {
    fetch('/api/vendor/profile')
      .then(r => r.json())
      .then(data => {
        setSubscription(data.subscriptions?.[0] ?? null)
      })
  }, [])

  const successMessage = searchParams.get('status') === 'success'
    ? 'Your subscription has been activated!'
    : null

  async function handleUpgrade(tier: 'PRO' | 'PREMIUM') {
    setUpgrading(true)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setUpgrading(false)
  }

  async function openPortal() {
    setOpeningPortal(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setOpeningPortal(false)
  }

  const currentTier = subscription?.tier ?? 'FREE'

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          {subscription && (
            <p className="text-gray-500 mt-1">
              Current plan: <strong className="text-orange-600">{subscription.tier}</strong>
              {subscription.leads_limit < 999 && (
                <span className="ml-2 text-gray-400">
                  ({subscription.leads_this_month}/{subscription.leads_limit} leads this month)
                </span>
              )}
            </p>
          )}
        </div>
        {currentTier !== 'FREE' && (
          <button
            onClick={openPortal}
            disabled={openingPortal}
            className={cn(buttonVariants({ variant: 'outline' }), 'disabled:opacity-50')}
          >
            {openingPortal ? 'Opening portal…' : 'Manage Billing'}
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {(['FREE', 'PRO', 'PREMIUM'] as const).map(tier => (
          <PricingCard
            key={tier}
            plan={PLANS[tier]}
            tier={tier}
            currentTier={currentTier}
            onUpgrade={handleUpgrade}
            upgrading={upgrading}
          />
        ))}
      </div>

      {currentTier !== 'FREE' && subscription?.current_period_end && (
        <p className="text-sm text-gray-400 mt-6 text-center">
          Current billing period ends{' '}
          {new Date(subscription.current_period_end).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}
