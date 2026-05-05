# Sub-Events & Guest RSVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sub-event management (Mehendi/Puja/Reception etc.) and a guest RSVP system where households are invited to specific sub-events via a token link, collecting dietary preferences that feed into catering matching.

**Architecture:** `SubEvent` hangs off `Event` as an optional layer — simple events (birthday, corporate) work unchanged. `GuestHousehold` belongs to the parent event, linked to specific sub-events via `GuestSubEventInvite`. A public `/e/[token]` page lets guests RSVP per sub-event without logging in.

**Tech Stack:** Next.js App Router, Prisma 5, PostgreSQL, Resend (email), Cloudinary (invite image upload), Zod (validation), TypeScript.

---

## File Map

**New files:**
- `prisma/schema.prisma` — 4 new models, 1 new enum, updates to Event/EventChecklistItem/EventRequest
- `src/app/api/events/[id]/sub-events/route.ts` — GET list, POST create
- `src/app/api/events/[id]/sub-events/[subId]/route.ts` — PATCH, DELETE
- `src/app/api/events/[id]/guests/route.ts` — GET list, POST add household
- `src/app/api/events/[id]/guests/[householdId]/route.ts` — PATCH, DELETE
- `src/app/api/events/[id]/guests/[householdId]/send-invite/route.ts` — POST send email
- `src/app/api/events/[id]/invite/route.ts` — PATCH save image + message
- `src/app/api/rsvp/[token]/route.ts` — GET public event+invites
- `src/app/api/rsvp/[token]/[inviteId]/route.ts` — POST submit attendees
- `src/app/(customer)/events/[id]/sub-events/page.tsx` — sub-event management UI
- `src/app/(customer)/events/[id]/guests/page.tsx` — guest list UI
- `src/app/e/[token]/page.tsx` — public RSVP page (outside auth route group)
- `src/lib/notifications/templates/invite-email.tsx` — Resend email template

**Modified files:**
- `src/app/(customer)/events/[id]/page.tsx` — add sub-event cards + Guests action card
- `src/app/(customer)/events/[id]/vendors/page.tsx` — sub-event scoping in sidebar

---

## Task 1: Prisma Schema — New Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add GuestDietaryType enum and four new models to schema.prisma**

Add after the existing `ChecklistStatus` enum and before the closing of the schema. The exact insertion point is after line 277 (end of `EventRequest` model). Add these lines:

```prisma
// ─── Guest & RSVP ────────────────────────────────────────────────────────────

enum GuestDietaryType {
  NON_VEG
  VEGETARIAN
  VEGAN
  JAIN
  HALAL
}

model SubEvent {
  id          String   @id @default(cuid())
  event_id    String
  name        String
  event_date  DateTime
  venue       String?
  guest_count Int?
  budget      Decimal? @db.Decimal(12, 2)
  currency    String   @default("GBP")
  notes       String?
  sort_order  Int      @default(0)
  created_at  DateTime @default(now())

  event           Event                @relation(fields: [event_id], references: [id], onDelete: Cascade)
  checklist_items EventChecklistItem[]
  requests        EventRequest[]
  invites         GuestSubEventInvite[]
}

model GuestHousehold {
  id         String   @id @default(cuid())
  event_id   String
  label      String
  email      String?
  phone      String?
  token      String   @unique @default(cuid())
  declined   Boolean  @default(false)
  created_at DateTime @default(now())

  event   Event                 @relation(fields: [event_id], references: [id], onDelete: Cascade)
  invites GuestSubEventInvite[]
}

model GuestSubEventInvite {
  id           String    @id @default(cuid())
  household_id String
  sub_event_id String
  responded_at DateTime?
  created_at   DateTime  @default(now())

  household GuestHousehold @relation(fields: [household_id], references: [id], onDelete: Cascade)
  sub_event SubEvent       @relation(fields: [sub_event_id], references: [id], onDelete: Cascade)
  attendees GuestAttendee[]

  @@unique([household_id, sub_event_id])
}

model GuestAttendee {
  id           String           @id @default(cuid())
  invite_id    String
  name         String?
  dietary_type GuestDietaryType @default(NON_VEG)
  allergens    String[]         @default([])
  created_at   DateTime         @default(now())

  invite GuestSubEventInvite @relation(fields: [invite_id], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Update Event model to add new fields and relations**

In the `Event` model (around line 218), add these fields before the closing brace:

```prisma
  invite_image_url String?
  invite_message   String?

  sub_events  SubEvent[]
  households  GuestHousehold[]
```

- [ ] **Step 3: Update EventChecklistItem to add optional sub_event_id**

In the `EventChecklistItem` model, add after `event_id String`:

```prisma
  sub_event_id String?
  sub_event    SubEvent? @relation(fields: [sub_event_id], references: [id])
```

- [ ] **Step 4: Update EventRequest to add optional sub_event_id**

In the `EventRequest` model, add after `event_id String`:

```prisma
  sub_event_id String?
  sub_event    SubEvent? @relation(fields: [sub_event_id], references: [id])
```

- [ ] **Step 5: Run migration**

```bash
cd /home/hareesh/projects/oneseva
npx prisma migrate dev --name add_sub_events_and_guests
```

Expected: Migration created and applied successfully. Prisma client regenerated.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No output (no errors).

- [ ] **Step 7: Commit**

```bash
git add prisma/
git commit -m "feat: add SubEvent, GuestHousehold, GuestSubEventInvite, GuestAttendee schema"
```

---

## Task 2: Sub-Event API — List & Create

**Files:**
- Create: `src/app/api/events/[id]/sub-events/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  event_date: z.string().datetime(),
  venue: z.string().optional(),
  guest_count: z.number().int().positive().optional(),
  budget: z.number().positive().optional(),
  notes: z.string().optional(),
  sort_order: z.number().int().default(0),
})

