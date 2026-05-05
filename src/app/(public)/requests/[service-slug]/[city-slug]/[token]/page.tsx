import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
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
  ChevronRight,
  MessageSquare,
  Shield,
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

function getEventLabel(raw: string): string {
  return EVENT_LABELS[raw] ?? EVENT_LABELS[raw.toUpperCase()] ?? raw.replace(/_/g, ' ')
}

const CUISINE_LABEL_MAP: Record<string, string> = {
  'north-indian': 'North Indian',
  'south-indian': 'South Indian',
  'punjabi': 'Punjabi',
  'gujarati': 'Gujarati',
  'bengali': 'Bengali',
  'rajasthani': 'Rajasthani',
  'mughlai': 'Mughlai',
  'indo-chinese': 'Indo-Chinese',
  'continental': 'Continental',
  'mediterranean': 'Mediterranean',
  'street-food': 'Street Food',
}

const DIETARY_LABELS: Array<{
  key: string
  label: string
  color: string
}> = [
  { key: 'is_halal', label: 'Halal', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'is_vegetarian', label: 'Vegetarian', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'is_vegan', label: 'Vegan', color: 'bg-lime-50 text-lime-700 border-lime-200' },
  { key: 'is_jain', label: 'Jain', color: 'bg-brand/10 text-brand border-brand/20' },
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
  protein_preference: string | null
  special_notes: string | null
  selected_dishes: unknown | null
  customer_tray_requests: unknown | null
  menu_mode: string | null
  appetizer_count: number | null
  main_count: number | null
  bread_count: number | null
  rice_biryani_count: number | null
  dessert_count: number | null
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
  delivery_required?: boolean
  setup_required?: boolean
  serving_staff_required?: boolean
  equipment_required?: boolean
  labels_required?: boolean
  updated_at?: string
  change_summary?: string | null
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
    state: string | null
    country: string
    guest_count: number
    budget_band: string
  }
  menu_preference: MenuPreference | null
  request_created_at: string
  dish_category_map: Record<string, string>
}

function budgetBand(amount: number, currency: string): string {
  const sym = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency
  const bands = [500, 1000, 2000, 5000, 10000, 20000]
  if (amount < bands[0]) return `${sym}${bands[0].toLocaleString()} or under`
  for (let i = 0; i < bands.length - 1; i++) {
    if (amount < bands[i + 1]) return `${sym}${bands[i].toLocaleString()}–${sym}${bands[i + 1].toLocaleString()}`
  }
  return `${sym}${bands[bands.length - 1].toLocaleString()}+`
}

const MENU_CATEGORY_ORDER: { key: string; label: string; emoji: string }[] = [
  { key: 'SOUP_SALAD',   label: 'Soups & Salads',  emoji: '🥣' },
  { key: 'APPETIZER',    label: 'Starters',          emoji: '🥗' },
  { key: 'MAIN_COURSE',  label: 'Mains',             emoji: '🍛' },
  { key: 'BREAD',        label: 'Breads',            emoji: '🫓' },
  { key: 'RICE_BIRYANI', label: 'Rice & Biryani',    emoji: '🍚' },
  { key: 'DAL',          label: 'Dal & Lentils',     emoji: '🫕' },
  { key: 'DESSERT',      label: 'Desserts',           emoji: '🍮' },
  { key: 'LIVE_COUNTER', label: 'Live Counters',      emoji: '🔥' },
  { key: 'BEVERAGE',     label: 'Beverages',          emoji: '🥤' },
  { key: 'OTHER',        label: 'Other',              emoji: '🍽️' },
]

