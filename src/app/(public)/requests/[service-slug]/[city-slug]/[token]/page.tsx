import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  CalendarDays,
  MapPin,
  Users,
  Wallet,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { ResponseForm } from './ResponseForm'

type Params = {
  'service-slug': string
  'city-slug': string
  token: string
}

const SERVICE_LABELS: Record<string, string> = {
  CATERER: 'Catering',
  PHOTOGRAPHER: 'Photography',
  VIDEOGRAPHER: 'Videography',
  DECORATOR: 'Decoration',
  DJ: 'DJ',
  FLORIST: 'Florist',
  MEHENDI_ARTIST: 'Mehendi Artist',
  MAKEUP_HAIR: 'Makeup & Hair',
  DHOL_PLAYER: 'Dhol Player',
  LIVE_BAND: 'Live Band',
  CHOREOGRAPHER: 'Choreographer',
  PANDIT_OFFICIANT: 'Pandit / Officiant',
  MC_HOST: 'MC / Host',
  BARTENDER: 'Bartender',
  CHAI_STATION: 'Chai Station',
  GAMES_ENTERTAINMENT: 'Games & Entertainment',
  INVITATION_DESIGNER: 'Invitation Designer',
  CLASSICAL_MUSICIAN: 'Classical Musician',
  TRANSPORT: 'Transport',
  TENT_MARQUEE: 'Tent / Marquee',
  FURNITURE_RENTAL: 'Furniture Rental',
  EQUIPMENT_RENTAL: 'Equipment Rental',
}

const EVENT_LABELS: Record<string, string> = {
  WEDDING: 'Wedding',
  BIRTHDAY_PARTY: 'Birthday Party',
  ENGAGEMENT: 'Engagement',
  ANNIVERSARY: 'Anniversary',
  BABY_SHOWER: 'Baby Shower',
  CORPORATE: 'Corporate Event',
  RELIGIOUS_CEREMONY: 'Religious Ceremony',
  GRADUATION: 'Graduation',
  NAMING_CEREMONY: 'Naming Ceremony',
  MEHNDI: 'Mehndi Night',
  SANGEET: 'Sangeet',
  RECEPTION: 'Reception',
  FAREWELL: 'Farewell',
  REUNION: 'Reunion',
  OTHER: 'Event',
}

