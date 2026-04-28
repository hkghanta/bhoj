# Customer Event Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the customer profile page, event creation wizard, and full event planning dashboard with checklist management and budget tracking.

**Architecture:** The event creation wizard is a 3-step client component (type → date/location/guests/budget → confirm) that POSTs to `/api/events` and auto-generates an EventChecklistItem row per service category. The event dashboard is a server component fetching the event with checklist; the checklist table is a client component that PATCHes individual rows in-place. Budget bar is derived from `finalized_price` sums across checklist items.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma 5, shadcn/ui, React Hook Form, Zod, date-fns

---

## File Structure

```
src/
├── app/
│   ├── (customer)/
│   │   ├── dashboard/page.tsx              # Customer dashboard — events list
│   │   ├── events/
│   │   │   ├── new/page.tsx                # Event creation wizard
│   │   │   └── [id]/
│   │   │       ├── page.tsx                # Event planning dashboard
│   │   │       └── checklist/page.tsx      # Full-page checklist view
│   │   └── profile/page.tsx               # Customer profile edit
│   └── api/
│       ├── events/
│       │   ├── route.ts                    # POST /api/events
│       │   └── [id]/
│       │       ├── route.ts                # GET/PUT /api/events/[id]
│       │       └── checklist/
│       │           └── [itemId]/route.ts   # PUT /api/events/[id]/checklist/[itemId]
│       └── customer/
│           └── profile/route.ts           # GET/PUT customer profile
└── components/
    └── customer/
        ├── EventWizard.tsx                 # Orchestrates 3-step wizard
        ├── steps/
        │   ├── Step1EventType.tsx
        │   ├── Step2EventDetails.tsx
        │   └── Step3Confirm.tsx
        ├── EventChecklistTable.tsx         # Full checklist with inline edits
        ├── BudgetBar.tsx                   # Budget summary bar
        └── AddChecklistItemDialog.tsx      # Add external vendor or custom item
```

---

### Task 1: Events API — POST create + GET/PUT event

**Files:**
- Create: `src/app/api/events/route.ts`, `src/app/api/events/[id]/route.ts`

- [ ] **Step 1: Install date-fns**

```bash
cd /home/hareesh/projects/bhoj
pnpm add date-fns
```

- [ ] **Step 2: Create checklist generator utility**

The auto-checklist maps event types to standard service categories so every new event gets a tailored starting checklist.

