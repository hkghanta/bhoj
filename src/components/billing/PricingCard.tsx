'use client'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

type Plan = {
  name: string
  price: number
  features: readonly string[]
  priceId: string | null
  leads_limit: number
}

type Props = {
  plan: Plan
  tier: 'FREE' | 'PRO' | 'PREMIUM'
  currentTier: string
  onUpgrade: (tier: 'PRO' | 'PREMIUM') => void
  upgrading: boolean
}

export function PricingCard({ plan, tier, currentTier, onUpgrade, upgrading }: Props) {
  const isCurrent = currentTier === tier
  const isUpgrade = tier !== 'FREE' && currentTier !== tier

  return (
    <div className={`rounded-xl border p-6 flex flex-col ${
      tier === 'PREMIUM' ? 'border-orange-400 ring-2 ring-orange-200' :
      isCurrent ? 'border-green-300 bg-green-50' : ''
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
        {tier === 'PREMIUM' && <Badge className="bg-orange-600 text-white">Most Popular</Badge>}
        {isCurrent && <Badge className="bg-green-600 text-white">Current Plan</Badge>}
      </div>

      <div className="mb-6">
        {plan.price === 0 ? (
          <span className="text-3xl font-bold text-gray-900">Free</span>
        ) : (
          <div>
            <span className="text-3xl font-bold text-gray-900">£{plan.price}</span>
            <span className="text-gray-400">/month</span>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {plan.leads_limit >= 999 ? 'Unlimited leads' : `${plan.leads_limit} leads/month`}
        </p>
      </div>

      <ul className="space-y-2 flex-1 mb-6">
        {plan.features.map(feature => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      {isUpgrade && (
        <button
          onClick={() => onUpgrade(tier as 'PRO' | 'PREMIUM')}
          disabled={upgrading}
          className={cn(
            buttonVariants(),
            'w-full disabled:opacity-50',
            tier === 'PREMIUM' ? 'bg-orange-600 hover:bg-orange-700' : ''
          )}
        >
          {upgrading ? 'Redirecting…' : `Upgrade to ${plan.name}`}
        </button>
      )}
      {isCurrent && tier !== 'FREE' && (
        <p className="text-center text-sm text-green-600">✓ Active</p>
      )}
      {tier === 'FREE' && !isCurrent && (
        <p className="text-center text-sm text-gray-400">Downgrade via billing portal</p>
      )}
    </div>
  )
}
