# Plan 3: Service Pages — Requirements + Vendor Results

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the per-service page at `/events/[id]/services/[type]`. Each page has a collapsible requirements form at the top and a vendor results section below (OneSeva vendors ranked live + Google Places fallback for business services, or open request panel for individual services).

**Architecture:** One dynamic route handles all service types. ServiceConfig (`service_class`) drives which layout renders. Requirements are stored on `EventRequest.service_notes` (JSON string for non-catering) or `EventMenuPreference` (catering). A pure `rankVendors` utility sorts OneSeva vendors at query time — no background job. "Request Quote" creates `EventRequest` + `Match` records.

**Tech Stack:** Next.js 16 App Router, Prisma 5, TypeScript, Tailwind CSS. Google Places API (existing integration).

**Depends on:** Plan 1 (ServiceConfig seeded, EventRequest fields added), Plan 2 (wizard simplified, dashboard links to these pages).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/matching/rank-vendors.ts` | Create | Pure ranking utility — no DB writes |
| `src/app/api/events/[id]/services/[type]/route.ts` | Create | GET requirements + vendors; POST save requirements |
| `src/app/api/events/[id]/services/[type]/request-quote/route.ts` | Create | POST create EventRequest + Match + notify vendor |
| `src/app/(customer)/events/[id]/services/[type]/page.tsx` | Create | Service page (requirements + vendor results) |

---

### Task 1: Vendor ranking utility

**Files:**
- Create: `src/lib/matching/rank-vendors.ts`

- [ ] **Step 1: Write the file**

```ts
// Pure utility — takes a vendor list + event requirements, returns sorted list.
// No database access. Called from the service page API handler.

export type VendorForRanking = {
  id: string
  business_name: string
  city: string
  vendor_type: string
  avg_rating: number | null
  is_verified: boolean
  menu_packages: Array<{
    is_halal: boolean
    is_jain: boolean
    is_kosher: boolean
    cuisine_tags: string[]
    service_style: string | null
  }>
}

export type RankingRequirements = {
  city?: string
  is_halal?: boolean
  is_jain?: boolean
  is_kosher?: boolean
  cuisines?: string[]
  service_styles?: string[]
}

export type RankedVendor = VendorForRanking & { score: number }