```typescript
// src/lib/checklist-templates.ts
import { VendorType } from '@prisma/client'

type ChecklistTemplate = {
  category: string
  item_name: string
  vendor_type?: VendorType
}

const WEDDING_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Wedding Cake / Desserts', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Food & Drink', item_name: 'Bar & Bartender', vendor_type: 'BARTENDER' },
  { category: 'Food & Drink', item_name: 'Chai & Coffee Station', vendor_type: 'CHAI_STATION' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Venue & Decor', item_name: 'Florist', vendor_type: 'FLORIST' },
  { category: 'Venue & Decor', item_name: 'Tent / Marquee', vendor_type: 'TENT_MARQUEE' },
  { category: 'Venue & Decor', item_name: 'Lighting', vendor_type: 'LIGHTING' },
  { category: 'Venue & Decor', item_name: 'Furniture & Linen', vendor_type: 'FURNITURE_RENTAL' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Entertainment', item_name: 'Dhol Player', vendor_type: 'DHOL_PLAYER' },
  { category: 'Entertainment', item_name: 'Live Band', vendor_type: 'LIVE_BAND' },
  { category: 'Entertainment', item_name: 'Choreographer', vendor_type: 'CHOREOGRAPHER' },
  { category: 'Beauty & Wellness', item_name: 'Mehendi Artist', vendor_type: 'MEHENDI_ARTIST' },
  { category: 'Beauty & Wellness', item_name: 'Makeup & Hair', vendor_type: 'MAKEUP_HAIR' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
  { category: 'Photography', item_name: 'Videographer', vendor_type: 'VIDEOGRAPHER' },
  { category: 'Ceremony', item_name: 'Pandit / Officiant', vendor_type: 'PANDIT_OFFICIANT' },
  { category: 'Admin', item_name: 'Invitation Design', vendor_type: 'INVITATION_DESIGNER' },
  { category: 'Admin', item_name: 'Transport', vendor_type: 'TRANSPORT' },
  { category: 'Admin', item_name: 'Security', vendor_type: 'SECURITY' },
  { category: 'Admin', item_name: 'MC / Host', vendor_type: 'MC_HOST' },
]

const CORPORATE_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Bar & Bartender', vendor_type: 'BARTENDER' },
  { category: 'Food & Drink', item_name: 'Chai & Coffee Station', vendor_type: 'CHAI_STATION' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
  { category: 'Admin', item_name: 'Transport', vendor_type: 'TRANSPORT' },
]

const BIRTHDAY_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Birthday Cake / Desserts', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Entertainment', item_name: 'Games & Entertainment', vendor_type: 'GAMES_ENTERTAINMENT' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
]

const ENGAGEMENT_CHECKLIST: ChecklistTemplate[] = [
  { category: 'Food & Drink', item_name: 'Caterer', vendor_type: 'CATERER' },
  { category: 'Food & Drink', item_name: 'Desserts', vendor_type: 'DESSERT_VENDOR' },
  { category: 'Venue & Decor', item_name: 'Decorator', vendor_type: 'DECORATOR' },
  { category: 'Venue & Decor', item_name: 'Florist', vendor_type: 'FLORIST' },
  { category: 'Entertainment', item_name: 'DJ', vendor_type: 'DJ' },
  { category: 'Beauty & Wellness', item_name: 'Mehendi Artist', vendor_type: 'MEHENDI_ARTIST' },
  { category: 'Photography', item_name: 'Photographer', vendor_type: 'PHOTOGRAPHER' },
  { category: 'Photography', item_name: 'Videographer', vendor_type: 'VIDEOGRAPHER' },
]

const TEMPLATE_MAP: Record<string, ChecklistTemplate[]> = {
  wedding: WEDDING_CHECKLIST,
  engagement: ENGAGEMENT_CHECKLIST,
  corporate: CORPORATE_CHECKLIST,
  birthday: BIRTHDAY_CHECKLIST,
  diwali: CORPORATE_CHECKLIST,
  eid: CORPORATE_CHECKLIST,
  navratri: CORPORATE_CHECKLIST,
  holi: BIRTHDAY_CHECKLIST,
}

export function getChecklistTemplate(eventType: string): ChecklistTemplate[] {
  const key = eventType.toLowerCase().replace(/\s+/g, '_')
  return TEMPLATE_MAP[key] ?? CORPORATE_CHECKLIST
}
```

- [ ] **Step 3: Write events POST route**

```typescript
// src/app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getChecklistTemplate } from '@/lib/checklist-templates'

const createSchema = z.object({
  event_name: z.string().min(2),
  event_type: z.string().min(2),
  event_date: z.string().datetime(),
  city: z.string().min(2),
  venue: z.string().optional(),
  guest_count: z.number().int().positive(),
  total_budget: z.number().positive(),
  currency: z.string().length(3).default('GBP'),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const events = await prisma.event.findMany({
    where: { customer_id: session.user.id },
    include: {
      checklist_items: true,
      _count: { select: { requests: true } },
    },
    orderBy: { event_date: 'asc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { total_budget, event_date, ...rest } = parsed.data
  const template = getChecklistTemplate(parsed.data.event_type)

  const event = await prisma.event.create({
    data: {
      ...rest,
      event_date: new Date(event_date),
      total_budget,
      customer_id: session.user.id,
      checklist_items: {
        create: template.map(item => ({
          category: item.category,
          item_name: item.item_name,
          status: 'PENDING',
        })),
      },
    },
    include: { checklist_items: true },
  })

  return NextResponse.json(event, { status: 201 })
}
```

