# Plan 6: Unified Quotes & Magic Link Quote Flow

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the customer quotes page as a unified view of all OneSeva vendor quotes AND public board responses, grouped by service type. Add a magic link flow so customers can ask any public board responder to submit a structured quote (no account required).

**Architecture:** The existing `/events/[id]/quotes` page currently only shows `Quote` records from OneSeva vendors. It needs to also fetch `RequestResponse` records for the same event and render them in the same grouped table. A new public page `/quote-request/[token]` lets responders fill a lightweight structured quote form without registering. `RequestResponse` gets new fields for the quote data.

**Tech Stack:** Next.js 16 App Router, Prisma 5, TypeScript, Tailwind CSS.

**Depends on:** Plan 1 (RequestResponse model exists), Plan 4 (public board responses exist and can be submitted).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add quote fields + email to RequestResponse |
| `src/app/api/quote-request/[token]/route.ts` | Create | GET prefill data; POST save structured quote |
| `src/app/(public)/quote-request/[token]/page.tsx` | Create | Lightweight quote form (no auth) |
| `src/app/(customer)/events/[id]/quotes/page.tsx` | Rewrite | Unified table grouped by service type |
| `src/app/api/requests/[token]/route.ts` | Modify | Add `request_full_quote` action to PATCH handler |

---

### Task 1: Extend RequestResponse schema

**Files:**
- Modify: `prisma/schema.prisma`

Add quote-related fields to `RequestResponse` model.

- [ ] **Step 1: Add fields to RequestResponse in schema.prisma**

Find the `RequestResponse` model and add after the `portfolio_url` field:

```prisma
  email              String?
  quote_token        String?      @unique @default(cuid())
  quoted_price       Decimal?
  price_unit         String?
  what_includes      String?
  service_details    String?
  availability_note  String?
  quote_submitted_at DateTime?
```

- [ ] **Step 2: Push schema**

```bash
cd /home/hareesh/projects/bhoj && npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add quote fields to RequestResponse for magic link quote flow"
```

---

### Task 2: Quote request API (magic link)

**Files:**
- Create: `src/app/api/quote-request/[token]/route.ts`

`GET` returns the event context the responder needs to see (service type, city, guest count, budget band, requirements) — no PII. `POST` saves the structured quote fields back to the `RequestResponse`.

- [ ] **Step 1: Create the file**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

type Params = { token: string }

function budgetBand(amount: number, currency: string): string {
  const bands = [500, 1000, 2000, 5000, 10000, 20000]
  for (let i = 0; i < bands.length - 1; i++) {
    if (amount < bands[i + 1]) return `${currency}${bands[i].toLocaleString()}–${bands[i + 1].toLocaleString()}`
  }
  return `${currency}${bands[bands.length - 1].toLocaleString()}+`
}

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { token } = await params

  const response = await prisma.requestResponse.findUnique({
    where: { quote_token: token },
    include: {
      event_request: {
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
            select: { cuisine_preferences: true, service_style: true, special_notes: true },
          },
        },
      },
    },
  })

  if (!response) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (response.quote_submitted_at) {
    return NextResponse.json({ error: 'Quote already submitted' }, { status: 409 })
  }

  const er = response.event_request
  const event = er.event
  const eventDate = new Date(event.event_date)
  const fuzzyDate = eventDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  return NextResponse.json({
    responder_name: response.name,
    vendor_type: er.vendor_type,
    service_notes: er.service_notes,
    menu_preference: er.menu_preference,
    event: {
      event_type: event.event_type,
      fuzzy_date: fuzzyDate,
      city: event.city,
      guest_count: event.guest_count,
      budget_band: budgetBand(Number(event.total_budget), event.currency),
      currency: event.currency,
    },
  })
}