export function rankVendors(
  vendors: VendorForRanking[],
  requirements: RankingRequirements,
): RankedVendor[] {
  return vendors
    .map(v => {
      let score = 0

      // Location: 40 points if same city (case-insensitive)
      if (requirements.city && v.city.toLowerCase() === requirements.city.toLowerCase()) {
        score += 40
      }

      // Requirements fit: 35 points total
      let reqScore = 0
      const pkg = v.menu_packages
      if (requirements.is_halal && pkg.some(p => p.is_halal)) reqScore += 10
      if (requirements.is_jain && pkg.some(p => p.is_jain)) reqScore += 10
      if (requirements.is_kosher && pkg.some(p => p.is_kosher)) reqScore += 10
      if (requirements.cuisines && requirements.cuisines.length > 0) {
        const overlap = requirements.cuisines.filter(c =>
          pkg.some(p => p.cuisine_tags.includes(c))
        ).length
        reqScore += Math.round((overlap / requirements.cuisines.length) * 15)
      }
      score += Math.min(35, reqScore)

      // Rating: 15 points (prorated 0–5 stars)
      if (v.avg_rating !== null) {
        score += Math.round((v.avg_rating / 5) * 15)
      }

      // Verified: 10 points
      if (v.is_verified) score += 10

      return { ...v, score }
    })
    .sort((a, b) => b.score - a.score)
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/matching/rank-vendors.ts
git commit -m "feat: add rankVendors pure utility for live vendor scoring"
```

---

### Task 2: Service API — GET requirements + vendors

**Files:**
- Create: `src/app/api/events/[id]/services/[type]/route.ts`

The `[type]` segment is a service slug like `catering`, `photographer`, `dj`. Map it to `VendorType` enum value via a lookup table.

- [ ] **Step 1: Create the file**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rankVendors } from '@/lib/matching/rank-vendors'

// Map URL slugs to VendorType enum values
const SLUG_TO_TYPE: Record<string, string> = {
  catering: 'CATERER',
  photographer: 'PHOTOGRAPHER',
  videographer: 'VIDEOGRAPHER',
  decorator: 'DECORATOR',
  dj: 'DJ',
  florist: 'FLORIST',
  'mehendi-artist': 'MEHENDI_ARTIST',
  'makeup-hair': 'MAKEUP_HAIR',
  transport: 'TRANSPORT',
  'tent-marquee': 'TENT_MARQUEE',
  'dhol-player': 'DHOL_PLAYER',
  'live-band': 'LIVE_BAND',
  'classical-musician': 'CLASSICAL_MUSICIAN',
  choreographer: 'CHOREOGRAPHER',
  'pandit-officiant': 'PANDIT_OFFICIANT',
  'mc-host': 'MC_HOST',
  bartender: 'BARTENDER',
  'chai-station': 'CHAI_STATION',
  'games-entertainment': 'GAMES_ENTERTAINMENT',
  'invitation-designer': 'INVITATION_DESIGNER',
  'furniture-rental': 'FURNITURE_RENTAL',
  'equipment-rental': 'EQUIPMENT_RENTAL',
}

type Params = { id: string; type: string }

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, type: slug } = await params
  const vendorType = SLUG_TO_TYPE[slug]
  if (!vendorType) return NextResponse.json({ error: 'Unknown service type' }, { status: 404 })

  const customerId = session.user!.id as string

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
    select: { id: true, city: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Load service config
  const serviceConfig = await prisma.serviceConfig.findUnique({
    where: { vendor_type: vendorType },
  })
  if (!serviceConfig || !serviceConfig.is_enabled) {
    return NextResponse.json({ error: 'Service not available' }, { status: 404 })
  }

  // Existing EventRequest (requirements may already be saved)
  const eventRequest = await prisma.eventRequest.findFirst({
    where: { event_id: eventId, vendor_type: vendorType },
    include: {
      menu_preference: true,
      matches: { select: { id: true } },
    },
  })

  // OneSeva vendors for this service type
  const vendors = await prisma.vendor.findMany({
    where: { vendor_type: vendorType, status: 'ACTIVE' },
    include: {
      menu_packages: {
        select: { is_halal: true, is_jain: true, is_kosher: true, cuisine_tags: true, service_style: true },
      },
    },
    select: {
      id: true,
      business_name: true,
      city: true,
      vendor_type: true,
      avg_rating: true,
      is_verified: true,
      profile_photo: true,
      price_per_head_min: true,
      price_per_head_max: true,
      currency: true,
      profile_type: true,
      first_name: true,
      last_name: true,
      menu_packages: true,
    },
  })

  // Build requirements for ranking (from saved EventMenuPreference or service_notes)
  const requirements: Record<string, unknown> = { city: event.city }
  if (eventRequest?.menu_preference) {
    const mp = eventRequest.menu_preference
    requirements.is_halal = mp.is_halal
    requirements.is_jain = mp.is_jain
    requirements.is_kosher = mp.is_kosher
    requirements.cuisines = mp.cuisine_preferences
    requirements.service_styles = mp.service_style ? mp.service_style.split(',') : []
  }

  const ranked = rankVendors(vendors as any, requirements as any)

  return NextResponse.json({
    service_config: serviceConfig,
    event_request: eventRequest
      ? {
          id: eventRequest.id,
          service_notes: eventRequest.service_notes,
          public_token: eventRequest.public_token,
          public_status: eventRequest.public_status,
          menu_preference: eventRequest.menu_preference,
          match_count: eventRequest.matches.length,
        }
      : null,
    vendors: ranked,
  })
}
```

- [ ] **Step 2: Add POST handler for saving requirements**

Append to the same file:

```ts
export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, type: slug } = await params
  const vendorType = SLUG_TO_TYPE[slug]
  if (!vendorType) return NextResponse.json({ error: 'Unknown service type' }, { status: 404 })

  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const body = await req.json()
  // body.service_notes: string (for non-catering)
  // body.catering_prefs: object (for CATERER)

  // Upsert EventRequest
  let eventRequest = await prisma.eventRequest.findFirst({
    where: { event_id: eventId, vendor_type: vendorType },
  })

  if (!eventRequest) {
    eventRequest = await prisma.eventRequest.create({
      data: {
        event_id: eventId,
        customer_id: customerId,
        vendor_type: vendorType,
        status: 'OPEN',
        service_notes: body.service_notes ?? null,
      },
    })
  } else {
    eventRequest = await prisma.eventRequest.update({
      where: { id: eventRequest.id },
      data: { service_notes: body.service_notes ?? null },
    })
  }

  // For CATERER: upsert EventMenuPreference
  if (vendorType === 'CATERER' && body.catering_prefs) {
    const cp = body.catering_prefs
    const prefData = {
      event_id: eventId,
      caterer_request_id: eventRequest.id,
      menu_mode: cp.menu_mode ?? 'CATERER_PROPOSES',
      cuisine_preferences: cp.cuisines ?? [],
      service_style: (cp.service_styles ?? []).join(',') || null,
      special_notes: cp.special_notes ?? null,
      pricing_preference: cp.pricing_preference ?? 'NO_PREFERENCE',
      customer_tray_requests: cp.customer_tray_requests ?? [],
      is_vegetarian: cp.dietary_type === 'vegetarian' || cp.dietary_type === 'vegan',
      is_vegan: cp.dietary_type === 'vegan',
      is_halal: cp.is_halal ?? false,
      is_jain: cp.is_jain ?? false,
      is_kosher: cp.is_kosher ?? false,
      nut_free: cp.nut_free ?? false,
      gluten_free: cp.gluten_free ?? false,
      dairy_free: cp.dairy_free ?? false,
      egg_free: cp.egg_free ?? false,
    }

    const existing = await prisma.eventMenuPreference.findFirst({
      where: { event_id: eventId },
    })
    if (existing) {
      await prisma.eventMenuPreference.update({ where: { id: existing.id }, data: prefData })
    } else {
      await prisma.eventMenuPreference.create({ data: prefData })
    }
  }

  return NextResponse.json({ id: eventRequest.id })
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/events/[id]/services/[type]/route.ts
git commit -m "feat: add GET/POST service requirements API for service pages"
```

---

### Task 3: Request Quote API

**Files:**
- Create: `src/app/api/events/[id]/services/[type]/request-quote/route.ts`

Called when customer clicks "Request Quote" on an OneSeva vendor card. Creates `EventRequest` (if not exists) + `Match` record. This is the billable lead event.

- [ ] **Step 1: Create the file**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SLUG_TO_TYPE: Record<string, string> = {
  catering: 'CATERER',
  photographer: 'PHOTOGRAPHER',
  videographer: 'VIDEOGRAPHER',
  decorator: 'DECORATOR',
  dj: 'DJ',
  florist: 'FLORIST',
  'mehendi-artist': 'MEHENDI_ARTIST',
  'makeup-hair': 'MAKEUP_HAIR',
  transport: 'TRANSPORT',
  'tent-marquee': 'TENT_MARQUEE',
  'dhol-player': 'DHOL_PLAYER',
  'live-band': 'LIVE_BAND',
  'classical-musician': 'CLASSICAL_MUSICIAN',
  choreographer: 'CHOREOGRAPHER',
  'pandit-officiant': 'PANDIT_OFFICIANT',
  'mc-host': 'MC_HOST',
  bartender: 'BARTENDER',
  'chai-station': 'CHAI_STATION',
  'games-entertainment': 'GAMES_ENTERTAINMENT',
  'invitation-designer': 'INVITATION_DESIGNER',
  'furniture-rental': 'FURNITURE_RENTAL',
  'equipment-rental': 'EQUIPMENT_RENTAL',
}

const bodySchema = z.object({
  vendor_id: z.string(),
})

type Params = { id: string; type: string }

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, type: slug } = await params
  const vendorType = SLUG_TO_TYPE[slug]
  if (!vendorType) return NextResponse.json({ error: 'Unknown service type' }, { status: 404 })

  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: parsed.data.vendor_id },
    select: { id: true, vendor_type: true },
  })
  if (!vendor || vendor.vendor_type !== vendorType) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  // Upsert EventRequest
  let eventRequest = await prisma.eventRequest.findFirst({
    where: { event_id: eventId, vendor_type: vendorType },
  })
  if (!eventRequest) {
    eventRequest = await prisma.eventRequest.create({
      data: {
        event_id: eventId,
        customer_id: customerId,
        vendor_type: vendorType,
        status: 'OPEN',
      },
    })
  }

  // Upsert Match (avoid duplicate leads for same vendor)
  const existingMatch = await prisma.match.findFirst({
    where: { event_request_id: eventRequest.id, vendor_id: vendor.id },
  })
  if (!existingMatch) {
    await prisma.match.create({
      data: {
        event_request_id: eventRequest.id,
        vendor_id: vendor.id,
        vendor_type: vendorType,
        score: 0,
        rank: 1,
        status: 'PENDING',
      },
    })
  }

  return NextResponse.json({ event_request_id: eventRequest.id })
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/events/[id]/services/[type]/request-quote/route.ts
git commit -m "feat: add request-quote API — creates EventRequest + Match lead record"
```

---

### Task 4: Service page UI

**Files:**
- Create: `src/app/(customer)/events/[id]/services/[type]/page.tsx`

This is the main per-service page. It:
1. Fetches service config, saved requirements, and ranked vendors from the GET API.
2. Renders a collapsible requirements form (catering uses the existing Step4CateringPrefs fields; other services show a generic notes textarea plus service-specific questions).
3. Below the form: OneSeva vendor cards (with "Request Quote" button) + Google Places section (for BUSINESS services) OR open request board panel (for INDIVIDUAL services).

**Note:** This is a client component — it fetches data client-side so the form is interactive without a full page reload.

- [ ] **Step 1: Create the page file**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronDown, ChevronUp, Star, Phone, ExternalLink } from 'lucide-react'

type ServiceConfig = {
  vendor_type: string; label: string; icon: string; service_class: string; is_enabled: boolean
}

type EventRequest = {
  id: string; service_notes: string | null; public_token: string; public_status: string
  menu_preference: Record<string, unknown> | null; match_count: number
}

type Vendor = {
  id: string; business_name: string; city: string; profile_type: string
  first_name: string | null; last_name: string | null; profile_photo: string | null
  avg_rating: number | null; is_verified: boolean; score: number
  price_per_head_min: number | null; price_per_head_max: number | null; currency: string
}

type PageData = {
  service_config: ServiceConfig
  event_request: EventRequest | null
  vendors: Vendor[]
}

// Generic notes form for non-catering service types
function GenericRequirementsForm({
  initialNotes,
  onSave,
  saving,
}: { initialNotes: string; onSave: (notes: string) => void; saving: boolean }) {
  const [notes, setNotes] = useState(initialNotes)
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Requirements / special notes
      </label>
      <textarea
        className="w-full border rounded-xl p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Describe what you need…"
      />
      <Button
        onClick={() => onSave(notes)}
        disabled={saving}
        className="bg-orange-600 hover:bg-orange-700"
      >
        {saving ? 'Saving…' : 'Save requirements'}
      </Button>
    </div>
  )
}

function VendorCard({
  vendor,
  onRequestQuote,
  requesting,
}: { vendor: Vendor; onRequestQuote: (vendorId: string) => void; requesting: boolean }) {
  const displayName = vendor.profile_type === 'INDIVIDUAL' && vendor.first_name
    ? `${vendor.first_name}${vendor.last_name ? ` ${vendor.last_name}` : ''}`
    : vendor.business_name

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4 items-start">
      {vendor.profile_photo ? (
        <img src={vendor.profile_photo} alt={displayName} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-2xl">
          🏢
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900 text-sm">{displayName}</p>
            <p className="text-xs text-gray-500">{vendor.city}</p>
          </div>
          {vendor.is_verified && (
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium flex-shrink-0">
              Verified
            </span>
          )}
        </div>
        {vendor.avg_rating !== null && (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-medium text-gray-700">{vendor.avg_rating.toFixed(1)}</span>
          </div>
        )}
        {(vendor.price_per_head_min || vendor.price_per_head_max) && (
          <p className="text-xs text-gray-500 mt-1">
            {vendor.currency}{' '}
            {vendor.price_per_head_min && vendor.price_per_head_max
              ? `${vendor.price_per_head_min}–${vendor.price_per_head_max} / head`
              : vendor.price_per_head_min
              ? `from ${vendor.price_per_head_min} / head`
              : `up to ${vendor.price_per_head_max} / head`}
          </p>
        )}
      </div>
      <Button
        size="sm"
        onClick={() => onRequestQuote(vendor.id)}
        disabled={requesting}
        className="bg-orange-600 hover:bg-orange-700 text-xs flex-shrink-0"
      >
        Request Quote
      </Button>
    </div>
  )
}

export default function ServicePage() {
  const { id: eventId, type: slug } = useParams<{ id: string; type: string }>()
  const router = useRouter()
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch(`/api/events/${eventId}/services/${slug}`)
    if (!res.ok) { setLoading(false); return }
    const json = await res.json()
    setData(json)
    // Collapse form if requirements already saved
    if (json.event_request) setFormOpen(false)
    setLoading(false)
  }

  useEffect(() => { load() }, [eventId, slug])

  async function saveRequirements(notes: string) {
    setSaving(true)
    await fetch(`/api/events/${eventId}/services/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_notes: notes }),
    })
    setSaving(false)
    await load()
  }

  async function requestQuote(vendorId: string) {
    setRequesting(true)
    setError('')
    const res = await fetch(`/api/events/${eventId}/services/${slug}/request-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: vendorId }),
    })
    if (res.ok) {
      router.push(`/events/${eventId}/quotes`)
    } else {
      setError('Failed to send quote request. Please try again.')
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-48" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-gray-500">Service not found or not enabled.</p>
        <Link href={`/events/${eventId}`} className="text-orange-600 text-sm hover:underline mt-2 block">
          ← Back to event
        </Link>
      </div>
    )
  }

  const { service_config: svc, event_request: req, vendors } = data
  const isIndividual = svc.service_class === 'INDIVIDUAL'

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link href={`/events/${eventId}`} className="hover:text-orange-600 transition-colors">
          Event
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 font-medium">
          {svc.icon} {svc.label}
        </span>
      </div>

      {/* Requirements panel */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => setFormOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">Your requirements</span>
            {req && (
              <span className="h-2 w-2 rounded-full bg-green-500" />
            )}
          </div>
          {formOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>

        {formOpen && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <div className="pt-4">
              <GenericRequirementsForm
                initialNotes={req?.service_notes ?? ''}
                onSave={saveRequirements}
                saving={saving}
              />
            </div>
          </div>
        )}

        {!formOpen && req?.service_notes && (
          <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
            {req.service_notes}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* OneSeva vendors */}
      {vendors.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">
            {isIndividual ? `${svc.label} professionals on OneSeva` : `${svc.label} vendors on OneSeva`}
          </h2>
          <div className="space-y-3">
            {vendors.map(v => (
              <VendorCard
                key={v.id}
                vendor={v}
                onRequestQuote={requestQuote}
                requesting={requesting}
              />
            ))}
          </div>
        </div>
      )}

      {/* Open request board panel — shown for ALL service types once requirements are saved */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-amber-900">Your request is public</p>
          {req && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              req.public_status === 'FILLED'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {req.public_status === 'FILLED' ? 'Filled' : 'Open'}
            </span>
          )}
        </div>
        <p className="text-sm text-amber-800">
          {req
            ? 'Anyone — vendors, freelancers, or your own contacts — can find this and respond. You\'ll be notified when someone replies.'
            : 'Save your requirements above. Your request will be posted publicly so vendors in your area can find and respond to it.'}
        </p>
        {req && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <a
              href={`/requests/${slug}/${req.public_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-orange-600 hover:underline"
            >
              View public page <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-xs text-amber-700">· Share the link to get responses faster</span>
          </div>
        )}
      </div>

      {/* Google Places — business services only */}
      {!isIndividual && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="font-semibold text-gray-700 mb-1">Other local businesses</p>
          <p className="text-sm text-gray-500">
            Local businesses not yet on OneSeva will appear here. Call them directly to enquire.
          </p>
          <p className="text-xs text-gray-400 mt-2 italic">Google Places integration — coming soon</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(customer)/events/[id]/services/[type]/page.tsx
git commit -m "feat: add per-service page with requirements form and vendor results"
```
