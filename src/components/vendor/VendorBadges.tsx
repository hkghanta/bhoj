import { Star, Zap, TrendingUp, Sparkles, ShieldCheck, Gem, Clock } from 'lucide-react'

type BadgeConfig = {
  label: string
  icon: typeof Star
  className: string
}

const BADGE_CONFIG: Record<string, BadgeConfig> = {
  TOP_RATED: {
    label: 'Top Rated',
    icon: Star,
    className: 'bg-amber-50 text-amber-700',
  },
  FAST_RESPONDER: {
    label: 'Fast Responder',
    icon: Zap,
    className: 'bg-blue-50 text-blue-700',
  },
  POPULAR: {
    label: 'Popular',
    icon: TrendingUp,
    className: 'bg-green-50 text-green-700',
  },
  NEW_VENDOR: {
    label: 'New Vendor',
    icon: Sparkles,
    className: 'bg-purple-50 text-purple-700',
  },
  VERIFIED: {
    label: 'Verified',
    icon: ShieldCheck,
    className: 'bg-sky-50 text-sky-700',
  },
  PREMIUM: {
    label: 'Premium',
    icon: Gem,
    className: 'bg-brand/10 text-brand',
  },
}

type VendorBadgesProps = {
  badges: { badge_type: string }[]
  responseHrs?: number | null
}

export function VendorBadges({ badges, responseHrs }: VendorBadgesProps) {
  if (badges.length === 0 && !responseHrs) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((badge) => {
        const config = BADGE_CONFIG[badge.badge_type]
        if (!config) return null
        const Icon = config.icon
        return (
          <span
            key={badge.badge_type}
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        )
      })}
      {responseHrs != null && (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-600">
          <Clock className="h-3 w-3" />
          Responds in ~{responseHrs < 1 ? `${Math.round(responseHrs * 60)}m` : `${Math.round(responseHrs)}h`}
        </span>
      )}
    </div>
  )
}
