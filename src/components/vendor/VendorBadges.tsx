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
    className: 'bg-amber-500/[0.07] text-amber-700',
  },
  FAST_RESPONDER: {
    label: 'Fast Responder',
    icon: Zap,
    className: 'bg-blue-500/[0.07] text-blue-600',
  },
  POPULAR: {
    label: 'Popular',
    icon: TrendingUp,
    className: 'bg-green-500/[0.07] text-green-700',
  },
  NEW_VENDOR: {
    label: 'New',
    icon: Sparkles,
    className: 'bg-purple-500/[0.07] text-purple-600',
  },
  VERIFIED: {
    label: 'Verified',
    icon: ShieldCheck,
    className: 'bg-sky-500/[0.07] text-sky-600',
  },
  PREMIUM: {
    label: 'Premium',
    icon: Gem,
    className: 'bg-brand/[0.07] text-brand',
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
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${config.className}`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        )
      })}
      {responseHrs != null && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-500/[0.07] text-gray-600">
          <Clock className="h-3 w-3" />
          Responds in ~{responseHrs < 1 ? `${Math.round(responseHrs * 60)}m` : `${Math.round(responseHrs)}h`}
        </span>
      )}
    </div>
  )
}
