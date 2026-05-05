# Plan 4: Public Open Request Board

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public request board. Any `EventRequest` with `public_status = OPEN` gets a public page at `/requests/[service-slug]/[city-slug]/[token]`. Visitors can see sanitised event details and submit a response (no account required). Host sees responses on their service page and can accept/mark as filled.

**Architecture:** Two new page routes (public request page + response submitted confirmation). Two new API routes (GET public data, POST response). Response submission creates a `RequestResponse` record — no auth required for POST. Host actions (accept, mark filled) add PATCH endpoints to the same request token API. Vendor leads feed gets a new section showing open requests matching their vendor type + city.

**Tech Stack:** Next.js 16 App Router, Prisma 5, TypeScript, Tailwind CSS.

**Depends on:** Plan 1 (RequestResponse model, EventRequest.public_token added), Plan 3 (EventRequest created when customer saves requirements).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/api/requests/[token]/route.ts` | Create | GET public request data; POST submit response; PATCH accept/fill |
| `src/app/(public)/requests/[service-slug]/[city-slug]/[token]/page.tsx` | Create | Public request page (no auth) |
| `src/app/(public)/layout.tsx` | Create | Minimal layout for public pages (no customer sidebar) |
| `src/app/(customer)/events/[id]/services/[type]/responses/page.tsx` | Create | Host responses review page |
| `src/app/api/events/[id]/services/[type]/responses/route.ts` | Create | GET responses for host |

---

### Task 1: Public request API

**Files:**
- Create: `src/app/api/requests/[token]/route.ts`

Three handlers on the same route:
- `GET`: Returns sanitised public data (no customer PII) by looking up `EventRequest.public_token`.
- `POST`: Accepts a response form submission. Creates `RequestResponse`. No auth required.
- `PATCH`: Host actions — `action: "accept"` (update response status) or `action: "fill"` (set `EventRequest.public_status = FILLED`). Requires customer auth.

- [ ] **Step 1: Create the file**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type Params = { token: string }

// Budget range helper — turns exact budget into a display band
function budgetBand(amount: number, currency: string): string {
  const bands = [500, 1000, 2000, 5000, 10000, 20000]
  for (let i = 0; i < bands.length - 1; i++) {
    if (amount < bands[i + 1]) return `${currency}${bands[i].toLocaleString()}–${bands[i + 1].toLocaleString()}`
  }
  return `${currency}${bands[bands.length - 1].toLocaleString()}+`
}

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { token } = await params

  const eventRequest = await prisma.eventRequest.findUnique({
    where: { public_token: token },
    include: {
      event: {
        select: {
          event_type: true,
          event_date: true,
          city: true,
          guest_count: true,
          total_budget: true,
          currency: true,
        },
      },
      menu_preference: {
        select: {
          cuisine_preferences: true,
          service_style: true,
          special_notes: true,
          is_vegetarian: true,
          is_vegan: true,
          is_halal: true,
        },
      },
      _count: { select: { responses: true } },
    },
  })

  if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { event } = eventRequest
  // Fuzzy date: return month + year only
  const eventDate = new Date(event.event_date)
  const fuzzyDate = eventDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  return NextResponse.json({
    id: eventRequest.id,
    vendor_type: eventRequest.vendor_type,
    public_status: eventRequest.public_status,
    service_notes: eventRequest.service_notes,
    response_count: eventRequest._count.responses,
    event: {
      event_type: event.event_type,
      fuzzy_date: fuzzyDate,
      city: event.city,
      guest_count: event.guest_count,
      budget_band: budgetBand(Number(event.total_budget), event.currency),
    },
    menu_preference: eventRequest.menu_preference,
  })
}

const responseSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  pitch: z.string().min(10).max(500),
  price_note: z.string().max(200).optional(),
  portfolio_url: z.string().url().optional().or(z.literal('')),
})

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { token } = await params

  const eventRequest = await prisma.eventRequest.findUnique({
    where: { public_token: token },
    select: { id: true, public_status: true },
  })
  if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (eventRequest.public_status === 'FILLED') {
    return NextResponse.json({ error: 'This request has already been filled' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = responseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  // Check if this phone number already responded (basic dedup)
  if (parsed.data.phone) {
    const existing = await prisma.requestResponse.findFirst({
      where: { event_request_id: eventRequest.id, phone: parsed.data.phone },
    })
    if (existing) {
      return NextResponse.json({ error: 'You have already responded to this request' }, { status: 409 })
    }
  }

  // If the submitter is a logged-in vendor, attach their vendor_id
  const session = await auth()
  let vendorId: string | null = null
  if (session && (session.user as any).role === 'vendor') {
    const vendor = await prisma.vendor.findFirst({
      where: { user_id: session.user!.id as string },
      select: { id: true },
    })
    vendorId = vendor?.id ?? null
  }

  const response = await prisma.requestResponse.create({
    data: {
      event_request_id: eventRequest.id,
      vendor_id: vendorId,
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      pitch: parsed.data.pitch,
      price_note: parsed.data.price_note ?? null,
      portfolio_url: parsed.data.portfolio_url || null,
    },
  })

  return NextResponse.json({ id: response.id }, { status: 201 })
}

const patchSchema = z.object({
  action: z.enum(['accept', 'fill', 'decline_response']),
  response_id: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await params
  const customerId = session.user!.id as string

  const eventRequest = await prisma.eventRequest.findUnique({
    where: { public_token: token },
    select: { id: true, customer_id: true, public_status: true },
  })
  if (!eventRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (eventRequest.customer_id !== customerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  if (parsed.data.action === 'fill') {
    await prisma.eventRequest.update({
      where: { id: eventRequest.id },
      data: { public_status: 'FILLED' },
    })
    return NextResponse.json({ ok: true })
  }

  if (parsed.data.action === 'accept' && parsed.data.response_id) {
    await prisma.requestResponse.update({
      where: { id: parsed.data.response_id },
      data: { status: 'ACCEPTED' },
    })
    return NextResponse.json({ ok: true })
  }

  if (parsed.data.action === 'decline_response' && parsed.data.response_id) {
    await prisma.requestResponse.update({
      where: { id: parsed.data.response_id },
      data: { status: 'DECLINED' },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/requests/[token]/route.ts
git commit -m "feat: add public request API — GET public data, POST response, PATCH host actions"
```