const DIETARY_LABELS: Array<{
  key: string
  label: string
  color: string
}> = [
  { key: 'is_halal', label: 'Halal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'is_vegetarian', label: 'Vegetarian', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'is_vegan', label: 'Vegan', color: 'bg-lime-50 text-lime-700 border-lime-200' },
  { key: 'is_jain', label: 'Jain', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'is_kosher', label: 'Kosher', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'nut_free', label: 'Nut-free', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'gluten_free', label: 'Gluten-free', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { key: 'dairy_free', label: 'Dairy-free', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { key: 'egg_free', label: 'Egg-free', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'shellfish_free', label: 'Shellfish-free', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'soy_free', label: 'Soy-free', color: 'bg-violet-50 text-violet-700 border-violet-200' },
]

type MenuPreference = {
  cuisine_preferences: string[] | null
  service_style: string | null
  special_notes: string | null
  is_vegetarian: boolean
  is_vegan: boolean
  is_jain: boolean
  is_halal: boolean
  is_kosher: boolean
  nut_free: boolean
  gluten_free: boolean
  dairy_free: boolean
  egg_free?: boolean
  shellfish_free?: boolean
  soy_free?: boolean
  [key: string]: unknown
}

type RequestData = {
  id: string
  vendor_type: string
  public_status: string
  service_notes: string | null
  response_count: number
  event: {
    event_type: string
    fuzzy_date: string
    city: string
    guest_count: number
    budget_band: string
  }
  menu_preference: MenuPreference | null
}

async function fetchRequest(token: string): Promise<RequestData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'
  const res = await fetch(`${baseUrl}/api/requests/${token}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json() as Promise<RequestData>
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { token, 'service-slug': serviceSlug, 'city-slug': citySlug } = await params
  const data = await fetchRequest(token)
  if (!data) return { title: 'Request not found — OneSeva' }
  const service = SERVICE_LABELS[data.vendor_type] ?? serviceSlug
  const city = data.event.city ?? citySlug.replace(/-/g, ' ')
  const eventLabel = EVENT_LABELS[data.event.event_type] ?? data.event.event_type.replace(/_/g, ' ')
  return {
    title: `${service} needed in ${city} — OneSeva`,
    description: `${eventLabel} · ${data.event.guest_count} guests · ${data.event.fuzzy_date} · ${data.event.budget_band} budget`,
    openGraph: {
      title: `${service} needed in ${city}`,
      description: `${eventLabel} for ${data.event.guest_count} guests in ${data.event.fuzzy_date}. Budget: ${data.event.budget_band}.`,
      siteName: 'OneSeva',
    },
  }
}

export default async function PublicRequestPage({ params }: { params: Promise<Params> }) {
  const { token, 'service-slug': serviceSlug, 'city-slug': citySlug } = await params
  const data = await fetchRequest(token)
  if (!data) notFound()

  const service = SERVICE_LABELS[data.vendor_type] ?? serviceSlug.replace(/-/g, ' ')
  const city = data.event.city ?? citySlug.replace(/-/g, ' ')
  const eventLabel = EVENT_LABELS[data.event.event_type] ?? data.event.event_type.replace(/_/g, ' ')
  const isFilled = data.public_status === 'FILLED'

  const activeDietaryTags = data.menu_preference
    ? DIETARY_LABELS.filter((d) => data.menu_preference![d.key] === true)
    : []

  return (
    <div className="space-y-6">
      {/* ── Hero Card ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 px-6 pt-8 pb-10 md:px-10 md:pt-10 md:pb-12">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

          <div className="relative">
            {/* Status badge */}
            <div className="inline-flex items-center mb-4">
              {isFilled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white ring-1 ring-white/30">
                  <XCircle className="w-3.5 h-3.5" />
                  Responses closed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white ring-1 ring-white/30">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Accepting responses
                </span>
              )}
            </div>

            {/* Main heading */}
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2">
              {service} needed
            </h1>
            <p className="text-white/75 text-base font-medium">
              {eventLabel} in {city}
            </p>
          </div>
        </div>

        {/* White stats strip */}
        <div className="bg-white border-x border-b border-gray-100 px-6 py-5 md:px-10 md:py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              icon={<CalendarDays className="w-4 h-4 text-orange-500" />}
              label="Date"
              value={data.event.fuzzy_date}
            />
            <StatCard
              icon={<MapPin className="w-4 h-4 text-orange-500" />}
              label="Location"
              value={city}
            />
            <StatCard
              icon={<Users className="w-4 h-4 text-orange-500" />}
              label="Guests"
              value={data.event.guest_count.toLocaleString()}
            />
            <StatCard
              icon={<Wallet className="w-4 h-4 text-orange-500" />}
              label="Budget"
              value={data.event.budget_band}
            />
            <StatCard
              icon={<Clock className="w-4 h-4 text-orange-500" />}
              label="Responses"
              value={`${String(data.response_count)} so far`}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </div>

      {/* ── Body: 2 column on md+ ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left: details */}
        <div className="md:col-span-3 space-y-5">
          {/* Service notes */}
          {data.service_notes && (
            <DetailSection title="Additional notes from the host">
              <p className="text-gray-700 leading-relaxed text-sm">{data.service_notes}</p>
            </DetailSection>
          )}

          {/* Menu preferences (caterer-focused) */}
          {data.menu_preference && (
            <DetailSection title="Menu preferences">
              <div className="space-y-4">
                {/* Cuisine chips */}
                {data.menu_preference.cuisine_preferences && data.menu_preference.cuisine_preferences.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Cuisines</p>
                    <div className="flex flex-wrap gap-2">
                      {data.menu_preference.cuisine_preferences.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100"
                        >
                          <UtensilsCrossed className="w-3 h-3" />
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service style */}
                {data.menu_preference.service_style && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Service style</p>
                    <p className="text-sm text-gray-700">{data.menu_preference.service_style}</p>
                  </div>
                )}

                {/* Dietary tags */}
                {activeDietaryTags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Dietary requirements</p>
                    <div className="flex flex-wrap gap-2">
                      {activeDietaryTags.map((d) => (
                        <span
                          key={d.key}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${d.color}`}
                        >
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special notes */}
                {data.menu_preference.special_notes && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Special notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{data.menu_preference.special_notes}</p>
                  </div>
                )}
              </div>
            </DetailSection>
          )}

          {/* CTA section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 md:p-7">
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #f97316 0%, transparent 60%)' }}
            />
            <div className="relative flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/30 shrink-0">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-white font-bold text-base mb-1">
                  Are you a {service} provider in {city}?
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Join OneSeva free and get matched directly with event hosts looking for your services — no commission, no gatekeepers.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 transition-colors text-white font-semibold text-sm px-4 py-2.5 rounded-xl"
                >
                  Join OneSeva free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right: response form */}
        <div className="md:col-span-2">
          {isFilled ? (
            <FilledBanner serviceName={service} city={city} />
          ) : (
            <ResponseForm token={token} serviceName={service} city={city} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  className = '',
}: {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {icon}
        {label}
      </div>
      <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  )
}

function FilledBanner({ serviceName, city }: { serviceName: string; city: string }) {
  return (
    <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-lg">
      <div className="h-1.5 w-full bg-gradient-to-r from-gray-300 to-gray-400" />
      <div className="p-6 md:p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 ring-8 ring-gray-50">
            <XCircle className="w-7 h-7 text-gray-400" />
          </div>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">Responses are closed</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          The event host has found their {serviceName} provider and is no longer accepting new responses.
        </p>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-900 mb-1">Never miss a lead</p>
              <p className="text-xs text-orange-700 leading-relaxed">
                Join OneSeva to get notified when new {serviceName} requests in {city} go live.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Create your free profile <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