async function fetchRequest(token: string): Promise<RequestData | null> {
  const eventRequest = await prisma.eventRequest.findUnique({
    where: { public_token: token },
    include: {
      event: {
        select: {
          event_type: true, event_date: true, city: true, state: true, country: true,
          guest_count: true, total_budget: true, currency: true,
        },
      },
      menu_preference: {
        select: {
          cuisine_preferences: true, service_style: true, protein_preference: true, special_notes: true,
          selected_dishes: true, custom_dish_categories: true, customer_tray_requests: true, menu_mode: true,
          appetizer_count: true, main_count: true, bread_count: true, rice_biryani_count: true, dessert_count: true,
          is_vegetarian: true, is_vegan: true, is_jain: true, is_halal: true,
          is_kosher: true, nut_free: true, gluten_free: true, dairy_free: true,
          egg_free: true, shellfish_free: true, soy_free: true,
          delivery_required: true, setup_required: true,
          serving_staff_required: true, equipment_required: true, labels_required: true,
          updated_at: true, change_summary: true,
        },
      },
      _count: { select: { responses: true } },
    },
  })
  if (!eventRequest) return null

  const libraryDishes = await prisma.menuItem.findMany({
    where: { is_global: true, is_active: true },
    select: { name: true, category: true },
  })
  const dish_category_map: Record<string, string> = {}
  for (const d of libraryDishes) {
    dish_category_map[d.name.toLowerCase()] = d.category as string
  }
  const customDishCats = (eventRequest.menu_preference as any)?.custom_dish_categories
  if (customDishCats && typeof customDishCats === 'object') {
    for (const [name, catKey] of Object.entries(customDishCats)) {
      if (typeof catKey === 'string') {
        dish_category_map[name.toLowerCase()] = catKey
      }
    }
  }

  const { event } = eventRequest
  const eventDate = new Date(event.event_date)
  const fuzzyDate = eventDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
  return {
    id: eventRequest.id,
    vendor_type: eventRequest.vendor_type,
    public_status: eventRequest.public_status,
    service_notes: eventRequest.service_notes,
    response_count: eventRequest._count.responses,
    request_created_at: eventRequest.created_at.toISOString(),
    event: {
      event_type: event.event_type,
      fuzzy_date: fuzzyDate,
      city: event.city,
      state: event.state ?? null,
      country: event.country,
      guest_count: event.guest_count,
      budget_band: budgetBand(Number(event.total_budget), event.currency),
    },
    menu_preference: eventRequest.menu_preference as MenuPreference | null,
    dish_category_map,
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { token, 'service-slug': serviceSlug, 'city-slug': citySlug } = await params
  const data = await fetchRequest(token)
  if (!data) return { title: 'Request not found — OneSeva' }
  const service = SERVICE_LABELS[data.vendor_type] ?? serviceSlug
  const city = data.event.city ?? citySlug.replace(/-/g, ' ')
  const eventLabel = getEventLabel(data.event.event_type)
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

  const [data, session] = await Promise.all([
    fetchRequest(token),
    auth(),
  ])
  if (!data) notFound()

  let vendorInfo: { name: string; businessName: string; phone: string | null; emailVerified: boolean; phoneVerified: boolean } | null = null
  if (session?.user && (session.user as any).role === 'vendor') {
    const v = await prisma.vendor.findUnique({
      where: { id: session.user.id as string },
      select: { first_name: true, last_name: true, business_name: true, phone_business: true, email_verified: true, phone_verified: true },
    })
    if (v) {
      vendorInfo = {
        name: [v.first_name, v.last_name].filter(Boolean).join(' ') || v.business_name,
        businessName: v.business_name,
        phone: v.phone_business,
        emailVerified: v.email_verified,
        phoneVerified: v.phone_verified,
      }
    }
  }

  const service = SERVICE_LABELS[data.vendor_type] ?? serviceSlug.replace(/-/g, ' ')
  const city = data.event.city ?? citySlug.replace(/-/g, ' ')
  const locationDisplay = [city, data.event.state].filter(Boolean).join(', ')
  const eventLabel = getEventLabel(data.event.event_type)
  const isFilled = data.public_status === 'FILLED'

  const activeDietaryTags = data.menu_preference
    ? DIETARY_LABELS.filter((d) => data.menu_preference![d.key] === true)
    : []

  const postedAgo = timeAgo(data.request_created_at)

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href="/" className="hover:text-brand transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/board" className="hover:text-brand transition-colors">Open requests</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-text-2 font-medium truncate max-w-[250px]">{service} in {city}</span>
      </nav>

      {/* ── Hero Card ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl shadow-lg border border-brand-border">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#1a0904] to-[#3d1f10] px-6 pt-8 pb-10 md:px-10 md:pt-10 md:pb-12">
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #e85510 0%, transparent 60%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              {isFilled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 ring-1 ring-white/20">
                  <XCircle className="w-3.5 h-3.5" /> Responses closed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 ring-1 ring-green-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Accepting responses
                </span>
              )}
              <span className="text-xs text-white/40">Posted {postedAgo}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2">
              {service} needed
            </h1>
            <p className="text-white/60 text-base font-medium">
              {eventLabel} · {locationDisplay}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="bg-white dark:bg-cream-2 px-6 py-5 md:px-10 md:py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={<CalendarDays className="w-4 h-4 text-text-4" />} label="Date"     value={data.event.fuzzy_date} />
            <StatCard icon={<MapPin      className="w-4 h-4 text-text-4" />} label="Location" value={locationDisplay} />
            <StatCard icon={<Users       className="w-4 h-4 text-text-4" />} label="Guests"   value={data.event.guest_count.toLocaleString()} />
            <StatCard icon={<Wallet      className="w-4 h-4 text-text-4" />} label="Budget"   value={data.event.budget_band} />
            <StatCard
              icon={<MessageSquare className="w-4 h-4 text-text-4" />}
              label="Responses"
              value={data.response_count > 0 ? `${data.response_count} so far` : 'Be the first!'}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

        {/* Left: request details */}
        <div className="md:col-span-3 space-y-4">

          {data.menu_preference ? (
            <CateringDetails
              eventLabel={eventLabel}
              city={locationDisplay}
              guestCount={data.event.guest_count}
              budgetBand={data.event.budget_band}
              fuzzyDate={data.event.fuzzy_date}
              menuPreference={data.menu_preference}
              activeDietaryTags={activeDietaryTags}
              requestCreatedAt={data.request_created_at}
              dishCategoryMap={data.dish_category_map}
            />
          ) : data.service_notes ? (
            <ServiceRequirements
              serviceNotes={data.service_notes}
              eventLabel={eventLabel}
              city={locationDisplay}
              guestCount={data.event.guest_count}
              budgetBand={data.event.budget_band}
              fuzzyDate={data.event.fuzzy_date}
              serviceName={service}
            />
          ) : null}

          {data.menu_preference?.special_notes && (
            <DetailSection title="Additional comments from customer">
              <p className="text-sm text-text-2 leading-relaxed">{data.menu_preference.special_notes}</p>
            </DetailSection>
          )}

          {/* Trust signals */}
          <DetailSection title="Why respond on OneSeva?">
            <div className="flex flex-col gap-3">
              {[
                { icon: <Shield className="w-4 h-4 text-brand" />, title: 'Verified requests only', desc: 'Every request comes from a verified event host with a confirmed email and event date.' },
                { icon: <MessageSquare className="w-4 h-4 text-brand" />, title: 'Direct connection', desc: 'No middlemen — the host sees your response and contacts you directly if interested.' },
                { icon: <CheckCircle className="w-4 h-4 text-brand" />, title: 'Always free', desc: 'No commission, no subscription, no hidden fees. OneSeva is free for vendors.' },
              ].map(s => (
                <div key={s.title} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand/8 flex items-center justify-center shrink-0 mt-0.5">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-1">{s.title}</p>
                    <p className="text-xs text-text-3 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </DetailSection>

          {/* How it works */}
          <DetailSection title="How to respond">
            <div className="flex flex-col gap-4">
              {[
                { step: '1', title: 'Create your free vendor account', desc: 'Takes 2 minutes — just your name, business type, and phone.' },
                { step: '2', title: 'Submit your response', desc: 'Write your pitch and pricing. The host sees it anonymously at first.' },
                { step: '3', title: 'Get connected', desc: "If the host likes your response, they'll reach out directly — no middlemen." },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-cream-2 text-text-2 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-1">{s.title}</p>
                    <p className="text-xs text-text-3 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </DetailSection>
        </div>

        {/* Right: response form + what to include */}
        <div className="md:col-span-2">
          <div className="md:sticky md:top-6 space-y-4">
            {isFilled ? (
              <FilledBanner serviceName={service} city={city} />
            ) : (
              <ResponseForm token={token} serviceName={service} city={city} vendor={vendorInfo} />
            )}

            {/* What to include */}
            <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-text-1 uppercase tracking-wide mb-4">What to include</h2>
              <ul className="space-y-3">
                {[
                  { icon: '🏆', text: "Relevant experience — similar events, team size, years in business" },
                  { icon: '💰', text: 'A rough pricing indication — even a range helps' },
                  { icon: '📅', text: `Confirm availability for ${data.event.fuzzy_date} in ${city}` },
                  { icon: '🔗', text: 'Portfolio link, Instagram, or website' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-2">
                    <span className="text-base leading-5 shrink-0">{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Browse more ────────────────────────────────────────── */}
      <div className="bg-cream border border-brand-border rounded-2xl p-8 text-center mt-4">
        <h2 className="text-lg font-black text-text-1 mb-1.5">Browse more open requests</h2>
        <p className="text-sm text-text-3 mb-5 max-w-md mx-auto">
          New requests are posted daily. Find events that match your service area and expertise.
        </p>
        <Link
          href="/board"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          View all open requests <ArrowRight className="w-4 h-4" />
        </Link>
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
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-4">
        {icon}
        {label}
      </div>
      <p className="text-sm font-bold text-text-1 truncate">{value}</p>
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
    <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 md:p-6">
      <h2 className="text-sm font-bold text-text-1 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric' })
}

function CateringDetails({
  eventLabel,
  city,
  guestCount,
  budgetBand,
  fuzzyDate,
  menuPreference,
  activeDietaryTags,
  requestCreatedAt,
  dishCategoryMap,
}: {
  eventLabel: string
  city: string
  guestCount: number
  budgetBand: string
  fuzzyDate: string
  menuPreference: MenuPreference
  activeDietaryTags: typeof DIETARY_LABELS
  requestCreatedAt: string
  dishCategoryMap: Record<string, string>
}) {
  const cuisines = menuPreference.cuisine_preferences ?? []
  const styleRaw = menuPreference.service_style

  // Map raw service style slugs to labels
  const SERVICE_STYLE_LABEL_MAP: Record<string, string> = {
    'buffet': 'Buffet',
    'sit-down': 'Sit-down / Plated',
    'live-stations': 'Live Cooking Stations',
    'cocktail': 'Cocktail / Canapés',
    'family-style': 'Family Style',
    'grazing-table': 'Grazing Table',
  }
  const styleValues = styleRaw ? styleRaw.split(',').filter(Boolean) : []
  const styleLabels = styleValues.map(s => SERVICE_STYLE_LABEL_MAP[s.trim()] ?? s.trim())
  const styleText = styleLabels.length > 0 ? styleLabels.join(', ') : null

  // Map protein preference
  const PROTEIN_DETAIL_MAP: Record<string, { label: string; emoji: string; desc: string }> = {
    'veg-only': { label: 'Vegetarian Only', emoji: '🌿', desc: 'No meat, poultry, or seafood — pure vegetarian menu required' },
    'non-veg': { label: 'Non-Vegetarian', emoji: '🍗', desc: 'Menu should include meat, poultry, and/or seafood dishes' },
    'mixed': { label: 'Mixed Menu', emoji: '🍽️', desc: 'Include both vegetarian and non-vegetarian items — cater to all guests' },
    'eggetarian': { label: 'Eggetarian', emoji: '🥚', desc: 'Vegetarian menu with eggs — no meat, poultry, or seafood' },
  }
  const proteinInfo = menuPreference.protein_preference
    ? PROTEIN_DETAIL_MAP[menuPreference.protein_preference] ?? { label: menuPreference.protein_preference, emoji: '🍽️', desc: '' }
    : null
  const proteinLabel = proteinInfo?.label ?? null

  // Live station labels
  const LIVE_STATION_LABEL_MAP: Record<string, string> = {
    'chai': 'Chai & Coffee',
    'dosa': 'Dosa Station',
    'pav-bhaji': 'Pav Bhaji',
    'chaat': 'Chaat Station',
    'grill-bbq': 'Grill / BBQ',
    'pasta': 'Pasta / Noodle',
    'ice-cream': 'Ice Cream / Kulfi',
    'soup': 'Soup / Dal',
    'biryani': 'Live Biryani',
    'jalebi': 'Jalebi / Sweets',
  }

  const cuisineLabels = cuisines.map(c => CUISINE_LABEL_MAP[c] ?? c)
  const cuisineText =
    cuisineLabels.length === 1
      ? cuisineLabels[0]
      : cuisineLabels.length === 2
      ? `${cuisineLabels[0]} and ${cuisineLabels[1]}`
      : cuisineLabels.length > 2
      ? `${cuisineLabels.slice(0, -1).join(', ')}, and ${cuisineLabels[cuisineLabels.length - 1]}`
      : null

  const dietaryNames = activeDietaryTags.map(d => d.label)
  const dietaryText =
    dietaryNames.length === 1
      ? dietaryNames[0]
      : dietaryNames.length === 2
      ? `${dietaryNames[0]} and ${dietaryNames[1]}`
      : dietaryNames.length > 2
      ? `${dietaryNames.slice(0, -1).join(', ')}, and ${dietaryNames[dietaryNames.length - 1]}`
      : null

  const updatedAt = menuPreference.updated_at ? new Date(menuPreference.updated_at) : null
  const createdAt = new Date(requestCreatedAt)
  const wasUpdated = updatedAt && (updatedAt.getTime() - createdAt.getTime()) > 5 * 60 * 1000

  return (
    <DetailSection title="What they're looking for">
      <div className="space-y-5">
        {/* Update notice */}
        {wasUpdated && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
            <span className="text-amber-500 mt-0.5">⚠</span>
            <div>
              <p className="text-xs font-semibold text-amber-800">
                Requirements updated {timeAgo(menuPreference.updated_at!)}
              </p>
              {menuPreference.change_summary && (
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">{menuPreference.change_summary}</p>
              )}
            </div>
          </div>
        )}

        {/* Narrative write-up */}
        <p className="text-sm text-text-2 leading-relaxed">
          The host is planning {/^[aeiou]/i.test(eventLabel) ? 'an' : 'a'} <strong className="text-text-1">{eventLabel.toLowerCase()}</strong> in{' '}
          <strong className="text-text-1">{city}</strong> for <strong className="text-text-1">{guestCount.toLocaleString()} guests</strong> in{' '}
          <strong className="text-text-1">{fuzzyDate}</strong>.
          {styleText && (
            <> Preferred service style: <strong className="text-text-1">{styleText}</strong>.</>
          )}
          {cuisineText && (
            <> They&apos;re looking for <strong className="text-text-1">{cuisineText} cuisine</strong>.</>
          )}
          {proteinLabel && (
            <> Menu preference: <strong className="text-text-1">{proteinLabel}</strong>.</>
          )}
          {dietaryText && (
            <> All food must be suitable for <strong className="text-text-1">{dietaryText}</strong> requirements.</>
          )}
        </p>

        {/* Service style */}
        {styleValues.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Service style</p>
            <div className="flex flex-wrap gap-2">
              {styleLabels.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
                  🍽️ {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Live stations */}
        {(() => {
          const stations = (menuPreference.customer_tray_requests as string[] | null) ?? []
          if (stations.length === 0) return null
          return (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Live stations</p>
              <div className="flex flex-wrap gap-2">
                {stations.map(s => (
                  <span key={s} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    🔥 {LIVE_STATION_LABEL_MAP[s] ?? s}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Cuisine */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Cuisines</p>
          {cuisines.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cuisines.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20">
                  <UtensilsCrossed className="w-3 h-3" />{CUISINE_LABEL_MAP[c] ?? c}
                </span>
              ))}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cream text-text-3 border border-brand-border italic">
              Open to caterer&apos;s suggestion
            </span>
          )}
        </div>

        {/* Protein preference */}
        {proteinInfo && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Protein preference</p>
            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
              <span className="text-lg leading-5 shrink-0">{proteinInfo.emoji}</span>
              <div>
                <p className="text-sm font-bold text-emerald-800">{proteinInfo.label}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{proteinInfo.desc}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dietary tags */}
        {activeDietaryTags.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Dietary restrictions</p>
            <div className="flex flex-wrap gap-2">
              {activeDietaryTags.map((d) => (
                <span key={d.key} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${d.color}`}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Course counts — shown regardless of menu mode */}
        {(() => {
          const counts: string[] = []
          if (menuPreference.appetizer_count)    counts.push(`${menuPreference.appetizer_count} starter${menuPreference.appetizer_count !== 1 ? 's' : ''}`)
          if (menuPreference.main_count)         counts.push(`${menuPreference.main_count} main${menuPreference.main_count !== 1 ? 's' : ''}`)
          if (menuPreference.bread_count)        counts.push(`${menuPreference.bread_count} bread`)
          if (menuPreference.rice_biryani_count) counts.push(`${menuPreference.rice_biryani_count} rice/biryani`)
          if (menuPreference.dessert_count)      counts.push(`${menuPreference.dessert_count} dessert${menuPreference.dessert_count !== 1 ? 's' : ''}`)
          if (counts.length === 0) return null
          return (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Course counts</p>
              <div className="flex flex-wrap gap-2">
                {counts.map(c => (
                  <span key={c} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Menu / dishes */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Menu &amp; dishes</p>
          {menuPreference.menu_mode !== 'CUSTOMER_SPECIFIED' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cream text-text-3 border border-brand-border italic">
              Caterer to propose suitable menu
            </span>
          ) : (
            <div className="space-y-3">
              {/* Specific dishes — grouped by category */}
              {(() => {
                const dishes = (menuPreference.selected_dishes as string[] | null) ?? []
                if (dishes.length === 0) return null

                const grouped: Record<string, string[]> = {}
                for (const dish of dishes) {
                  const catKey = dishCategoryMap[dish.toLowerCase()] ?? 'OTHER'
                  if (!grouped[catKey]) grouped[catKey] = []
                  grouped[catKey].push(dish)
                }

                const sections = MENU_CATEGORY_ORDER.filter(c => grouped[c.key])

                return (
                  <div className="space-y-3">
                    {sections.map(cat => (
                      <div key={cat.key}>
                        <p className="text-xs font-semibold text-text-3 mb-1.5">
                          {cat.emoji} {cat.label}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {grouped[cat.key].map(d => (
                            <span key={d} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-cream text-text-2 border border-brand-border">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-text-4 italic">These are suggested dishes — the caterer can propose alternatives or additions.</p>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Logistics */}
        {(() => {
          const mp = menuPreference
          const logistics: { emoji: string; label: string }[] = [
            ...(mp.delivery_required       ? [{ emoji: '🚚', label: 'Delivery to venue' }]        : []),
            ...(mp.setup_required          ? [{ emoji: '🪑', label: 'Setup & arrangement' }]       : []),
            ...(mp.serving_staff_required  ? [{ emoji: '🧑‍🍳', label: 'Serving staff' }]             : []),
            ...(mp.equipment_required      ? [{ emoji: '🔥', label: 'Buffet equipment' }]          : []),
            ...(mp.labels_required         ? [{ emoji: '🏷️', label: 'Dish labels & menu cards' }] : []),
          ]
          if (logistics.length === 0) return null
          return (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Caterer must provide</p>
              <div className="flex flex-wrap gap-2">
                {logistics.map(({ emoji, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    <span>{emoji}</span>{label}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}
      </div>
    </DetailSection>
  )
}

// ── Service Requirements (non-catering) ─────────────────────────────────────

// Maps structured "Key: Value · Key: Value" service_notes into visual sections
const SECTION_STYLES: Record<string, { emoji: string; color: string }> = {
  'Style':        { emoji: '🎨', color: 'bg-brand/10 text-brand border-brand/20' },
  'Venue':        { emoji: '🏛️', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Areas':        { emoji: '📍', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Elements':     { emoji: '✨', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Color theme':  { emoji: '🎨', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  'Coverage':     { emoji: '📸', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Deliverables': { emoji: '📦', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Music':        { emoji: '🎵', color: 'bg-brand/10 text-brand border-brand/20' },
  'Equipment':    { emoji: '🔊', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Segments':     { emoji: '🎤', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Languages':    { emoji: '🌐', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Services':     { emoji: '💼', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Ceremony':     { emoji: '🕉️', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Needs':        { emoji: '📋', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Type':         { emoji: '📋', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Items':        { emoji: '📝', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Vehicles':     { emoji: '🚗', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Purpose':      { emoji: '🎯', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Quantity':     { emoji: '📊', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Bridal coverage': { emoji: '💍', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  'Guest designs': { emoji: '👥', color: 'bg-blue-50 text-blue-700 border-blue-200' },
}

function ServiceRequirements({
  serviceNotes,
  eventLabel,
  city,
  guestCount,
  budgetBand,
  fuzzyDate,
  serviceName,
}: {
  serviceNotes: string
  eventLabel: string
  city: string
  guestCount: number
  budgetBand: string
  fuzzyDate: string
  serviceName: string
}) {
  // Parse "Key: Value · Key: Value · free text" format
  const segments = serviceNotes.split(' · ').map(s => s.trim()).filter(Boolean)

  const structured: { key: string; values: string[] }[] = []
  const freeText: string[] = []
  const standalone: string[] = []

  for (const seg of segments) {
    const colonIdx = seg.indexOf(': ')
    if (colonIdx > 0 && colonIdx < 25) {
      const key = seg.slice(0, colonIdx)
      const val = seg.slice(colonIdx + 2)
      structured.push({ key, values: val.split(', ').map(v => v.trim()) })
    } else if (/^\d+ /.test(seg) || /needed$/i.test(seg) || /required$/i.test(seg) || /session/i.test(seg)) {
      standalone.push(seg)
    } else {
      freeText.push(seg)
    }
  }

  return (
    <DetailSection title="What they're looking for">
      <div className="space-y-5">
        {/* Narrative */}
        <p className="text-sm text-text-2 leading-relaxed">
          The host is planning {/^[aeiou]/i.test(eventLabel) ? 'an' : 'a'} <strong className="text-text-1">{eventLabel.toLowerCase()}</strong> in{' '}
          <strong className="text-text-1">{city}</strong> for <strong className="text-text-1">{guestCount.toLocaleString()} guests</strong> in{' '}
          <strong className="text-text-1">{fuzzyDate}</strong> and needs{' '}
          <strong className="text-text-1">{serviceName.toLowerCase()}</strong> services.
        </p>

        {/* Structured sections */}
        {structured.map(({ key, values }) => {
          const style = SECTION_STYLES[key] ?? { emoji: '📋', color: 'bg-cream text-text-2 border-brand-border' }
          return (
            <div key={key}>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">{key}</p>
              <div className="flex flex-wrap gap-2">
                {values.map(v => (
                  <span key={v} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.color}`}>
                    {style.emoji} {v}
                  </span>
                ))}
              </div>
            </div>
          )
        })}

        {/* Standalone items (durations, toggles) */}
        {standalone.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Details</p>
            <div className="flex flex-wrap gap-2">
              {standalone.map(s => (
                <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✅ {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Free text notes */}
        {freeText.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-4 mb-2">Additional notes</p>
            <p className="text-sm text-text-2 leading-relaxed bg-cream rounded-xl px-4 py-3">
              {freeText.join(' · ')}
            </p>
          </div>
        )}
      </div>
    </DetailSection>
  )
}

function FilledBanner({ serviceName, city }: { serviceName: string; city: string }) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-cream-2 border border-brand-border rounded-2xl">
      <div className="h-1.5 w-full bg-gradient-to-r from-text-4 to-text-3" />
      <div className="p-6 md:p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-cream ring-8 ring-cream">
            <XCircle className="w-7 h-7 text-text-4" />
          </div>
        </div>
        <h3 className="text-base font-bold text-text-1 mb-2">Responses are closed</h3>
        <p className="text-text-3 text-sm leading-relaxed mb-6">
          The event host has found their {serviceName} provider and is no longer accepting new responses.
        </p>
        <div className="bg-brand/5 border border-brand/15 rounded-xl p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand/10 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-1 mb-1">Never miss a lead</p>
              <p className="text-xs text-text-3 leading-relaxed">
                Join OneSeva to get notified when new {serviceName} requests in {city} go live.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-brand hover:text-brand-hover transition-colors"
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