- [ ] **Step 4: Write event GET/PUT route**

```typescript
// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { EventStatus } from '@prisma/client'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user.id },
    include: {
      checklist_items: { orderBy: [{ category: 'asc' }, { created_at: 'asc' }] },
      requests: {
        include: {
          matches: {
            include: { vendor: { select: { id: true, business_name: true, profile_photo_url: true } } },
          },
        },
      },
    },
  })

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(event)
}

const updateSchema = z.object({
  event_name: z.string().optional(),
  event_date: z.string().datetime().optional(),
  venue: z.string().optional(),
  guest_count: z.number().int().positive().optional(),
  total_budget: z.number().positive().optional(),
  status: z.nativeEnum(EventStatus).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const existing = await prisma.event.findFirst({ where: { id, customer_id: session.user.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.event_date) data.event_date = new Date(parsed.data.event_date)

  const event = await prisma.event.update({ where: { id }, data })
  return NextResponse.json(event)
}
```

- [ ] **Step 5: Write checklist item PUT route**

```typescript
// src/app/api/events/[id]/checklist/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ChecklistStatus } from '@prisma/client'

const updateSchema = z.object({
  status: z.nativeEnum(ChecklistStatus).optional(),
  external_vendor_name: z.string().optional().nullable(),
  external_vendor_phone: z.string().optional().nullable(),
  external_vendor_email: z.string().email().optional().nullable(),
  quoted_price: z.number().positive().optional().nullable(),
  quoted_price_type: z.string().optional().nullable(),
  finalized_price: z.number().positive().optional().nullable(),
  finalized_price_type: z.string().optional().nullable(),
  deposit_paid: z.boolean().optional(),
  deposit_amount: z.number().positive().optional().nullable(),
  balance_due: z.number().positive().optional().nullable(),
  balance_due_date: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, itemId } = await params

  // Verify event belongs to customer
  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user.id },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.balance_due_date) data.balance_due_date = new Date(parsed.data.balance_due_date)
  if (parsed.data.due_date) data.due_date = new Date(parsed.data.due_date)

  const item = await prisma.eventChecklistItem.update({
    where: { id: itemId },
    data,
  })

  // Recalculate checklist_progress on the event
  const allItems = await prisma.eventChecklistItem.findMany({ where: { event_id: id } })
  const doneStatuses: ChecklistStatus[] = ['FINALIZED', 'NOT_NEEDED']
  const doneCount = allItems.filter(i => doneStatuses.includes(i.status)).length
  const progress = Math.round((doneCount / allItems.length) * 100)

  // Recalculate total_spent from finalized prices
  const totalSpent = allItems.reduce((sum, i) => {
    return sum + (i.finalized_price ? Number(i.finalized_price) : 0)
  }, 0)

  await prisma.event.update({
    where: { id },
    data: { checklist_progress: progress, total_spent: totalSpent },
  })

  return NextResponse.json(item)
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/events/ src/lib/checklist-templates.ts
git commit -m "feat: add events API with checklist auto-generation and budget tracking"
git push
```

---

### Task 2: Event creation wizard

**Files:**
- Create: `src/app/(customer)/events/new/page.tsx`, `src/components/customer/EventWizard.tsx`, `src/components/customer/steps/Step1EventType.tsx`, `src/components/customer/steps/Step2EventDetails.tsx`, `src/components/customer/steps/Step3Confirm.tsx`

- [ ] **Step 1: Install additional shadcn components**

```bash
cd /home/hareesh/projects/bhoj
pnpm dlx shadcn@latest add popover calendar
```

- [ ] **Step 2: Write Step 1 — event type selector**