---

### Task 2: Public layout

**Files:**
- Create: `src/app/(public)/layout.tsx`

A minimal layout with no customer sidebar. Used by the public request page and public vendor pages (Plan 5).

- [ ] **Step 1: Create the file**

```tsx
import type { ReactNode } from 'react'
import Link from 'next/link'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-black text-orange-600 text-lg">
            OneSeva
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="/register" className="bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 font-medium">
              Join free
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(public)/layout.tsx
git commit -m "feat: add minimal public layout for public-facing pages"
```

---

### Task 3: Public request page

**Files:**
- Create: `src/app/(public)/requests/[service-slug]/[city-slug]/[token]/page.tsx`

Server component — fetches data from the public API and renders the request details + response form. The response form is a client island.

- [ ] **Step 1: Create the response form client component**

Create `src/app/(public)/requests/[service-slug]/[city-slug]/[token]/ResponseForm.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Props = { token: string }

export function ResponseForm({ token }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pitch, setPitch] = useState('')
  const [priceNote, setPriceNote] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/requests/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, pitch, price_note: priceNote, portfolio_url: portfolioUrl }),
    })
    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-bold text-green-900">Response sent!</p>
        <p className="text-sm text-green-700 mt-1">
          The host will review your response and contact you if interested.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-gray-900">I can help with this</h3>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your name *</label>
        <input
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / phone</label>
        <input
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+44 7700 000000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tell them about yourself *</label>
        <textarea
          className="w-full border rounded-xl px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={pitch}
          onChange={e => setPitch(e.target.value)}
          placeholder="2–3 sentences about your experience and why you're a great fit…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rough price / rate</label>
        <input
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={priceNote}
          onChange={e => setPriceNote(e.target.value)}
          placeholder="e.g. £500 for the day, or £30/head"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram / website / portfolio link</label>
        <input
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={portfolioUrl}
          onChange={e => setPortfolioUrl(e.target.value)}
          placeholder="https://"
        />
      </div>

      <Button
        onClick={submit}
        disabled={submitting || !name || !pitch}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {submitting ? 'Sending…' : 'Send my response'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Create the page**

Create `src/app/(public)/requests/[service-slug]/[city-slug]/[token]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ResponseForm } from './ResponseForm'

type Params = { 'service-slug': string; 'city-slug': string; token: string }

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

