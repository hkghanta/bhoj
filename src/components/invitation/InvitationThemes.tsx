import Image from 'next/image'
import { format } from 'date-fns'
import { MapPin, Calendar } from 'lucide-react'

// ---------------------------------------------------------------------------
// Theme definitions
// ---------------------------------------------------------------------------

export type InvitationTheme = {
  key: string
  name: string
  gradient: string
  accentColor: string
  textColor: 'white' | 'dark'
  fontFamily: string
  pattern?: string
  borderStyle?: string
}

export const INVITATION_THEMES: InvitationTheme[] = [
  {
    key: 'saffron',
    name: 'Saffron',
    gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 40%, #c2410c 100%)',
    accentColor: '#f59e0b',
    textColor: 'white',
    fontFamily: 'Georgia, "Times New Roman", serif',
    pattern:
      'radial-gradient(circle at 20% 80%, rgba(245,158,11,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(194,65,12,0.10) 0%, transparent 50%)',
    borderStyle: 'border-b-4 border-amber-400/40',
  },
  {
    key: 'royal',
    name: 'Royal',
    gradient: 'linear-gradient(160deg, #1e1b4b 0%, #581c87 50%, #92400e 100%)',
    accentColor: '#d4a017',
    textColor: 'white',
    fontFamily: 'Georgia, "Times New Roman", serif',
    pattern:
      'repeating-linear-gradient(45deg, rgba(212,160,23,0.04) 0px, rgba(212,160,23,0.04) 1px, transparent 1px, transparent 12px)',
    borderStyle: 'border-b-4 border-yellow-500/50',
  },
  {
    key: 'emerald',
    name: 'Emerald',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #115e59 50%, #0e7490 100%)',
    accentColor: '#34d399',
    textColor: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    pattern:
      'radial-gradient(ellipse at 0% 100%, rgba(52,211,153,0.08) 0%, transparent 60%)',
  },
  {
    key: 'rose',
    name: 'Rose',
    gradient: 'linear-gradient(150deg, #881337 0%, #be185d 40%, #db2777 100%)',
    accentColor: '#fb7185',
    textColor: 'white',
    fontFamily: 'Georgia, "Palatino Linotype", serif',
    pattern:
      'radial-gradient(circle at 90% 90%, rgba(251,113,133,0.15) 0%, transparent 45%), radial-gradient(circle at 10% 10%, rgba(190,24,93,0.10) 0%, transparent 45%)',
    borderStyle: 'border-b-4 border-pink-300/40',
  },
  {
    key: 'midnight',
    name: 'Midnight',
    gradient: 'linear-gradient(180deg, #0c0a1d 0%, #1e1b4b 40%, #1e3a5f 100%)',
    accentColor: '#93c5fd',
    textColor: 'white',
    fontFamily: 'Georgia, "Times New Roman", serif',
    pattern:
      'radial-gradient(circle at 50% 0%, rgba(147,197,253,0.06) 0%, transparent 60%)',
  },
  {
    key: 'maroon',
    name: 'Maroon',
    gradient: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 45%, #78350f 100%)',
    accentColor: '#fca5a5',
    textColor: 'white',
    fontFamily: 'Georgia, "Palatino Linotype", serif',
    pattern:
      'repeating-linear-gradient(0deg, rgba(252,165,165,0.03) 0px, rgba(252,165,165,0.03) 1px, transparent 1px, transparent 24px)',
    borderStyle: 'border-b-4 border-red-400/30',
  },
  {
    key: 'slate',
    name: 'Slate',
    gradient: 'linear-gradient(160deg, #0f172a 0%, #334155 50%, #475569 100%)',
    accentColor: '#94a3b8',
    textColor: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  {
    key: 'stone',
    name: 'Stone',
    gradient: 'linear-gradient(135deg, #44403c 0%, #78716c 50%, #a8a29e 100%)',
    accentColor: '#d6d3d1',
    textColor: 'white',
    fontFamily: 'Georgia, "Garamond", serif',
    pattern:
      'radial-gradient(circle at 50% 50%, rgba(214,211,209,0.06) 0%, transparent 70%)',
    borderStyle: 'border-b-4 border-stone-300/30',
  },
  {
    key: 'gold',
    name: 'Gold',
    gradient: 'linear-gradient(150deg, #78350f 0%, #a16207 40%, #ca8a04 100%)',
    accentColor: '#fde68a',
    textColor: 'white',
    fontFamily: 'Georgia, "Times New Roman", serif',
    pattern:
      'repeating-linear-gradient(135deg, rgba(253,230,138,0.05) 0px, rgba(253,230,138,0.05) 1px, transparent 1px, transparent 16px)',
    borderStyle: 'border-b-4 border-yellow-300/40',
  },
  {
    key: 'ocean',
    name: 'Ocean',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 45%, #06b6d4 100%)',
    accentColor: '#67e8f9',
    textColor: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    pattern:
      'radial-gradient(ellipse at 30% 100%, rgba(103,232,249,0.10) 0%, transparent 55%)',
  },
  {
    key: 'garden',
    name: 'Garden',
    gradient: 'linear-gradient(150deg, #14532d 0%, #166534 40%, #4d7c0f 100%)',
    accentColor: '#86efac',
    textColor: 'white',
    fontFamily: 'Georgia, "Palatino Linotype", serif',
    pattern:
      'radial-gradient(circle at 80% 80%, rgba(134,239,172,0.10) 0%, transparent 50%), radial-gradient(circle at 20% 30%, rgba(77,124,15,0.08) 0%, transparent 50%)',
    borderStyle: 'border-b-4 border-green-300/30',
  },
  {
    key: 'sunset',
    name: 'Sunset',
    gradient: 'linear-gradient(135deg, #9a3412 0%, #ea580c 40%, #f97316 70%, #fb923c 100%)',
    accentColor: '#fdba74',
    textColor: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    pattern:
      'radial-gradient(circle at 70% 20%, rgba(253,186,116,0.12) 0%, transparent 50%)',
  },
]

const THEMES_MAP: Record<string, InvitationTheme> = Object.fromEntries(
  INVITATION_THEMES.map((t) => [t.key, t]),
)

// ---------------------------------------------------------------------------
// Per-theme decorative config
// ---------------------------------------------------------------------------

type ThemeDecor = {
  ornamentTop: string
  ornamentDivider: string
  titleSize: string
  titleWeight: string
  subtitleSize: string
  overlayOpacity: number
  spacingClass: string
}

const DECOR: Record<string, ThemeDecor> = {
  saffron: {
    ornamentTop: '🪷',
    ornamentDivider: '· · ✦ · ·',
    titleSize: 'text-3xl',
    titleWeight: 'font-bold',
    subtitleSize: 'text-sm',
    overlayOpacity: 0.55,
    spacingClass: 'px-7 py-10',
  },
  royal: {
    ornamentTop: '👑',
    ornamentDivider: '—— ◆ ——',
    titleSize: 'text-3xl',
    titleWeight: 'font-black',
    subtitleSize: 'text-sm',
    overlayOpacity: 0.6,
    spacingClass: 'px-8 py-12',
  },
  emerald: {
    ornamentTop: '',
    ornamentDivider: '━━━',
    titleSize: 'text-2xl',
    titleWeight: 'font-semibold',
    subtitleSize: 'text-sm',
    overlayOpacity: 0.5,
    spacingClass: 'px-6 py-8',
  },
  rose: {
    ornamentTop: '',
    ornamentDivider: '~ ❋ ~',
    titleSize: 'text-3xl',
    titleWeight: 'font-medium',
    subtitleSize: 'text-xs',
    overlayOpacity: 0.5,
    spacingClass: 'px-8 py-10',
  },
  midnight: {
    ornamentTop: '✦',
    ornamentDivider: '· · · ✦ · · ·',
    titleSize: 'text-3xl',
    titleWeight: 'font-bold',
    subtitleSize: 'text-sm',
    overlayOpacity: 0.65,
    spacingClass: 'px-7 py-10',
  },
  maroon: {
    ornamentTop: '',
    ornamentDivider: '── ⁕ ──',
    titleSize: 'text-2xl',
    titleWeight: 'font-bold',
    subtitleSize: 'text-sm',
    overlayOpacity: 0.55,
    spacingClass: 'px-7 py-9',
  },
  slate: {
    ornamentTop: '',
    ornamentDivider: '—',
    titleSize: 'text-2xl',
    titleWeight: 'font-light',
    subtitleSize: 'text-xs',
    overlayOpacity: 0.5,
    spacingClass: 'px-6 py-8',
  },
  stone: {
    ornamentTop: '',
    ornamentDivider: '· ◆ ·',
    titleSize: 'text-2xl',
    titleWeight: 'font-medium',
    subtitleSize: 'text-sm',
    overlayOpacity: 0.45,
    spacingClass: 'px-7 py-9',
  },
  gold: {
    ornamentTop: '⁕',
    ornamentDivider: '— ✦ —',
    titleSize: 'text-3xl',
    titleWeight: 'font-bold',
    subtitleSize: 'text-sm',
    overlayOpacity: 0.55,
    spacingClass: 'px-8 py-11',
  },
  ocean: {
    ornamentTop: '',
    ornamentDivider: '~~~',
    titleSize: 'text-2xl',
    titleWeight: 'font-semibold',
    subtitleSize: 'text-xs',
    overlayOpacity: 0.5,
    spacingClass: 'px-6 py-8',
  },
  garden: {
    ornamentTop: '❋',
    ornamentDivider: '· ❋ ·',
    titleSize: 'text-2xl',
    titleWeight: 'font-medium',
    subtitleSize: 'text-sm',
    overlayOpacity: 0.5,
    spacingClass: 'px-7 py-9',
  },
  sunset: {
    ornamentTop: '',
    ornamentDivider: '///',
    titleSize: 'text-3xl',
    titleWeight: 'font-extrabold',
    subtitleSize: 'text-xs',
    overlayOpacity: 0.45,
    spacingClass: 'px-6 py-8',
  },
}

const DEFAULT_DECOR: ThemeDecor = {
  ornamentTop: '🪷',
  ornamentDivider: '· · ✦ · ·',
  titleSize: 'text-3xl',
  titleWeight: 'font-bold',
  subtitleSize: 'text-sm',
  overlayOpacity: 0.55,
  spacingClass: 'px-7 py-10',
}

// ---------------------------------------------------------------------------
// ThemedInvitationHero
// ---------------------------------------------------------------------------

type ThemedInvitationHeroProps = {
  theme: string
  eventName: string
  eventDate: string
  city: string
  venue: string | null
  message: string | null
  imageUrl: string | null
  householdLabel?: string
}

export function ThemedInvitationHero({
  theme: themeKey,
  eventName,
  eventDate,
  city,
  venue,
  message,
  imageUrl,
  householdLabel,
}: ThemedInvitationHeroProps) {
  const theme = THEMES_MAP[themeKey] ?? THEMES_MAP.saffron!
  const decor = DECOR[theme.key] ?? DEFAULT_DECOR
  const isDark = theme.textColor === 'white'
  const textBase = isDark ? 'text-white' : 'text-gray-900'
  const textMuted = isDark ? 'text-white/70' : 'text-gray-600'

  const formattedDate = (() => {
    try {
      return format(new Date(eventDate), 'EEEE, MMMM d, yyyy')
    } catch {
      return eventDate
    }
  })()

  const locationText = venue ? `${city} · ${venue}` : city

  // ------- image background mode -------
  if (imageUrl) {
    return (
      <div className="relative w-full overflow-hidden" style={{ minHeight: 280 }}>
        <Image
          src={imageUrl}
          alt="Invitation"
          fill
          className="object-cover"
          priority
        />
        {/* themed tint overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: theme.gradient,
            opacity: decor.overlayOpacity,
          }}
        />
        {/* bottom gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div
          className={`relative z-10 flex flex-col justify-end h-full ${decor.spacingClass}`}
          style={{ fontFamily: theme.fontFamily, minHeight: 280 }}
        >
          {decor.ornamentTop && (
            <span className="text-2xl mb-2 block">{decor.ornamentTop}</span>
          )}
          <h1
            className={`${decor.titleSize} ${decor.titleWeight} tracking-tight text-white leading-tight`}
          >
            {eventName}
          </h1>
          <p className="text-white/80 text-sm mt-1.5 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {locationText}
          </p>
          <p className="text-white/70 text-xs mt-1 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            {formattedDate}
          </p>
        </div>
      </div>
    )
  }

  // ------- gradient-only mode -------
  return (
    <div
      className={`relative overflow-hidden ${theme.borderStyle ?? ''}`}
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* main gradient */}
      <div className="absolute inset-0" style={{ background: theme.gradient }} />

      {/* optional pattern overlay */}
      {theme.pattern && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: theme.pattern }}
        />
      )}

      <div className={`relative z-10 ${decor.spacingClass}`}>
        {/* top ornament */}
        {decor.ornamentTop && (
          <span className="text-2xl mb-3 block">{decor.ornamentTop}</span>
        )}

        {/* household greeting */}
        {householdLabel && (
          <p
            className={`${decor.subtitleSize} ${textMuted} uppercase tracking-widest mb-2`}
          >
            You&apos;re invited, {householdLabel}
          </p>
        )}

        {/* event name */}
        <h1
          className={`${decor.titleSize} ${decor.titleWeight} ${textBase} tracking-tight leading-tight`}
        >
          {eventName}
        </h1>

        {/* decorative divider */}
        <p
          className={`${textMuted} text-sm my-3 select-none`}
          style={{ letterSpacing: '0.2em' }}
          aria-hidden
        >
          {decor.ornamentDivider}
        </p>

        {/* date */}
        <p
          className={`${decor.subtitleSize} ${textBase} flex items-center gap-1.5`}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formattedDate}
        </p>

        {/* location */}
        <p
          className={`${decor.subtitleSize} ${textMuted} mt-1 flex items-center gap-1.5`}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {locationText}
        </p>

        {/* invite message */}
        {message && (
          <p
            className={`text-sm ${textMuted} mt-4 italic leading-relaxed`}
            style={{
              borderLeft: `3px solid ${theme.accentColor}`,
              paddingLeft: 12,
            }}
          >
            &ldquo;{message}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}