```typescript
// src/components/customer/steps/Step1EventType.tsx
'use client'

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', emoji: '💍', desc: 'Full wedding celebration' },
  { value: 'engagement', label: 'Engagement', emoji: '💑', desc: 'Engagement ceremony & party' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂', desc: 'Birthday party' },
  { value: 'corporate', label: 'Corporate', emoji: '🏢', desc: 'Company event or dinner' },
  { value: 'diwali', label: 'Diwali', emoji: '🪔', desc: 'Diwali celebration' },
  { value: 'eid', label: 'Eid', emoji: '🌙', desc: 'Eid celebration' },
  { value: 'navratri', label: 'Navratri', emoji: '🎉', desc: 'Navratri garba event' },
  { value: 'holi', label: 'Holi', emoji: '🎨', desc: 'Holi party' },
  { value: 'other', label: 'Other', emoji: '🎊', desc: 'Custom event' },
]

type Props = { onNext: (eventType: string) => void }

export function Step1EventType({ onNext }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">What kind of event are you planning?</h2>
        <p className="text-gray-500 text-sm mt-1">We'll build a custom planning checklist for you.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {EVENT_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => onNext(type.value)}
            className="p-4 border-2 rounded-xl text-left hover:border-orange-400 hover:bg-orange-50 transition-colors group"
          >
            <span className="text-2xl block mb-2">{type.emoji}</span>
            <p className="font-medium text-gray-900 group-hover:text-orange-700">{type.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{type.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write Step 2 — event details**

```typescript
// src/components/customer/steps/Step2EventDetails.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

type EventDetails = {
  event_name: string
  event_date: string
  city: string
  venue: string
  guest_count: number
  total_budget: number
  currency: string
}

type Props = {
  eventType: string
  onNext: (details: EventDetails) => void
  onBack: () => void
}