const postSchema = z.object({
  quoted_price: z.number().positive(),
  price_unit: z.enum(['per_head', 'per_event', 'per_hour', 'per_day']),
  what_includes: z.string().min(5).max(1000),
  service_details: z.string().max(1000).optional(),
  availability_note: z.enum(['available', 'need_to_confirm', 'not_available']),
  extra_notes: z.string().max(500).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { token } = await params

  const response = await prisma.requestResponse.findUnique({
    where: { quote_token: token },
    select: { id: true, quote_submitted_at: true },
  })

  if (!response) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (response.quote_submitted_at) {
    return NextResponse.json({ error: 'Quote already submitted' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { quoted_price, price_unit, what_includes, service_details, availability_note, extra_notes } = parsed.data

  await prisma.requestResponse.update({
    where: { id: response.id },
    data: {
      quoted_price,
      price_unit,
      what_includes,
      service_details: service_details ?? null,
      availability_note,
      status: 'QUOTE_SUBMITTED',
      quote_submitted_at: new Date(),
      // Append extra notes to what_includes if provided
      ...(extra_notes ? { what_includes: `${what_includes}\n\n${extra_notes}` } : {}),
    },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/quote-request/[token]/route.ts
git commit -m "feat: add magic link quote request API — GET context, POST structured quote"
```

---

### Task 3: Add "request_full_quote" action to public request API

**Files:**
- Modify: `src/app/api/requests/[token]/route.ts`

Add a new PATCH action `request_full_quote` that takes a `response_id`, updates `RequestResponse.status` to `QUOTE_REQUESTED`, and (in production) would send the magic link via email + WhatsApp. For now it returns the `quote_token` so the caller can construct the link.

- [ ] **Step 1: Extend the patchSchema and handler**

Find the `patchSchema` in `src/app/api/requests/[token]/route.ts` and update:

```ts
const patchSchema = z.object({
  action: z.enum(['accept', 'fill', 'decline_response', 'request_full_quote']),
  response_id: z.string().optional(),
})
```

Then in the `PATCH` handler, after the `decline_response` block, add:

```ts
  if (parsed.data.action === 'request_full_quote' && parsed.data.response_id) {
    const updated = await prisma.requestResponse.update({
      where: { id: parsed.data.response_id },
      data: { status: 'QUOTE_REQUESTED' },
      select: { quote_token: true, name: true, phone: true, email: true },
    })

    // TODO: send magic link via email + WhatsApp in production
    // Magic link URL: /quote-request/[updated.quote_token]
    // For now: return the token so the UI can show the link
    console.log(`[magic-link] Send to ${updated.name}: /quote-request/${updated.quote_token}`)

    return NextResponse.json({ quote_token: updated.quote_token })
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
git commit -m "feat: add request_full_quote PATCH action — sets QUOTE_REQUESTED status, returns magic link token"
```

---

### Task 4: Lightweight quote form page

**Files:**
- Create: `src/app/(public)/quote-request/[token]/page.tsx`

Client component. Fetches event context on load (GET). Customer/respondent fills in price, what's included, service details, availability. On submit calls POST. No login required. Shows join nudge on success.

- [ ] **Step 1: Create the file**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type EventContext = {
  responder_name: string
  vendor_type: string
  service_notes: string | null
  event: {
    event_type: string
    fuzzy_date: string
    city: string
    guest_count: number
    budget_band: string
    currency: string
  }
}

const PRICE_UNITS = [
  { value: 'per_head', label: 'Per person / head' },
  { value: 'per_event', label: 'Per event (flat fee)' },
  { value: 'per_hour', label: 'Per hour' },
  { value: 'per_day', label: 'Per day' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: "✅ I'm available on this date" },
  { value: 'need_to_confirm', label: '⏳ I need to confirm availability' },
  { value: 'not_available', label: "❌ I'm not available — but can suggest an alternative" },
]

export default function QuoteRequestPage() {
  const { token } = useParams<{ token: string }>()
  const [ctx, setCtx] = useState<EventContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const [price, setPrice] = useState('')
  const [priceUnit, setPriceUnit] = useState('per_event')
  const [whatIncludes, setWhatIncludes] = useState('')
  const [serviceDetails, setServiceDetails] = useState('')
  const [availability, setAvailability] = useState('available')
  const [extraNotes, setExtraNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/quote-request/${token}`)
      .then(async res => {
        if (res.status === 404) { setNotFound(true); setLoading(false); return }
        if (res.status === 409) { setAlreadySubmitted(true); setLoading(false); return }
        const data = await res.json()
        setCtx(data)
        setLoading(false)
      })
  }, [token])

  async function submit() {
    if (!price || !whatIncludes || !availability) return
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/quote-request/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoted_price: parseFloat(price),
        price_unit: priceUnit,
        what_includes: whatIncludes,
        service_details: serviceDetails || undefined,
        availability_note: availability,
        extra_notes: extraNotes || undefined,
      }),
    })
    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-100 rounded w-48" />
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <p className="text-2xl mb-2">🤔</p>
        <p className="font-bold text-gray-900">This link is not valid</p>
        <p className="text-sm text-gray-500 mt-1">It may have expired or already been used.</p>
      </div>
    )
  }

  if (alreadySubmitted) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-bold text-gray-900">Quote already submitted</p>
        <p className="text-sm text-gray-500 mt-1">You've already sent your quote for this request.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-black text-green-900 text-lg">Quote sent!</p>
          <p className="text-sm text-green-700 mt-1">
            The host will review your quote and get in touch if they'd like to proceed.
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center">
          <p className="font-semibold text-orange-900 mb-1">Want more leads like this?</p>
          <p className="text-sm text-orange-700 mb-3">
            Create your free OneSeva profile to get notified about new events in your area, manage bookings, and build your reputation with reviews.
          </p>
          <Link
            href="/register?role=vendor"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Create free profile →
          </Link>
        </div>
      </div>
    )
  }

  if (!ctx) return null

  const currencySymbol = ctx.event.currency === 'GBP' ? '£' : ctx.event.currency === 'INR' ? '₹' : '$'

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6 px-4">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500 mb-1">Quote request for</p>
        <h1 className="text-xl font-black text-gray-900">
          {ctx.event.event_type.replace(/_/g, ' ')} in {ctx.event.city}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Hi {ctx.responder_name} — fill in your quote below. No account needed.
        </p>
      </div>

      {/* Event summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'When', value: ctx.event.fuzzy_date },
          { label: 'Guests', value: ctx.event.guest_count.toLocaleString() },
          { label: 'Budget', value: ctx.event.budget_band },
          { label: 'Service', value: ctx.vendor_type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()) },
        ].map(item => (
          <div key={item.label}>
            <p className="text-xs text-gray-400">{item.label}</p>
            <p className="text-sm font-semibold text-gray-800 capitalize">{item.value}</p>
          </div>
        ))}
      </div>

      {ctx.service_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-medium mb-1">Their requirements</p>
          <p className="text-sm text-amber-900">{ctx.service_notes}</p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Price */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Your price</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
              <input
                type="number"
                min="0"
                className="w-full border rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Per *</label>
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={priceUnit}
              onChange={e => setPriceUnit(e.target.value)}
            >
              {PRICE_UNITS.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* What's included */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-gray-900">What's included *</h2>
        <textarea
          className="w-full border rounded-xl p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={whatIncludes}
          onChange={e => setWhatIncludes(e.target.value)}
          placeholder="e.g. Setup, 3 service staff, crockery & cutlery, cleanup after event…"
        />
      </div>

      {/* Service details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Service details</h2>
        <p className="text-xs text-gray-500 -mt-2">
          Dietary options, equipment, style, hours covered — anything relevant to their requirements.
        </p>
        <textarea
          className="w-full border rounded-xl p-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={serviceDetails}
          onChange={e => setServiceDetails(e.target.value)}
          placeholder="e.g. Vegetarian & Halal options available. Buffet style. Can cover up to 200 guests…"
        />
      </div>

      {/* Availability */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-gray-900">Availability *</h2>
        {AVAILABILITY_OPTIONS.map(opt => (
          <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="availability"
              value={opt.value}
              checked={availability === opt.value}
              onChange={() => setAvailability(opt.value)}
              className="text-orange-600"
            />
            <span className="text-sm text-gray-700">{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Extra notes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-gray-900">Anything else? <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
        <textarea
          className="w-full border rounded-xl p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
          value={extraNotes}
          onChange={e => setExtraNotes(e.target.value)}
          placeholder="Any questions, clarifications, or special conditions…"
        />
      </div>

      <button
        onClick={submit}
        disabled={submitting || !price || !whatIncludes}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
      >
        {submitting ? 'Sending quote…' : 'Send my quote →'}
      </button>

      <p className="text-xs text-center text-gray-400">
        By submitting you agree to OneSeva's terms of service. No account required.
      </p>
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
git add src/app/(public)/quote-request/[token]/page.tsx
git commit -m "feat: add lightweight quote form page for magic link responders (no auth)"
```

---

### Task 5: Unified quotes page

**Files:**
- Rewrite: `src/app/(customer)/events/[id]/quotes/page.tsx`

Fetch both `Quote` records (OneSeva vendors) and `RequestResponse` records (public board) for the event. Group by service type. Display as a summary table with inline expandable detail panel per row.

- [ ] **Step 1: Rewrite the page**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

// --- Types ---

type TrayLine = { id: string; item_name: string; serves: number | null; qty: number; unit_price: number; total_price: number }

type OnesavaQuote = {
  kind: 'quote'
  id: string
  vendor_type: string
  vendor_name: string
  profile_photo: string | null
  pricing_type: string
  price_per_head: number | null
  tray_lines: TrayLine[]
  discount_type: string | null
  discount_value: number | null
  total_amount: number | null
  status: string
  currency: string
  created_at: string
}

type BoardResponse = {
  kind: 'response'
  id: string
  vendor_type: string
  name: string
  pitch: string
  phone: string | null
  price_note: string | null
  portfolio_url: string | null
  status: string
  quote_token: string | null
  quoted_price: number | null
  price_unit: string | null
  what_includes: string | null
  service_details: string | null
  availability_note: string | null
  quote_submitted_at: string | null
  created_at: string
}

type Entry = OnesavaQuote | BoardResponse

const SERVICE_LABELS: Record<string, string> = {
  CATERER: 'Catering', PHOTOGRAPHER: 'Photography', VIDEOGRAPHER: 'Videography',
  DECORATOR: 'Decoration', DJ: 'DJ', FLORIST: 'Florist', MEHENDI_ARTIST: 'Mehendi',
  MAKEUP_HAIR: 'Makeup & Hair', DHOL_PLAYER: 'Dhol', LIVE_BAND: 'Live Band',
  CHOREOGRAPHER: 'Choreographer', PANDIT_OFFICIANT: 'Pandit', MC_HOST: 'MC / Host',
  BARTENDER: 'Bartender', TRANSPORT: 'Transport',
}

const PRICE_UNIT_LABELS: Record<string, string> = {
  per_head: '/head', per_event: ' flat', per_hour: '/hr', per_day: '/day',
}

function priceDisplay(entry: Entry, currency: string): string {
  if (entry.kind === 'quote') {
    if (entry.pricing_type === 'PER_TRAY' && entry.tray_lines.length > 0) {
      const total = entry.tray_lines.reduce((s, l) => s + l.total_price, 0)
      return `${currency}${total.toLocaleString()} total`
    }
    return entry.price_per_head ? `${currency}${entry.price_per_head}/head` : '—'
  }
  if (entry.quoted_price) {
    const unit = PRICE_UNIT_LABELS[entry.price_unit ?? ''] ?? ''
    return `${currency}${entry.quoted_price.toLocaleString()}${unit}`
  }
  return entry.price_note ?? '—'
}

function statusBadge(entry: Entry) {
  const map: Record<string, string> = {
    SENT: 'bg-blue-50 text-blue-700',
    ACCEPTED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-700',
    NEGOTIATING: 'bg-amber-50 text-amber-700',
    PENDING: 'bg-gray-100 text-gray-500',
    QUOTE_REQUESTED: 'bg-blue-50 text-blue-700',
    QUOTE_SUBMITTED: 'bg-indigo-50 text-indigo-700',
    ACCEPTED_RESPONSE: 'bg-green-50 text-green-700',
    DECLINED: 'bg-gray-100 text-gray-500',
  }
  const label: Record<string, string> = {
    SENT: 'Quote sent', ACCEPTED: 'Accepted', REJECTED: 'Rejected',
    NEGOTIATING: 'Negotiating', PENDING: 'Replied', QUOTE_REQUESTED: 'Quote requested',
    QUOTE_SUBMITTED: 'Full quote', ACCEPTED_RESPONSE: 'Accepted', DECLINED: 'Declined',
  }
  const cls = map[entry.status] ?? 'bg-gray-100 text-gray-500'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label[entry.status] ?? entry.status}</span>
}

function EntryRow({
  entry, currency, eventRequestToken, onAction, acting,
}: {
  entry: Entry; currency: string; eventRequestToken: string | null
  onAction: (action: string, id: string) => void; acting: string | null
}) {
  const [open, setOpen] = useState(false)
  const name = entry.kind === 'quote' ? entry.vendor_name : entry.name
  const isQuote = entry.kind === 'quote'
  const isBoardResponse = entry.kind === 'response'
  const hasFullQuote = isBoardResponse && !!entry.quote_submitted_at

  return (
    <>
      <tr
        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${open ? 'bg-gray-50' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
            <span className="text-sm font-medium text-gray-900">{name}</span>
            {!isQuote && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                {hasFullQuote ? 'Full quote' : 'Pitch'}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">{priceDisplay(entry, currency)}</td>
        <td className="px-4 py-3">{statusBadge(entry)}</td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {format(new Date(entry.created_at), 'd MMM')}
        </td>
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          {isQuote && entry.status === 'SENT' && (
            <Link
              href={`/events/${entry.id}/quotes/${entry.id}`}
              className="text-xs text-orange-600 hover:underline"
            >
              View
            </Link>
          )}
          {isBoardResponse && entry.status === 'PENDING' && (
            <button
              onClick={() => onAction('request_full_quote', entry.id)}
              disabled={acting === entry.id}
              className="text-xs text-orange-600 hover:underline disabled:opacity-50"
            >
              {acting === entry.id ? '…' : 'Ask for quote'}
            </button>
          )}
          {isBoardResponse && entry.status === 'QUOTE_SUBMITTED' && (
            <button
              onClick={() => onAction('accept_response', entry.id)}
              disabled={acting === entry.id}
              className="text-xs text-green-600 hover:underline disabled:opacity-50"
            >
              Accept
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50 border-b border-gray-100">
          <td colSpan={5} className="px-6 pb-4 pt-2">
            {isQuote ? (
              <div className="text-sm text-gray-600 space-y-1">
                {entry.pricing_type === 'PER_TRAY' && entry.tray_lines.length > 0 ? (
                  <table className="w-full text-xs mt-1">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left pb-1">Item</th>
                        <th className="text-right pb-1">Qty</th>
                        <th className="text-right pb-1">Unit</th>
                        <th className="text-right pb-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.tray_lines.map(l => (
                        <tr key={l.id}>
                          <td className="py-0.5">{l.item_name}</td>
                          <td className="text-right">{l.qty}</td>
                          <td className="text-right">{currency}{l.unit_price}</td>
                          <td className="text-right font-medium">{currency}{l.total_price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>{currency}{entry.price_per_head}/head</p>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-700 space-y-2">
                <p className="italic text-gray-500">"{entry.pitch}"</p>
                {entry.what_includes && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">What's included</p>
                    <p>{entry.what_includes}</p>
                  </div>
                )}
                {entry.service_details && (
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">Service details</p>
                    <p>{entry.service_details}</p>
                  </div>
                )}
                {entry.availability_note && (
                  <p className="text-xs text-gray-500 capitalize">{entry.availability_note.replace(/_/g, ' ')}</p>
                )}
                {entry.portfolio_url && (
                  <a href={entry.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-orange-600 hover:underline">
                    Portfolio <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {entry.status === 'ACCEPTED_RESPONSE' && entry.phone && (
                  <p className="text-sm font-medium text-gray-900">📞 {entry.phone}</p>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function UnifiedQuotesPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [entries, setEntries] = useState<Entry[]>([])
  const [currency, setCurrency] = useState('GBP')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [acting, setActing] = useState<string | null>(null)
  // Map requestResponse.id → eventRequest.public_token (for magic link action)
  const [tokenMap, setTokenMap] = useState<Record<string, string>>({})

  async function load() {
    // Fetch both quotes and responses in parallel
    const [quotesRes, responsesRes] = await Promise.all([
      fetch(`/api/events/${eventId}/quotes`),
      fetch(`/api/events/${eventId}/responses`),
    ])
    const quotes = quotesRes.ok ? await quotesRes.json() : []
    const responsesData = responsesRes.ok ? await responsesRes.json() : { responses: [], token_map: {} }

    const quoteEntries: OnesavaQuote[] = quotes.map((q: any) => ({
      kind: 'quote' as const,
      id: q.id,
      vendor_type: q.match?.event_request?.vendor_type ?? 'CATERER',
      vendor_name: q.match?.vendor?.business_name ?? '—',
      profile_photo: q.match?.vendor?.profile_photo ?? null,
      pricing_type: q.pricing_type ?? 'PER_HEAD',
      price_per_head: q.price_per_head,
      tray_lines: q.tray_lines ?? [],
      discount_type: q.discount_type ?? null,
      discount_value: q.discount_value ?? null,
      total_amount: q.total_amount ?? null,
      status: q.status,
      currency: q.currency ?? 'GBP',
      created_at: q.created_at,
    }))

    const responseEntries: BoardResponse[] = (responsesData.responses ?? []).map((r: any) => ({
      kind: 'response' as const,
      id: r.id,
      vendor_type: r.vendor_type,
      name: r.name,
      pitch: r.pitch,
      phone: r.status === 'ACCEPTED_RESPONSE' ? r.phone : null,
      price_note: r.price_note,
      portfolio_url: r.portfolio_url,
      status: r.status,
      quote_token: r.quote_token,
      quoted_price: r.quoted_price,
      price_unit: r.price_unit,
      what_includes: r.what_includes,
      service_details: r.service_details,
      availability_note: r.availability_note,
      quote_submitted_at: r.quote_submitted_at,
      created_at: r.created_at,
    }))

    setCurrency(quoteEntries[0]?.currency ?? 'GBP')
    setEntries([...quoteEntries, ...responseEntries])
    setTokenMap(responsesData.token_map ?? {})
    setLoading(false)
  }

  useEffect(() => { load() }, [eventId])

  async function handleAction(action: string, id: string) {
    setActing(id)
    // For request_full_quote we need the event_request public_token
    if (action === 'request_full_quote') {
      const erToken = tokenMap[id]
      if (erToken) {
        await fetch(`/api/requests/${erToken}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request_full_quote', response_id: id }),
        })
      }
    }
    if (action === 'accept_response') {
      const erToken = tokenMap[id]
      if (erToken) {
        await fetch(`/api/requests/${erToken}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'accept', response_id: id }),
        })
      }
    }
    setActing(null)
    await load()
  }

  // Group by vendor_type
  const allTypes = [...new Set(entries.map(e => e.vendor_type))]
  const filtered = filter === 'ALL' ? allTypes : [filter]

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-100 rounded w-48" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-black text-gray-900">Quotes & Responses</h1>
        <div className="flex items-center gap-2">
          <select
            className="border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="ALL">All services</option>
            {allTypes.map(t => (
              <option key={t} value={t}>{SERVICE_LABELS[t] ?? t}</option>
            ))}
          </select>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📬</p>
          <p className="font-medium">No quotes or responses yet</p>
          <p className="text-sm mt-1">Add services from your event dashboard to start receiving quotes.</p>
          <Link href={`/events/${eventId}`} className="text-orange-600 text-sm hover:underline mt-3 block">
            ← Back to event
          </Link>
        </div>
      )}

      {filtered.map(type => {
        const group = entries.filter(e => e.vendor_type === type)
        if (group.length === 0) return null
        return (
          <div key={type} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="font-bold text-gray-800 text-sm">{SERVICE_LABELS[type] ?? type}</span>
              <span className="text-xs text-gray-400">{group.length} {group.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Price</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {group.map(entry => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    currency={currency}
                    eventRequestToken={tokenMap[entry.id] ?? null}
                    onAction={handleAction}
                    acting={acting}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Add the unified responses API endpoint**

The page fetches from `/api/events/[id]/responses` — create this file at `src/app/api/events/[id]/responses/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { id: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get all EventRequests for this event, each with their responses and public_token
  const eventRequests = await prisma.eventRequest.findMany({
    where: { event_id: eventId },
    select: {
      id: true,
      vendor_type: true,
      public_token: true,
      responses: {
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          pitch: true,
          price_note: true,
          portfolio_url: true,
          status: true,
          quote_token: true,
          quoted_price: true,
          price_unit: true,
          what_includes: true,
          service_details: true,
          availability_note: true,
          quote_submitted_at: true,
          created_at: true,
        },
      },
    },
  })

  // Flatten responses and attach vendor_type, build token_map
  const responses: Array<Record<string, unknown>> = []
  const token_map: Record<string, string> = {} // response.id → event_request.public_token

  for (const er of eventRequests) {
    for (const r of er.responses) {
      responses.push({ ...r, vendor_type: er.vendor_type })
      token_map[r.id] = er.public_token
    }
  }

  return NextResponse.json({ responses, token_map })
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(customer)/events/[id]/quotes/page.tsx
git add src/app/api/events/[id]/responses/route.ts
git commit -m "feat: unify quotes and board responses into single grouped table with expand-in-place detail"
```