async function fetchRequest(token: string) {
  // Called server-side: use absolute URL via env
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'
  const res = await fetch(`${baseUrl}/api/requests/${token}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { token, 'service-slug': serviceSlug, 'city-slug': citySlug } = await params
  const data = await fetchRequest(token)
  if (!data) return { title: 'Request not found' }
  const service = SERVICE_LABELS[data.vendor_type] ?? serviceSlug
  const city = data.event.city ?? citySlug
  return {
    title: `${service} needed in ${city} — OneSeva`,
    description: `${data.event.event_type.replace(/_/g, ' ')} · ${data.event.guest_count} guests · ${data.event.fuzzy_date} · ${data.event.budget_band} budget`,
  }
}

export default async function PublicRequestPage({ params }: { params: Promise<Params> }) {
  const { token, 'service-slug': serviceSlug, 'city-slug': citySlug } = await params
  const data = await fetchRequest(token)
  if (!data) notFound()

  const service = SERVICE_LABELS[data.vendor_type] ?? serviceSlug
  const isFilled = data.public_status === 'FILLED'

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {isFilled && (
        <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 text-center">
          <p className="font-bold text-gray-600">This request has been filled</p>
          <p className="text-sm text-gray-500 mt-1">The host has found what they needed.</p>
        </div>
      )}

      {/* Request card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="bg-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-white">{service} needed</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              isFilled ? 'bg-gray-200 text-gray-600' : 'bg-green-400 text-green-900'
            }`}>
              {isFilled ? 'Filled' : 'Open'}
            </span>
          </div>
          <p className="text-orange-100 text-sm mt-1">{data.event.city}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Event type', value: data.event.event_type.replace(/_/g, ' ') },
              { label: 'When', value: data.event.fuzzy_date },
              { label: 'Guests', value: data.event.guest_count.toLocaleString() },
              { label: 'Budget', value: data.event.budget_band },
            ].map((item: { label: string; value: string }) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800 capitalize">{item.value}</p>
              </div>
            ))}
          </div>

          {data.service_notes && (
            <div>
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Requirements</p>
              <p className="text-sm text-gray-700">{data.service_notes}</p>
            </div>
          )}

          {data.menu_preference && (
            <div>
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Catering preferences</p>
              <div className="flex flex-wrap gap-1.5">
                {data.menu_preference.cuisine_preferences?.map((c: string) => (
                  <span key={c} className="bg-orange-50 text-orange-800 text-xs border border-orange-200 rounded-full px-2.5 py-0.5">
                    {c}
                  </span>
                ))}
                {data.menu_preference.is_halal && (
                  <span className="bg-green-50 text-green-700 text-xs border border-green-200 rounded-full px-2.5 py-0.5">Halal</span>
                )}
                {data.menu_preference.is_vegetarian && (
                  <span className="bg-green-50 text-green-700 text-xs border border-green-200 rounded-full px-2.5 py-0.5">Vegetarian</span>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400">
            {data.response_count} {data.response_count === 1 ? 'response' : 'responses'} received
          </p>
        </div>
      </div>

      {/* Response form — only shown if request is open */}
      {!isFilled && <ResponseForm token={token} />}

      {/* Not on OneSeva CTA */}
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">Are you a {service.toLowerCase()} in {data.event.city}?</p>
        <a href="/register?role=vendor" className="text-orange-600 text-sm font-semibold hover:underline">
          Join OneSeva free to get more leads →
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(public)/requests/ src/app/(public)/layout.tsx
git commit -m "feat: add public request page with response form and SEO metadata"
```

---

### Task 4: Host responses review API + page

**Files:**
- Create: `src/app/api/events/[id]/services/[type]/responses/route.ts`
- Create: `src/app/(customer)/events/[id]/services/[type]/responses/page.tsx`

Host can see who responded to their public request, accept/decline responses, and mark the request as filled.

- [ ] **Step 1: Create the responses API**

```ts
// src/app/api/events/[id]/services/[type]/responses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SLUG_TO_TYPE: Record<string, string> = {
  catering: 'CATERER', photographer: 'PHOTOGRAPHER', videographer: 'VIDEOGRAPHER',
  decorator: 'DECORATOR', dj: 'DJ', florist: 'FLORIST',
  'mehendi-artist': 'MEHENDI_ARTIST', 'makeup-hair': 'MAKEUP_HAIR',
  transport: 'TRANSPORT', 'tent-marquee': 'TENT_MARQUEE', 'dhol-player': 'DHOL_PLAYER',
  'live-band': 'LIVE_BAND', 'classical-musician': 'CLASSICAL_MUSICIAN',
  choreographer: 'CHOREOGRAPHER', 'pandit-officiant': 'PANDIT_OFFICIANT',
  'mc-host': 'MC_HOST', bartender: 'BARTENDER', 'chai-station': 'CHAI_STATION',
  'games-entertainment': 'GAMES_ENTERTAINMENT', 'invitation-designer': 'INVITATION_DESIGNER',
  'furniture-rental': 'FURNITURE_RENTAL', 'equipment-rental': 'EQUIPMENT_RENTAL',
}

type Params = { id: string; type: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId, type: slug } = await params
  const vendorType = SLUG_TO_TYPE[slug]
  if (!vendorType) return NextResponse.json({ error: 'Unknown service type' }, { status: 404 })

  const customerId = session.user!.id as string

  const eventRequest = await prisma.eventRequest.findFirst({
    where: { event_id: eventId, vendor_type: vendorType, customer_id: customerId },
    include: {
      responses: {
        orderBy: { created_at: 'desc' },
        include: {
          vendor: { select: { business_name: true, profile_photo: true, profile_type: true, first_name: true, last_name: true } },
        },
      },
    },
  })

  if (!eventRequest) return NextResponse.json({ error: 'No request found' }, { status: 404 })

  return NextResponse.json({
    public_token: eventRequest.public_token,
    public_status: eventRequest.public_status,
    responses: eventRequest.responses,
  })
}
```

- [ ] **Step 2: Create the host responses page**

```tsx
// src/app/(customer)/events/[id]/services/[type]/responses/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight, ExternalLink } from 'lucide-react'

type Response = {
  id: string; name: string; phone: string | null; pitch: string
  price_note: string | null; portfolio_url: string | null
  status: string; created_at: string
  vendor: { business_name: string; profile_photo: string | null; profile_type: string; first_name: string | null; last_name: string | null } | null
}

type PageData = {
  public_token: string; public_status: string; responses: Response[]
}

export default function ResponsesPage() {
  const { id: eventId, type: slug } = useParams<{ id: string; type: string }>()
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  async function load() {
    const res = await fetch(`/api/events/${eventId}/services/${slug}/responses`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [eventId, slug])

  async function doAction(action: string, responseId?: string) {
    setActing(responseId ?? action)
    await fetch(`/api/requests/${data!.public_token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, response_id: responseId }),
    })
    setActing(null)
    await load()
  }

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading…</div>
  if (!data) return <div className="p-6 text-gray-500">No responses yet.</div>

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link href={`/events/${eventId}`} className="hover:text-orange-600">Event</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}/services/${slug}`} className="hover:text-orange-600 capitalize">
          {slug.replace(/-/g, ' ')}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-700 font-medium">Responses</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-gray-900">
          {data.responses.length} {data.responses.length === 1 ? 'response' : 'responses'}
        </h1>
        {data.public_status === 'OPEN' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => doAction('fill')}
            disabled={acting === 'fill'}
          >
            {acting === 'fill' ? 'Marking…' : 'Mark as filled'}
          </Button>
        )}
        {data.public_status === 'FILLED' && (
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1 font-medium">
            Filled
          </span>
        )}
      </div>

      <div className="space-y-4">
        {data.responses.map(r => {
          const displayName = r.vendor
            ? (r.vendor.profile_type === 'INDIVIDUAL' && r.vendor.first_name
                ? `${r.vendor.first_name}${r.vendor.last_name ? ` ${r.vendor.last_name}` : ''}`
                : r.vendor.business_name)
            : r.name

          return (
            <div key={r.id} className={`bg-white border rounded-2xl p-5 space-y-3 ${
              r.status === 'ACCEPTED' ? 'border-green-300' : 'border-gray-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">{displayName}</p>
                  {r.phone && r.status === 'ACCEPTED' && (
                    <p className="text-sm text-gray-600 mt-0.5">{r.phone}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  r.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' :
                  r.status === 'DECLINED' ? 'bg-gray-100 text-gray-500' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-gray-700">{r.pitch}</p>
              {r.price_note && (
                <p className="text-sm text-orange-700 font-medium">{r.price_note}</p>
              )}
              {r.portfolio_url && (
                <a
                  href={r.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-orange-600 hover:underline"
                >
                  View portfolio <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {r.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => doAction('accept', r.id)}
                    disabled={!!acting}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {acting === r.id ? 'Accepting…' : 'Accept'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => doAction('decline_response', r.id)}
                    disabled={!!acting}
                  >
                    Decline
                  </Button>
                </div>
              )}
              {r.status === 'ACCEPTED' && !r.vendor && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                  💡 {r.name} isn't on OneSeva yet. Share this link so they can create a profile and manage bookings:{' '}
                  <a href="/register?role=vendor" className="underline">oneseva.com/register</a>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/events/[id]/services/[type]/responses/route.ts
git add src/app/(customer)/events/[id]/services/[type]/responses/page.tsx
git commit -m "feat: add host responses review page and API for open request board"
```