async function getAuthedEvent(eventId: string, customerId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await getAuthedEvent(id, session.user!.id as string)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const subEvents = await prisma.subEvent.findMany({
    where: { event_id: id },
    orderBy: [{ sort_order: 'asc' }, { event_date: 'asc' }],
  })
  return NextResponse.json(subEvents)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await getAuthedEvent(id, session.user!.id as string)
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { event_date, ...rest } = parsed.data
  const subEvent = await prisma.subEvent.create({
    data: { ...rest, event_id: id, event_date: new Date(event_date) },
  })
  return NextResponse.json(subEvent, { status: 201 })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/events/
git commit -m "feat: sub-event list and create API"
```

---

## Task 3: Sub-Event API — Update & Delete

**Files:**
- Create: `src/app/api/events/[id]/sub-events/[subId]/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  event_date: z.string().datetime().optional(),
  venue: z.string().nullable().optional(),
  guest_count: z.number().int().positive().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
})

async function getAuthedSubEvent(subId: string, eventId: string, customerId: string) {
  return prisma.subEvent.findFirst({
    where: { id: subId, event_id: eventId, event: { customer_id: customerId } },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, subId } = await params
  const existing = await getAuthedSubEvent(subId, id, session.user!.id as string)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { event_date, ...rest } = parsed.data
  const updated = await prisma.subEvent.update({
    where: { id: subId },
    data: { ...rest, ...(event_date ? { event_date: new Date(event_date) } : {}) },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, subId } = await params
  const existing = await getAuthedSubEvent(subId, id, session.user!.id as string)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.subEvent.delete({ where: { id: subId } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/events/
git commit -m "feat: sub-event update and delete API"
```

---

## Task 4: Sub-Events Management Page

**Files:**
- Create: `src/app/(customer)/events/[id]/sub-events/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Plus, Pencil, Trash2, ChevronRight, GripVertical } from 'lucide-react'
import Link from 'next/link'

type SubEvent = {
  id: string
  name: string
  event_date: string
  venue: string | null
  guest_count: number | null
  budget: number | null
  currency: string
  notes: string | null
  sort_order: number
}

const SUBEVENT_SUGGESTIONS = [
  'Mehendi Night', 'Haldi Ceremony', 'Sangeet', 'Puja / Pooja',
  'Wedding Ceremony', 'Reception', 'Farewell Brunch',
]

export default function SubEventsPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', event_date: '', venue: '', guest_count: '', budget: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [eventId])

  async function load() {
    const res = await fetch(`/api/events/${eventId}/sub-events`)
    if (res.ok) setSubEvents(await res.json())
    setLoading(false)
  }

  function resetForm() {
    setForm({ name: '', event_date: '', venue: '', guest_count: '', budget: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(se: SubEvent) {
    setForm({
      name: se.name,
      event_date: se.event_date.slice(0, 16),
      venue: se.venue ?? '',
      guest_count: se.guest_count?.toString() ?? '',
      budget: se.budget?.toString() ?? '',
      notes: se.notes ?? '',
    })
    setEditingId(se.id)
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const body = {
      name: form.name,
      event_date: new Date(form.event_date).toISOString(),
      venue: form.venue || undefined,
      guest_count: form.guest_count ? parseInt(form.guest_count) : undefined,
      budget: form.budget ? parseFloat(form.budget) : undefined,
      notes: form.notes || undefined,
    }
    const url = editingId
      ? `/api/events/${eventId}/sub-events/${editingId}`
      : `/api/events/${eventId}/sub-events`
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { await load(); resetForm() }
    setSaving(false)
  }

  async function remove(subId: string) {
    if (!confirm('Delete this sub-event? All vendor matches and guest invites for it will be removed.')) return
    await fetch(`/api/events/${eventId}/sub-events/${subId}`, { method: 'DELETE' })
    setSubEvents(prev => prev.filter(s => s.id !== subId))
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/dashboard" className="hover:text-orange-600">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}`} className="hover:text-orange-600">Event</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-700">Sub-Events</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">Break your event into multiple occasions, each with its own vendors and guests.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-1.5" /> Add sub-event
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-900">{editingId ? 'Edit' : 'New'} sub-event</h2>

          {/* Quick suggestions */}
          {!editingId && (
            <div className="flex flex-wrap gap-1.5">
              {SUBEVENT_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setForm(f => ({ ...f, name: s }))}
                  className="text-xs px-3 py-1 rounded-full border border-dashed border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mehendi Night" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Date & time *</label>
              <Input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Venue</label>
              <Input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Venue name" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Expected guests</label>
              <Input type="number" value={form.guest_count} onChange={e => setForm(f => ({ ...f, guest_count: e.target.value }))} placeholder="—" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Budget (£)</label>
              <Input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="—" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Notes</label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any details..." />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.event_date} className="bg-orange-600 hover:bg-orange-700">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add sub-event'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : subEvents.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p className="text-base font-medium text-gray-600 mb-1">No sub-events yet</p>
          <p className="text-sm">Add occasions like Mehendi, Reception, Puja — each with its own vendors and guests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subEvents.map(se => (
            <div key={se.id} className="bg-white rounded-xl border p-4 flex items-start gap-3">
              <GripVertical className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{se.name}</h3>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mt-1">
                  <span>📅 {format(new Date(se.event_date), 'EEE d MMM yyyy, h:mm a')}</span>
                  {se.venue && <span>📍 {se.venue}</span>}
                  {se.guest_count && <span>👥 {se.guest_count} guests</span>}
                  {se.budget && <span>💰 £{Number(se.budget).toLocaleString()}</span>}
                </div>
                {se.notes && <p className="text-xs text-gray-400 mt-1 truncate">{se.notes}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(se)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(se.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(customer\)/events/
git commit -m "feat: sub-events management page"
```

---

## Task 5: Update Event Dashboard — Sub-Event Cards + Guests Card

**Files:**
- Modify: `src/app/(customer)/events/[id]/page.tsx`

- [ ] **Step 1: Update the prisma query to include sub_events**

Change the event query (around line 17) to include sub_events:

```typescript
  const event = await prisma.event.findFirst({
    where: { id, customer_id: (session.user!.id as string) },
    include: {
      checklist_items: { orderBy: [{ category: 'asc' }, { created_at: 'asc' }] },
      sub_events: { orderBy: [{ sort_order: 'asc' }, { event_date: 'asc' }] },
    },
  })
```

- [ ] **Step 2: Add guest count query after the unreadCount query**

```typescript
  const guestHouseholdCount = await prisma.guestHousehold.count({
    where: { event_id: id },
  })
```

- [ ] **Step 3: Update the imports line to add CalendarPlus and Users2**

```typescript
import { CalendarDays, MapPin, Users, Search, FileText, MessageSquare, ChevronRight, Wallet, CalendarPlus, Users2 } from 'lucide-react'
```

- [ ] **Step 4: Change the action cards grid from `grid-cols-3` to `grid-cols-4` and add Guests card**

Replace the action cards section (lines 149–193):

```tsx
      {/* Action cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link href={`/events/${id}/vendors`}
          className="bg-orange-600 hover:bg-orange-700 rounded-xl p-4 text-white transition-colors group">
          <div className="flex items-center justify-between mb-1">
            <Search className="h-5 w-5" />
            <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="font-semibold text-sm mt-2">Find Vendors</div>
          <div className="text-xs opacity-80">Browse matched vendors</div>
        </Link>

        <Link href={`/events/${id}/quotes`}
          className="bg-white hover:bg-gray-50 rounded-xl border p-4 text-gray-900 transition-colors group relative">
          <div className="flex items-center justify-between mb-1">
            <FileText className="h-5 w-5 text-gray-500" />
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="font-semibold text-sm mt-2">Quotes</div>
          <div className="text-xs text-gray-500">
            {quoteCount > 0 ? `${quoteCount} received` : 'No quotes yet'}
          </div>
          {quoteCount > 0 && (
            <span className="absolute top-3 right-8 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {quoteCount}
            </span>
          )}
        </Link>

        <Link href="/messages"
          className="bg-white hover:bg-gray-50 rounded-xl border p-4 text-gray-900 transition-colors group relative">
          <div className="flex items-center justify-between mb-1">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="font-semibold text-sm mt-2">Messages</div>
          <div className="text-xs text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'Chat with vendors'}
          </div>
          {unreadCount > 0 && (
            <span className="absolute top-3 right-8 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>

        <Link href={`/events/${id}/guests`}
          className="bg-white hover:bg-gray-50 rounded-xl border p-4 text-gray-900 transition-colors group relative">
          <div className="flex items-center justify-between mb-1">
            <Users2 className="h-5 w-5 text-gray-500" />
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="font-semibold text-sm mt-2">Guests</div>
          <div className="text-xs text-gray-500">
            {guestHouseholdCount > 0 ? `${guestHouseholdCount} households` : 'Manage guest list'}
          </div>
        </Link>
      </div>
```

- [ ] **Step 5: Add sub-events section above the checklist (after the action cards)**

```tsx
      {/* Sub-events */}
      {event.sub_events.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Sub-Events</h2>
            <Link href={`/events/${id}/sub-events`} className="text-sm text-orange-600 hover:underline">
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {event.sub_events.map(se => (
              <div key={se.id} className="bg-white rounded-xl border p-4">
                <p className="font-semibold text-gray-900 text-sm">{se.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(se.event_date, 'EEE d MMM, h:mm a')}
                </p>
                {se.venue && <p className="text-xs text-gray-400 mt-0.5 truncate">{se.venue}</p>}
              </div>
            ))}
            <Link href={`/events/${id}/sub-events`}
              className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-colors">
              <CalendarPlus className="h-4 w-4" />
              Add occasion
            </Link>
          </div>
        </div>
      )}

      {event.sub_events.length === 0 && (
        <div className="mb-4">
          <Link href={`/events/${id}/sub-events`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors px-1">
            <CalendarPlus className="h-4 w-4" />
            Add sub-events (Mehendi, Reception, Puja…)
          </Link>
        </div>
      )}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(customer\)/events/
git commit -m "feat: event dashboard shows sub-events and guests card"
```

---

## Task 6: Guest Household API

**Files:**
- Create: `src/app/api/events/[id]/guests/route.ts`
- Create: `src/app/api/events/[id]/guests/[householdId]/route.ts`

- [ ] **Step 1: Create `src/app/api/events/[id]/guests/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  label: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  sub_event_ids: z.array(z.string()).min(1, 'Select at least one sub-event'),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, customer_id: session.user!.id as string } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const households = await prisma.guestHousehold.findMany({
    where: { event_id: id },
    include: {
      invites: {
        include: {
          sub_event: { select: { id: true, name: true, event_date: true } },
          attendees: true,
        },
      },
    },
    orderBy: { created_at: 'asc' },
  })
  return NextResponse.json(households)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, customer_id: session.user!.id as string } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { sub_event_ids, email, ...rest } = parsed.data

  // Verify sub-events belong to this event
  const subEvents = await prisma.subEvent.findMany({
    where: { id: { in: sub_event_ids }, event_id: id },
  })
  if (subEvents.length !== sub_event_ids.length) {
    return NextResponse.json({ error: 'Invalid sub-event IDs' }, { status: 400 })
  }

  const household = await prisma.guestHousehold.create({
    data: {
      event_id: id,
      ...rest,
      email: email || null,
      invites: {
        create: sub_event_ids.map(sub_event_id => ({ sub_event_id })),
      },
    },
    include: {
      invites: {
        include: {
          sub_event: { select: { id: true, name: true, event_date: true } },
          attendees: true,
        },
      },
    },
  })
  return NextResponse.json(household, { status: 201 })
}
```

- [ ] **Step 2: Create `src/app/api/events/[id]/guests/[householdId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  declined: z.boolean().optional(),
})

async function getAuthedHousehold(householdId: string, eventId: string, customerId: string) {
  return prisma.guestHousehold.findFirst({
    where: { id: householdId, event_id: eventId, event: { customer_id: customerId } },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; householdId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, householdId } = await params
  const existing = await getAuthedHousehold(householdId, id, session.user!.id as string)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.guestHousehold.update({ where: { id: householdId }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; householdId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, householdId } = await params
  const existing = await getAuthedHousehold(householdId, id, session.user!.id as string)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.guestHousehold.delete({ where: { id: householdId } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/events/
git commit -m "feat: guest household CRUD API"
```

---

## Task 7: Invite Image & Message API

**Files:**
- Create: `src/app/api/events/[id]/invite/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cloudinary } from '@/lib/cloudinary'
import { z } from 'zod'

const updateSchema = z.object({
  invite_message: z.string().max(500).nullable().optional(),
  invite_image_data_url: z.string().optional(), // base64 data URL from client
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, customer_id: session.user!.id as string } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { invite_image_data_url, invite_message } = parsed.data
  let invite_image_url = undefined

  if (invite_image_data_url) {
    const result = await cloudinary.uploader.upload(invite_image_data_url, {
      folder: 'invite-images',
      resource_type: 'image',
    })
    invite_image_url = result.secure_url
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...(invite_message !== undefined ? { invite_message } : {}),
      ...(invite_image_url !== undefined ? { invite_image_url } : {}),
    },
  })
  return NextResponse.json({ invite_image_url: updated.invite_image_url, invite_message: updated.invite_message })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/events/
git commit -m "feat: invite image and message API"
```

---

## Task 8: Invite Email Template + Send API

**Files:**
- Create: `src/lib/notifications/templates/invite-email.tsx`
- Create: `src/app/api/events/[id]/guests/[householdId]/send-invite/route.ts`

- [ ] **Step 1: Create the email template**

```tsx
// src/lib/notifications/templates/invite-email.tsx
import * as React from 'react'

type SubEventInfo = { name: string; date: string; venue: string | null }

type Props = {
  householdLabel: string
  eventName: string
  inviteMessage: string | null
  inviteImageUrl: string | null
  subEvents: SubEventInfo[]
  rsvpUrl: string
}

export function InviteEmail({ householdLabel, eventName, inviteMessage, inviteImageUrl, subEvents, rsvpUrl }: Props) {
  return (
    <html>
      <body style={{ fontFamily: 'sans-serif', color: '#111', maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        {inviteImageUrl && (
          <img src={inviteImageUrl} alt="Invitation" style={{ width: '100%', borderRadius: 12, marginBottom: 24 }} />
        )}
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>You're invited!</h2>
        <p style={{ fontSize: 16, color: '#444', marginBottom: 8 }}>Hi {householdLabel},</p>
        {inviteMessage && (
          <p style={{ fontSize: 15, color: '#444', marginBottom: 16, fontStyle: 'italic' }}>"{inviteMessage}"</p>
        )}
        <p style={{ fontSize: 15, marginBottom: 8 }}>You're invited to <strong>{eventName}</strong>:</p>
        <ul style={{ paddingLeft: 20, marginBottom: 24 }}>
          {subEvents.map((se, i) => (
            <li key={i} style={{ fontSize: 14, color: '#555', marginBottom: 4 }}>
              <strong>{se.name}</strong> — {se.date}{se.venue ? ` · ${se.venue}` : ''}
            </li>
          ))}
        </ul>
        <a href={rsvpUrl}
          style={{ display: 'inline-block', background: '#ea580c', color: '#fff', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
          Open Invitation & RSVP →
        </a>
        <p style={{ fontSize: 12, color: '#999', marginTop: 32 }}>
          Powered by <a href="https://oneseva.com" style={{ color: '#ea580c' }}>OneSeva</a>
        </p>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create the send-invite route**

```typescript
// src/app/api/events/[id]/guests/[householdId]/send-invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { InviteEmail } from '@/lib/notifications/templates/invite-email'
import { renderAsync } from '@react-email/render'
import { format } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oneseva.com'
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hello@oneseva.com'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; householdId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, householdId } = await params

  const household = await prisma.guestHousehold.findFirst({
    where: { id: householdId, event_id: id, event: { customer_id: session.user!.id as string } },
    include: {
      event: true,
      invites: { include: { sub_event: true } },
    },
  })
  if (!household) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!household.email) return NextResponse.json({ error: 'No email address for this household' }, { status: 400 })

  const rsvpUrl = `${APP_URL}/e/${household.token}`
  const subEvents = household.invites.map(inv => ({
    name: inv.sub_event.name,
    date: format(inv.sub_event.event_date, 'EEE d MMM yyyy, h:mm a'),
    venue: inv.sub_event.venue,
  }))

  const html = await renderAsync(
    InviteEmail({
      householdLabel: household.label,
      eventName: household.event.event_name,
      inviteMessage: household.event.invite_message,
      inviteImageUrl: household.event.invite_image_url,
      subEvents,
      rsvpUrl,
    }) as React.ReactElement
  )

  const { error } = await resend.emails.send({
    from: FROM,
    to: household.email,
    subject: `You're invited to ${household.event.event_name}`,
    html,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sent: true })
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/notifications/templates/ src/app/api/events/
git commit -m "feat: invite email template and send API"
```

---

## Task 9: Public RSVP API

**Files:**
- Create: `src/app/api/rsvp/[token]/route.ts`
- Create: `src/app/api/rsvp/[token]/[inviteId]/route.ts`

- [ ] **Step 1: Create `src/app/api/rsvp/[token]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const household = await prisma.guestHousehold.findUnique({
    where: { token },
    include: {
      event: {
        select: {
          event_name: true,
          city: true,
          venue: true,
          invite_image_url: true,
          invite_message: true,
        },
      },
      invites: {
        include: {
          sub_event: {
            select: { id: true, name: true, event_date: true, venue: true },
          },
          attendees: true,
        },
        orderBy: { sub_event: { event_date: 'asc' } },
      },
    },
  })

  if (!household) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  return NextResponse.json({
    household: {
      id: household.id,
      label: household.label,
      declined: household.declined,
    },
    event: household.event,
    invites: household.invites.map(inv => ({
      id: inv.id,
      sub_event: inv.sub_event,
      responded_at: inv.responded_at,
      attendees: inv.attendees,
    })),
  })
}
```

- [ ] **Step 2: Create `src/app/api/rsvp/[token]/[inviteId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { GuestDietaryType } from '@prisma/client'

const attendeeSchema = z.object({
  name: z.string().optional(),
  dietary_type: z.nativeEnum(GuestDietaryType).default('NON_VEG'),
  allergens: z.array(z.string()).default([]),
})

const submitSchema = z.object({
  attendees: z.array(attendeeSchema).min(1).max(20),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; inviteId: string }> }
) {
  const { token, inviteId } = await params

  // Verify token matches the invite
  const invite = await prisma.guestSubEventInvite.findFirst({
    where: {
      id: inviteId,
      household: { token },
    },
    include: { sub_event: { select: { event_date: true } } },
  })
  if (!invite) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  // Block RSVP if event has passed
  if (invite.sub_event.event_date < new Date()) {
    return NextResponse.json({ error: 'This event has already taken place' }, { status: 410 })
  }

  const body = await req.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  // Replace existing attendees (allows re-submission / editing)
  await prisma.$transaction([
    prisma.guestAttendee.deleteMany({ where: { invite_id: inviteId } }),
    prisma.guestAttendee.createMany({
      data: parsed.data.attendees.map(a => ({ ...a, invite_id: inviteId })),
    }),
    prisma.guestSubEventInvite.update({
      where: { id: inviteId },
      data: { responded_at: new Date() },
    }),
  ])

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/rsvp/
git commit -m "feat: public RSVP API routes"
```

---

## Task 10: Public RSVP Page `/e/[token]`

**Files:**
- Create: `src/app/e/[token]/page.tsx`

Note: This page is outside the `(customer)` route group — it uses no layout auth wrapper. It must work without authentication.

- [ ] **Step 1: Create the page**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'

type Attendee = { name?: string; dietary_type: string; allergens: string[] }
type SubEvent = { id: string; name: string; event_date: string; venue: string | null }
type Invite = { id: string; sub_event: SubEvent; responded_at: string | null; attendees: Attendee[] }
type RSVPData = {
  household: { id: string; label: string; declined: boolean }
  event: { event_name: string; city: string; venue: string | null; invite_image_url: string | null; invite_message: string | null }
  invites: Invite[]
}

const DIETARY_OPTIONS = [
  { value: 'NON_VEG',    label: 'Non-Veg',    color: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'VEGETARIAN', label: 'Vegetarian', color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'VEGAN',      label: 'Vegan',      color: 'border-teal-400 bg-teal-50 text-teal-700' },
  { value: 'JAIN',       label: 'Jain',       color: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'HALAL',      label: 'Halal',      color: 'border-purple-400 bg-purple-50 text-purple-700' },
]

const ALLERGENS = [
  { key: 'nut_free', label: '🥜 Nut-free' },
  { key: 'gluten_free', label: '🌾 Gluten-free' },
  { key: 'dairy_free', label: '🥛 Dairy-free' },
  { key: 'egg_free', label: '🥚 Egg-free' },
]

function AttendeeRow({ index, value, onChange }: {
  index: number
  value: Attendee
  onChange: (a: Attendee) => void
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase">Person {index + 1}</p>
      <input
        type="text"
        placeholder="Name (optional)"
        value={value.name ?? ''}
        onChange={e => onChange({ ...value, name: e.target.value })}
        className="w-full text-sm border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <div className="flex flex-wrap gap-1.5">
        {DIETARY_OPTIONS.map(opt => (
          <button key={opt.value} type="button"
            onClick={() => onChange({ ...value, dietary_type: opt.value })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              value.dietary_type === opt.value ? opt.color + ' font-medium' : 'border-gray-200 text-gray-600'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALLERGENS.map(a => (
          <button key={a.key} type="button"
            onClick={() => {
              const allergens = value.allergens.includes(a.key)
                ? value.allergens.filter(x => x !== a.key)
                : [...value.allergens, a.key]
              onChange({ ...value, allergens })
            }}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              value.allergens.includes(a.key) ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600'
            }`}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function InviteSection({ invite, householdLabel }: { invite: Invite; householdLabel: string }) {
  const alreadyResponded = !!invite.responded_at
  const isPast = new Date(invite.sub_event.event_date) < new Date()
  const [count, setCount] = useState(alreadyResponded ? invite.attendees.length : 1)
  const [attendees, setAttendees] = useState<Attendee[]>(
    alreadyResponded
      ? invite.attendees
      : [{ dietary_type: 'NON_VEG', allergens: [] }]
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(alreadyResponded)
  const [editing, setEditing] = useState(false)

  function updateCount(n: number) {
    const clamped = Math.max(1, Math.min(20, n))
    setCount(clamped)
    setAttendees(prev => {
      if (clamped > prev.length) {
        return [...prev, ...Array(clamped - prev.length).fill({ dietary_type: 'NON_VEG', allergens: [] })]
      }
      return prev.slice(0, clamped)
    })
  }

  async function submit() {
    setSubmitting(true)
    const res = await fetch(`/api/rsvp/${window.location.pathname.split('/')[2]}/${invite.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendees }),
    })
    if (res.ok) { setSubmitted(true); setEditing(false) }
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{invite.sub_event.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(invite.sub_event.event_date), 'EEEE, d MMMM yyyy · h:mm a')}
          {invite.sub_event.venue && ` · ${invite.sub_event.venue}`}
        </p>
      </div>

      {isPast ? (
        <p className="text-sm text-gray-400">This occasion has already taken place.</p>
      ) : submitted && !editing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-xl px-4 py-3 text-sm font-medium">
            <span>✓</span> Confirmed — {attendees.length} {attendees.length === 1 ? 'person' : 'people'}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {attendees.map((a, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                {a.name || `Person ${i + 1}`} · {DIETARY_OPTIONS.find(d => d.value === a.dietary_type)?.label}
                {a.allergens.length > 0 && ` · ${a.allergens.join(', ')}`}
              </span>
            ))}
          </div>
          <button onClick={() => setEditing(true)} className="text-sm text-orange-600 hover:underline">
            Edit response
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              How many in your party are attending?
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => updateCount(count - 1)}
                className="w-8 h-8 rounded-full border text-gray-600 hover:bg-gray-100 font-medium text-lg leading-none">−</button>
              <span className="text-xl font-bold text-gray-900 w-6 text-center">{count}</span>
              <button onClick={() => updateCount(count + 1)}
                className="w-8 h-8 rounded-full border text-gray-600 hover:bg-gray-100 font-medium text-lg leading-none">+</button>
            </div>
          </div>

          <div className="space-y-3">
            {attendees.map((a, i) => (
              <AttendeeRow key={i} index={i} value={a} onChange={updated => {
                setAttendees(prev => prev.map((x, idx) => idx === i ? updated : x))
              }} />
            ))}
          </div>

          <button onClick={submit} disabled={submitting}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
            {submitting ? 'Confirming…' : `Confirm for ${invite.sub_event.name} →`}
          </button>
          {editing && (
            <button onClick={() => setEditing(false)} className="w-full text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function RSVPPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<RSVPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/rsvp/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-1">Link not found</p>
          <p className="text-sm text-gray-500">This invitation link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  const { household, event, invites } = data!

  if (household.declined) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-1">You're marked as unable to attend</p>
          <p className="text-sm text-gray-500">If this is a mistake, please contact the event organiser.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Hero */}
        <div className="bg-white rounded-2xl overflow-hidden border">
          {event.invite_image_url && (
            <div className="relative w-full h-56">
              <Image src={event.invite_image_url} alt="Invitation" fill className="object-cover" />
            </div>
          )}
          <div className="p-5">
            <h1 className="text-2xl font-bold text-gray-900">{event.event_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {event.city}{event.venue ? ` · ${event.venue}` : ''}
            </p>
            {event.invite_message && (
              <p className="text-sm text-gray-600 mt-3 italic border-l-2 border-orange-300 pl-3">
                "{event.invite_message}"
              </p>
            )}
          </div>
        </div>

        {/* Per sub-event RSVP */}
        {invites.map(invite => (
          <InviteSection key={invite.id} invite={invite} householdLabel={household.label} />
        ))}

        {/* Marketing footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-gray-400">
            Planning your own event?{' '}
            <Link href="/" className="text-orange-600 hover:underline">Find vendors on OneSeva →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Test in browser**

Start dev server: `npm run dev` (port 3002)

Create a test household via curl:
```bash
# First get an event ID from the DB, then:
curl -X GET http://localhost:3002/api/rsvp/SOME_TOKEN
```
Expected: JSON with event, household, invites.

- [ ] **Step 4: Commit**

```bash
git add src/app/e/
git commit -m "feat: public RSVP page /e/[token]"
```

---

## Task 11: Guest Management Page

**Files:**
- Create: `src/app/(customer)/events/[id]/guests/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ChevronRight, Plus, Mail, Link2, Trash2, UserX, Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Attendee = { dietary_type: string; allergens: string[] }
type SubEvent = { id: string; name: string; event_date: string }
type Invite = { id: string; sub_event: SubEvent; responded_at: string | null; attendees: Attendee[] }
type Household = {
  id: string; label: string; email: string | null; token: string
  declined: boolean; invites: Invite[]
}

function dietaryBreakdown(attendees: Attendee[]) {
  const counts: Record<string, number> = {}
  const allergenCounts: Record<string, number> = {}
  for (const a of attendees) {
    counts[a.dietary_type] = (counts[a.dietary_type] ?? 0) + 1
    for (const al of a.allergens) allergenCounts[al] = (allergenCounts[al] ?? 0) + 1
  }
  return { counts, allergenCounts, total: attendees.length }
}

export default function GuestsPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [households, setHouseholds] = useState<Household[]>([])
  const [subEvents, setSubEvents] = useState<SubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: '', email: '', sub_event_ids: [] as string[] })
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [appUrl, setAppUrl] = useState('')

  useEffect(() => {
    setAppUrl(window.location.origin)
    Promise.all([
      fetch(`/api/events/${eventId}/guests`).then(r => r.json()),
      fetch(`/api/events/${eventId}/sub-events`).then(r => r.json()),
    ]).then(([h, s]) => { setHouseholds(h); setSubEvents(s) }).finally(() => setLoading(false))
  }, [eventId])

  async function addHousehold() {
    setSaving(true)
    const res = await fetch(`/api/events/${eventId}/guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, email: form.email || undefined }),
    })
    if (res.ok) {
      const h = await res.json()
      setHouseholds(prev => [...prev, h])
      setForm({ label: '', email: '', sub_event_ids: [] })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function sendInvite(householdId: string) {
    setSendingId(householdId)
    await fetch(`/api/events/${eventId}/guests/${householdId}/send-invite`, { method: 'POST' })
    setSendingId(null)
  }

  function copyLink(token: string, householdId: string) {
    navigator.clipboard.writeText(`${appUrl}/e/${token}`)
    setCopiedId(householdId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function markDeclined(householdId: string) {
    await fetch(`/api/events/${eventId}/guests/${householdId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ declined: true }),
    })
    setHouseholds(prev => prev.map(h => h.id === householdId ? { ...h, declined: true } : h))
  }

  async function remove(householdId: string) {
    if (!confirm('Remove this household from the guest list?')) return
    await fetch(`/api/events/${eventId}/guests/${householdId}`, { method: 'DELETE' })
    setHouseholds(prev => prev.filter(h => h.id !== householdId))
  }

  // Aggregate dietary stats per sub-event
  const subEventStats = subEvents.map(se => {
    const allAttendees = households.flatMap(h =>
      h.invites.filter(inv => inv.sub_event.id === se.id).flatMap(inv => inv.attendees)
    )
    return { se, ...dietaryBreakdown(allAttendees) }
  })

  const totalHouseholds = households.length
  const responded = households.filter(h => h.invites.some(i => i.responded_at)).length
  const pending = households.filter(h => !h.declined && !h.invites.some(i => i.responded_at)).length
  const declined = households.filter(h => h.declined).length

  const LABEL_MAP: Record<string, string> = {
    NON_VEG: 'Non-veg', VEGETARIAN: 'Veg', VEGAN: 'Vegan', JAIN: 'Jain', HALAL: 'Halal'
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/dashboard" className="hover:text-orange-600">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}`} className="hover:text-orange-600">Event</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-700">Guests</span>
      </div>

      {/* Stats bar */}
      <div className="bg-white rounded-xl border p-4 mb-5 flex flex-wrap gap-6">
        {[
          { label: 'Invited', value: totalHouseholds, color: 'text-gray-900' },
          { label: 'Responded', value: responded, color: 'text-green-700' },
          { label: 'Pending', value: pending, color: 'text-amber-700' },
          { label: 'Declined', value: declined, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per sub-event dietary breakdown */}
      {subEventStats.filter(s => s.total > 0).map(({ se, counts, allergenCounts, total }) => (
        <div key={se.id} className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-orange-900">{se.name} — {total} confirmed</p>
            <button
              onClick={async () => {
                await fetch(`/api/events/${eventId}/guests/apply-dietary`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sub_event_id: se.id }),
                })
              }}
              className="text-xs text-orange-700 border border-orange-300 px-2.5 py-1 rounded-full hover:bg-orange-100 transition-colors"
            >
              Apply to catering prefs
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {Object.entries(counts).map(([type, n]) => (
              <span key={type} className="bg-white border rounded-full px-2.5 py-1 text-gray-700">
                {n} {LABEL_MAP[type] ?? type}
              </span>
            ))}
            {Object.entries(allergenCounts).map(([a, n]) => (
              <span key={a} className="bg-white border rounded-full px-2.5 py-1 text-gray-500">
                {n} {a.replace('_', '-')}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Add household form */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">Guest List</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add household
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Household name *</label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Sharma Family" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email (optional)</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
          </div>
          {subEvents.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Invite to *</label>
              <div className="flex flex-wrap gap-2">
                {subEvents.map(se => {
                  const selected = form.sub_event_ids.includes(se.id)
                  return (
                    <button key={se.id} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        sub_event_ids: selected ? f.sub_event_ids.filter(x => x !== se.id) : [...f.sub_event_ids, se.id]
                      }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selected ? 'border-orange-500 bg-orange-50 text-orange-800 font-medium' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {se.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={addHousehold}
              disabled={saving || !form.label || (subEvents.length > 0 && form.sub_event_ids.length === 0)}
              className="bg-orange-600 hover:bg-orange-700">
              {saving ? 'Adding…' : 'Add household'}
            </Button>
          </div>
        </div>
      )}

      {/* Household list */}
      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : households.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-gray-400">
          <p>No guests added yet. Add your first household above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y overflow-hidden">
          {households.map(h => {
            const responded = h.invites.some(i => i.responded_at)
            const totalAttendees = h.invites.reduce((sum, i) => sum + i.attendees.length, 0)
            return (
              <div key={h.id} className={`px-4 py-3 flex items-center gap-3 ${h.declined ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{h.label}</span>
                    {h.declined ? (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Declined</span>
                    ) : responded ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        ✓ {totalAttendees} {totalAttendees === 1 ? 'person' : 'people'}
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {h.email && <span className="text-xs text-gray-400">{h.email}</span>}
                    <span className="text-xs text-gray-400">
                      {h.invites.map(i => i.sub_event.name).join(' · ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {h.email && (
                    <button onClick={() => sendInvite(h.id)} disabled={sendingId === h.id}
                      title="Send invite email"
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-40">
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => copyLink(h.token, h.id)}
                    title="Copy RSVP link"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    {copiedId === h.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Link2 className="h-3.5 w-3.5" />}
                  </button>
                  {!h.declined && (
                    <button onClick={() => markDeclined(h.id)}
                      title="Mark as declined"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => remove(h.id)}
                    title="Remove"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(customer\)/events/
git commit -m "feat: guest management page"
```

---

## Task 12: Dietary Aggregation API

**Files:**
- Create: `src/app/api/events/[id]/guests/apply-dietary/route.ts`

- [ ] **Step 1: Create the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MenuMode } from '@prisma/client'
import { z } from 'zod'
import { runMatchJob } from '@/lib/jobs/match'

const schema = z.object({ sub_event_id: z.string() })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const event = await prisma.event.findFirst({ where: { id, customer_id: session.user!.id as string } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { sub_event_id } = parsed.data

  // Aggregate all attendees for this sub-event
  const attendees = await prisma.guestAttendee.findMany({
    where: { invite: { sub_event_id } },
  })

  if (attendees.length === 0) {
    return NextResponse.json({ message: 'No confirmed attendees yet' })
  }

  const dietaryCounts: Record<string, number> = {}
  const allergenCounts: Record<string, number> = {}
  for (const a of attendees) {
    dietaryCounts[a.dietary_type] = (dietaryCounts[a.dietary_type] ?? 0) + 1
    for (const al of a.allergens) allergenCounts[al] = (allergenCounts[al] ?? 0) + 1
  }

  const is_vegetarian = (dietaryCounts['VEGETARIAN'] ?? 0) + (dietaryCounts['VEGAN'] ?? 0) > 0
  const is_vegan = (dietaryCounts['VEGAN'] ?? 0) > 0
  const is_jain = (dietaryCounts['JAIN'] ?? 0) > 0
  const is_halal = (dietaryCounts['HALAL'] ?? 0) > 0
  const nut_free = (allergenCounts['nut_free'] ?? 0) > 0
  const gluten_free = (allergenCounts['gluten_free'] ?? 0) > 0
  const dairy_free = (allergenCounts['dairy_free'] ?? 0) > 0

  const dietaryNote = Object.entries(dietaryCounts)
    .map(([type, n]) => `${n} ${type.toLowerCase().replace('_', '-')}`)
    .join(', ')

  // Find CATERER EventRequest for this sub-event (or parent event)
  const caterRequest = await prisma.eventRequest.findFirst({
    where: {
      event_id: id,
      vendor_type: 'CATERER',
      sub_event_id: sub_event_id,
      status: { in: ['OPEN', 'MATCHED'] },
    },
  })

  if (caterRequest) {
    await prisma.eventMenuPreference.upsert({
      where: { caterer_request_id: caterRequest.id },
      update: {
        is_vegetarian, is_vegan, is_jain, is_halal, nut_free, gluten_free, dairy_free,
        special_notes: `Guest dietary breakdown (${attendees.length} confirmed): ${dietaryNote}`,
      },
      create: {
        event_id: id,
        caterer_request_id: caterRequest.id,
        menu_mode: 'CATERER_PROPOSES' as MenuMode,
        is_vegetarian, is_vegan, is_jain, is_halal, nut_free, gluten_free, dairy_free,
        special_notes: `Guest dietary breakdown (${attendees.length} confirmed): ${dietaryNote}`,
      },
    })
    // Re-run matching to update vendor rankings
    runMatchJob({ eventRequestId: caterRequest.id }).catch(() => {})
  }

  return NextResponse.json({ applied: true, attendees: attendees.length, dietaryCounts, allergenCounts })
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/events/
git commit -m "feat: dietary aggregation applies guest data to catering prefs"
```

---

## Task 13: Update Vendors Page — Sub-Event Scoping

**Files:**
- Modify: `src/app/(customer)/events/[id]/vendors/page.tsx`

- [ ] **Step 1: Add sub-event selector to the sidebar**

Add these state variables to the `VendorDiscoveryPage` component after the existing state declarations:

```typescript
  const [subEvents, setSubEvents] = useState<{ id: string; name: string }[]>([])
  const [activeSubEventId, setActiveSubEventId] = useState<string | null>(null)
```

- [ ] **Step 2: Load sub-events on mount**

Add to the `useEffect`:

```typescript
  useEffect(() => {
    fetch(`/api/events/${eventId}/sub-events`)
      .then(r => r.ok ? r.json() : [])
      .then(setSubEvents)
    loadMatches()
  }, [eventId])
```

- [ ] **Step 3: Pass sub_event_id to matches API call**

Update the fetch in `loadMatches`:

```typescript
    const url = activeSubEventId
      ? `/api/matches?eventId=${eventId}&subEventId=${activeSubEventId}`
      : `/api/matches?eventId=${eventId}`
    const res = await fetch(url)
```

- [ ] **Step 4: Add sub-event tabs above the vendor type sidebar**

Add this block just before the existing `<div className="w-52 flex-shrink-0 space-y-2">`:

```tsx
          {/* Sub-event filter */}
          {subEvents.length > 1 && (
            <div className="mb-4 flex gap-1.5 flex-wrap">
              <button
                onClick={() => { setActiveSubEventId(null); loadMatches() }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  activeSubEventId === null
                    ? 'border-orange-500 bg-orange-50 text-orange-800 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                All
              </button>
              {subEvents.map(se => (
                <button key={se.id}
                  onClick={() => { setActiveSubEventId(se.id); loadMatches() }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    activeSubEventId === se.id
                      ? 'border-orange-500 bg-orange-50 text-orange-800 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {se.name}
                </button>
              ))}
            </div>
          )}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(customer\)/events/
git commit -m "feat: vendors page sub-event filter tabs"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| SubEvent model | Task 1 |
| GuestHousehold, GuestSubEventInvite, GuestAttendee models | Task 1 |
| Event invite_image_url + invite_message | Task 1 |
| EventChecklistItem + EventRequest sub_event_id | Task 1 |
| Sub-event CRUD API | Tasks 2, 3 |
| Sub-event management page | Task 4 |
| Event dashboard sub-event cards + guests card | Task 5 |
| Guest household CRUD API | Task 6 |
| Invite image upload API | Task 7 |
| Invite email template + send | Task 8 |
| Public RSVP API (GET + POST per invite) | Task 9 |
| Public RSVP page /e/[token] | Task 10 |
| Guest management page | Task 11 |
| Dietary aggregation → catering prefs | Task 12 |
| Vendors page sub-event scoping | Task 13 |
| Marketing footer on RSVP page | Task 10 (InviteSection footer) |
| WhatsApp/SMS out of scope (future paid) | Not implemented ✓ |
| noindex on RSVP page | Missing — add `export const metadata = { robots: 'noindex' }` at top of Task 10 file |

**Fix: Add noindex to RSVP page** — at the top of `src/app/e/[token]/page.tsx` add before the `'use client'` directive (in a separate server metadata export — but since page is client component, use a `layout.tsx` instead):

Create `src/app/e/[token]/layout.tsx`:

```typescript
export const metadata = { robots: { index: false, follow: false } }
export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
```

Add this as an additional step to Task 10.