export function Step2EventDetails({ eventType, onNext, onBack }: Props) {
  const [form, setForm] = useState<EventDetails>({
    event_name: '',
    event_date: '',
    city: '',
    venue: '',
    guest_count: 100,
    total_budget: 5000,
    currency: 'GBP',
  })
  const [error, setError] = useState('')

  function validate() {
    if (!form.event_name) return 'Event name is required.'
    if (!form.event_date) return 'Date is required.'
    if (new Date(form.event_date) < new Date()) return 'Event date must be in the future.'
    if (!form.city) return 'City is required.'
    if (form.guest_count < 1) return 'Guest count must be at least 1.'
    if (form.total_budget < 100) return 'Budget must be at least 100.'
    return null
  }

  function handleNext() {
    const err = validate()
    if (err) { setError(err); return }
    onNext(form)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Event details</h2>
        <p className="text-gray-500 text-sm mt-1 capitalize">Planning a {eventType}</p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-1">
        <Label>Event name *</Label>
        <Input
          value={form.event_name}
          onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))}
          placeholder="Priya & Arjun's Wedding"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Date *</Label>
          <Input
            type="date"
            value={form.event_date ? form.event_date.split('T')[0] : ''}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setForm(f => ({ ...f, event_date: new Date(e.target.value).toISOString() }))}
          />
        </div>
        <div className="space-y-1">
          <Label>City *</Label>
          <Input
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="London"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Venue name <span className="text-gray-400">(optional)</span></Label>
        <Input
          value={form.venue}
          onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
          placeholder="The Grand Banqueting Hall"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Guests *</Label>
          <Input
            type="number"
            min={1}
            value={form.guest_count}
            onChange={e => setForm(f => ({ ...f, guest_count: parseInt(e.target.value) }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Total budget *</Label>
          <Input
            type="number"
            min={100}
            value={form.total_budget}
            onChange={e => setForm(f => ({ ...f, total_budget: parseFloat(e.target.value) }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GBP">GBP £</SelectItem>
              <SelectItem value="USD">USD $</SelectItem>
              <SelectItem value="CAD">CAD $</SelectItem>
              <SelectItem value="AUD">AUD $</SelectItem>
              <SelectItem value="INR">INR ₹</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} className="flex-1 bg-orange-600 hover:bg-orange-700">
          Review & Create →
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write Step 3 — confirm and create**

```typescript
// src/components/customer/steps/Step3Confirm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { getChecklistTemplate } from '@/lib/checklist-templates'

type EventDetails = {
  event_name: string; event_date: string; city: string; venue: string;
  guest_count: number; total_budget: number; currency: string
}

type Props = { eventType: string; details: EventDetails; onBack: () => void }

export function Step3Confirm({ eventType, details, onBack }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const template = getChecklistTemplate(eventType)
  const categories = [...new Set(template.map(t => t.category))]

  async function createEvent() {
    setCreating(true)
    setError('')
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, ...details }),
    })
    if (res.ok) {
      const event = await res.json()
      router.push(`/events/${event.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to create event.')
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review your event</h2>
        <p className="text-gray-500 text-sm mt-1">We'll create your planning checklist automatically.</p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Event name</span>
          <span className="font-medium">{details.event_name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Type</span>
          <span className="font-medium capitalize">{eventType}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Date</span>
          <span className="font-medium">{format(new Date(details.event_date), 'EEEE, d MMMM yyyy')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Location</span>
          <span className="font-medium">{details.city}{details.venue ? ` — ${details.venue}` : ''}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Guests</span>
          <span className="font-medium">{details.guest_count.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Budget</span>
          <span className="font-medium text-orange-600">
            {details.currency} {details.total_budget.toLocaleString()}
          </span>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Your checklist will include {template.length} items across {categories.length} categories:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
          ))}
        </div>
      </div>

      {details.guest_count >= 100 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
          <strong>Tasting events unlocked!</strong> With {details.guest_count} guests, caterers can offer tasting sessions with their quotes.
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={createEvent} disabled={creating} className="flex-1 bg-orange-600 hover:bg-orange-700">
          {creating ? 'Creating event…' : 'Create Event & Go to Dashboard →'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write EventWizard orchestrator**

```typescript
// src/components/customer/EventWizard.tsx
'use client'
import { useState } from 'react'
import { Step1EventType } from './steps/Step1EventType'
import { Step2EventDetails } from './steps/Step2EventDetails'
import { Step3Confirm } from './steps/Step3Confirm'

type EventDetails = {
  event_name: string; event_date: string; city: string; venue: string;
  guest_count: number; total_budget: number; currency: string
}

export function EventWizard() {
  const [step, setStep] = useState(0)
  const [eventType, setEventType] = useState('')
  const [details, setDetails] = useState<EventDetails | null>(null)

  return (
    <div className="bg-white rounded-xl border p-8 max-w-2xl mx-auto">
      {step === 0 && (
        <Step1EventType onNext={(type) => { setEventType(type); setStep(1) }} />
      )}
      {step === 1 && (
        <Step2EventDetails
          eventType={eventType}
          onNext={(d) => { setDetails(d); setStep(2) }}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && details && (
        <Step3Confirm
          eventType={eventType}
          details={details}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 6: Write new event page**

```typescript
// src/app/(customer)/events/new/page.tsx
import { EventWizard } from '@/components/customer/EventWizard'

export default function NewEventPage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Plan your event</h1>
        <p className="text-gray-500 mt-2">Takes 2 minutes. We'll set up your planning dashboard automatically.</p>
      </div>
      <EventWizard />
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/customer/ src/app/\(customer\)/events/new/
git commit -m "feat: add event creation wizard with 3-step flow and auto-checklist generation"
git push
```

---

### Task 3: Event planning dashboard + checklist table

**Files:**
- Create: `src/app/(customer)/events/[id]/page.tsx`, `src/components/customer/EventChecklistTable.tsx`, `src/components/customer/BudgetBar.tsx`, `src/components/customer/AddChecklistItemDialog.tsx`

- [ ] **Step 1: Write BudgetBar component**

```typescript
// src/components/customer/BudgetBar.tsx
import { Progress } from '@/components/ui/progress'

type Props = {
  totalBudget: number
  totalSpent: number
  currency: string
}

export function BudgetBar({ totalBudget, totalSpent, currency }: Props) {
  const remaining = totalBudget - totalSpent
  const pct = Math.min(Math.round((totalSpent / totalBudget) * 100), 100)
  const isOverBudget = totalSpent > totalBudget

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Budget Overview</h3>
        <span className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
          {isOverBudget ? `${fmt(Math.abs(remaining))} over budget` : `${fmt(remaining)} remaining`}
        </span>
      </div>
      <Progress
        value={pct}
        className={`h-3 ${isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-orange-500'}`}
      />
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Committed: <strong className="text-gray-900">{fmt(totalSpent)}</strong></span>
        <span>Total budget: <strong className="text-gray-900">{fmt(totalBudget)}</strong></span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write AddChecklistItemDialog**

```typescript
// src/components/customer/AddChecklistItemDialog.tsx
'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'

type Props = {
  eventId: string
  onAdded: () => void
}

const CATEGORIES = [
  'Food & Drink', 'Venue & Decor', 'Entertainment', 'Photography',
  'Beauty & Wellness', 'Ceremony', 'Admin', 'Other'
]

export function AddChecklistItemDialog({ eventId, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'external' | 'custom'>('external')
  const [form, setForm] = useState({
    item_name: '', category: '', external_vendor_name: '',
    external_vendor_phone: '', external_vendor_email: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!form.item_name || !form.category) return
    setSaving(true)
    await fetch(`/api/events/${eventId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setOpen(false)
    setForm({ item_name: '', category: '', external_vendor_name: '', external_vendor_phone: '', external_vendor_email: '' })
    onAdded()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add checklist item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex rounded-lg border overflow-hidden">
            <button
              className={`flex-1 py-2 text-sm font-medium ${mode === 'external' ? 'bg-orange-600 text-white' : 'text-gray-600'}`}
              onClick={() => setMode('external')}
            >External Vendor</button>
            <button
              className={`flex-1 py-2 text-sm font-medium ${mode === 'custom' ? 'bg-orange-600 text-white' : 'text-gray-600'}`}
              onClick={() => setMode('custom')}
            >Custom Item</button>
          </div>

          <div className="space-y-1">
            <Label>Item / Service name *</Label>
            <Input value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} placeholder="e.g. Sound system hire" />
          </div>

          <div className="space-y-1">
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Select category…" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {mode === 'external' && (
            <>
              <div className="space-y-1">
                <Label>Vendor name</Label>
                <Input value={form.external_vendor_name} onChange={e => setForm(f => ({ ...f, external_vendor_name: e.target.value }))} placeholder="ABC Catering Ltd" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.external_vendor_phone} onChange={e => setForm(f => ({ ...f, external_vendor_phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={form.external_vendor_email} onChange={e => setForm(f => ({ ...f, external_vendor_email: e.target.value }))} />
                </div>
              </div>
            </>
          )}

          <Button onClick={handleAdd} disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700">
            {saving ? 'Adding…' : 'Add to checklist'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Add checklist item POST route**

```typescript
// src/app/api/events/[id]/checklist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  item_name: z.string().min(1),
  category: z.string().min(1),
  external_vendor_name: z.string().optional(),
  external_vendor_phone: z.string().optional(),
  external_vendor_email: z.string().email().optional().or(z.literal('')),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, customer_id: session.user.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const item = await prisma.eventChecklistItem.create({
    data: { ...parsed.data, event_id: id, status: 'PENDING' },
  })

  return NextResponse.json(item, { status: 201 })
}
```

- [ ] **Step 4: Write EventChecklistTable component**

```typescript
// src/components/customer/EventChecklistTable.tsx
'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChecklistStatus } from '@prisma/client'
import { Pencil, Check, X } from 'lucide-react'

type ChecklistItem = {
  id: string; category: string; item_name: string; status: ChecklistStatus
  external_vendor_name: string | null; quoted_price: number | null
  finalized_price: number | null; deposit_paid: boolean; deposit_amount: number | null
  balance_due: number | null; notes: string | null
}

type Props = {
  eventId: string
  items: ChecklistItem[]
  currency: string
  onUpdated: () => void
}

const STATUS_COLORS: Record<ChecklistStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  SEARCHING: 'bg-blue-50 text-blue-700',
  SHORTLISTED: 'bg-yellow-50 text-yellow-700',
  FINALIZED: 'bg-green-50 text-green-700',
  NOT_NEEDED: 'bg-gray-50 text-gray-400',
}

export function EventChecklistTable({ eventId, items, currency, onUpdated }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<ChecklistItem>>({})
  const [saving, setSaving] = useState(false)

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id)
    setEditValues({
      status: item.status,
      external_vendor_name: item.external_vendor_name ?? '',
      quoted_price: item.quoted_price,
      finalized_price: item.finalized_price,
      deposit_paid: item.deposit_paid,
      deposit_amount: item.deposit_amount,
      balance_due: item.balance_due,
      notes: item.notes ?? '',
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    await fetch(`/api/events/${eventId}/checklist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editValues),
    })
    setSaving(false)
    setEditingId(null)
    onUpdated()
  }

  // Group by category
  const grouped = items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const fmt = (n: number | null) =>
    n != null
      ? new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
      : '—'

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">{category}</h3>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-48">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Quoted</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Finalized</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">Deposit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {categoryItems.map(item => {
                  const isEditing = editingId === item.id
                  return (
                    <tr key={item.id} className={`${isEditing ? 'bg-orange-50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.item_name}</td>

                      <td className="px-4 py-3 text-gray-600">
                        {isEditing ? (
                          <Input
                            value={String(editValues.external_vendor_name ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, external_vendor_name: e.target.value }))}
                            className="h-8 text-sm"
                            placeholder="Vendor name"
                          />
                        ) : (
                          item.external_vendor_name ?? <span className="text-gray-300">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Select
                            value={editValues.status as string}
                            onValueChange={v => setEditValues(ev => ({ ...ev, status: v as ChecklistStatus }))}
                          >
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.keys(STATUS_COLORS).map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                            {item.status}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right text-gray-600">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValues.quoted_price ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, quoted_price: parseFloat(e.target.value) || null }))}
                            className="h-8 text-sm text-right"
                          />
                        ) : fmt(item.quoted_price)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValues.finalized_price ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, finalized_price: parseFloat(e.target.value) || null }))}
                            className="h-8 text-sm text-right"
                          />
                        ) : fmt(item.finalized_price)}
                      </td>

                      <td className="px-4 py-3 text-right text-gray-600">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValues.deposit_amount ?? ''}
                            onChange={e => setEditValues(v => ({ ...v, deposit_amount: parseFloat(e.target.value) || null }))}
                            className="h-8 text-sm text-right"
                          />
                        ) : fmt(item.deposit_amount)}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {isEditing ? (
                          <Input
                            value={String(editValues.notes ?? '')}
                            onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))}
                            className="h-8 text-sm"
                            placeholder="Notes…"
                          />
                        ) : (
                          <span className="truncate max-w-[200px] block">{item.notes ?? <span className="text-gray-300">—</span>}</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(item.id)} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(item)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Write event planning dashboard page**

```typescript
// src/app/(customer)/events/[id]/page.tsx
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BudgetBar } from '@/components/customer/BudgetBar'
import { EventChecklistTable } from '@/components/customer/EventChecklistTable'
import { AddChecklistItemDialog } from '@/components/customer/AddChecklistItemDialog'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import Link from 'next/link'

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user.id },
    include: {
      checklist_items: { orderBy: [{ category: 'asc' }, { created_at: 'asc' }] },
    },
  })

  if (!event) notFound()

  const doneStatuses = ['FINALIZED', 'NOT_NEEDED']
  const doneCount = event.checklist_items.filter(i => doneStatuses.includes(i.status)).length
  const progressPct = event.checklist_items.length > 0
    ? Math.round((doneCount / event.checklist_items.length) * 100)
    : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/dashboard" className="hover:text-orange-600">My Events</Link>
            <span>/</span>
            <span>{event.event_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{event.event_name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {format(event.event_date, 'EEEE, d MMMM yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {event.city}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {event.guest_count} guests
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{event.status}</Badge>
          <Badge className="bg-orange-50 text-orange-700 border-orange-200">
            {progressPct}% complete
          </Badge>
          <Button variant="outline" size="sm" disabled>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Budget bar */}
      <div className="mb-6">
        <BudgetBar
          totalBudget={Number(event.total_budget)}
          totalSpent={Number(event.total_spent)}
          currency={event.currency}
        />
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Planning Checklist
            <span className="ml-2 text-sm font-normal text-gray-400">
              {doneCount} / {event.checklist_items.length} done
            </span>
          </h2>
          <AddChecklistItemDialog eventId={id} onAdded={() => {}} />
        </div>
        <EventChecklistTable
          eventId={id}
          items={event.checklist_items as any}
          currency={event.currency}
          onUpdated={() => {}}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Update customer dashboard to list events**

```typescript
// src/app/(customer)/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, CalendarDays, Users } from 'lucide-react'

export default async function CustomerDashboard() {
  const session = await auth()
  if (!session) redirect('/login')

  const events = await prisma.event.findMany({
    where: { customer_id: session.user.id },
    include: { _count: { select: { checklist_items: true } } },
    orderBy: { event_date: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link href="/events/new"><Plus className="h-4 w-4 mr-2" /> New Event</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="text-gray-400 mb-4">No events yet. Start planning your celebration!</p>
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href="/events/new">Create my first event</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="bg-white rounded-xl border p-5 hover:border-orange-400 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{event.event_name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{event.event_type}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{event.status}</Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(event.event_date, 'd MMM yyyy')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {event.guest_count} guests · {event.city}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Planning progress</span>
                    <span>{event.checklist_progress}%</span>
                  </div>
                  <Progress value={event.checklist_progress} className="h-1.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/customer/ src/app/\(customer\)/events/ src/app/\(customer\)/dashboard/ src/app/api/events/
git commit -m "feat: add event planning dashboard with checklist table, budget bar, and inline editing"
git push
```

---

### Task 4: Customer profile page

**Files:**
- Create: `src/app/(customer)/profile/page.tsx`, `src/app/api/customer/profile/route.ts`

- [ ] **Step 1: Write customer profile API**

```typescript
// src/app/api/customer/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, location: true, avatar_url: true, created_at: true },
  })

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const customer = await prisma.customer.update({
    where: { id: session.user.id },
    data: parsed.data,
  })

  return NextResponse.json(customer)
}
```

- [ ] **Step 2: Write customer profile page**

```typescript
// src/app/(customer)/profile/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Profile = { name: string; email: string; phone: string | null; location: string | null }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', location: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/customer/profile')
      .then(r => r.json())
      .then((data: Profile) => {
        setProfile(data)
        setForm({ name: data.name, phone: data.phone ?? '', location: data.location ?? '' })
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/customer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!profile) return <div className="text-gray-400">Loading…</div>

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-400">Email cannot be changed.</p>
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+44 7700 000000" />
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="London, UK" />
            </div>
            <Button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(customer\)/profile/ src/app/api/customer/
git commit -m "feat: add customer profile view and edit page"
git push
```

---
