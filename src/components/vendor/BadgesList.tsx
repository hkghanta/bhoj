'use client'

import { useState, useEffect } from 'react'
import { Star, Zap, TrendingUp, Sparkles, ShieldCheck, Crown } from 'lucide-react'

type Badge = {
  id: string
  badge_type: string
  awarded_at: string
}

const BADGE_CONFIG: Record<string, { label: string; icon: typeof Star; bg: string; text: string; border: string }> = {
  TOP_RATED: { label: 'Top Rated', icon: Star, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  FAST_RESPONDER: { label: 'Fast Responder', icon: Zap, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  POPULAR: { label: 'Popular', icon: TrendingUp, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  NEW_VENDOR: { label: 'New Vendor', icon: Sparkles, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  VERIFIED: { label: 'Verified', icon: ShieldCheck, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  PREMIUM: { label: 'Premium', icon: Crown, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
}

export function BadgesList({ vendorId }: { vendorId: string }) {
  const [badges, setBadges] = useState<Badge[]>([])

  useEffect(() => {
    fetch(`/api/vendors/${vendorId}/badges`)
      .then(r => (r.ok ? r.json() : []))
      .then(setBadges)
      .catch(() => {})
  }, [vendorId])

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map(badge => {
        const config = BADGE_CONFIG[badge.badge_type]
        if (!config) return null
        const Icon = config.icon
        return (
          <span
            key={badge.id}
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        )
      })}
    </div>
  )
}
