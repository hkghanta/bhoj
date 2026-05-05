# Business Operating Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let vendors define their regular weekly operating schedule and special closure/opening days, displayed on their public profile and used as a soft signal in matching.

**Architecture:** Two new Prisma models: `VendorOperatingSchedule` (7 rows per vendor, one per day of week) and `VendorSpecialDay` (per-date exceptions). Vendor settings page gets a new Schedule tab. Public profile shows "Typically open Mon–Sat 10:00–22:00". Matching algorithm uses schedule as soft signal (closed days → -5 score penalty, not exclusion).

**Tech Stack:** Next.js App Router, Prisma/PostgreSQL, existing auth patterns

---

### Task 1: Schema — VendorOperatingSchedule + VendorSpecialDay

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add models to schema**

Add after the `VendorAvailability` model (~line 499):

```prisma
model VendorOperatingSchedule {
  id         String  @id @default(cuid())
  vendor_id  String
  day_of_week String  // MON TUE WED THU FRI SAT SUN
  is_open    Boolean @default(true)
  opens_at   String? // "09:00"
  closes_at  String? // "22:00"
  notes      String?
  vendor     Vendor  @relation(fields: [vendor_id], references: [id], onDelete: Cascade)

  @@unique([vendor_id, day_of_week])
}

model VendorSpecialDay {
  id         String   @id @default(cuid())
  vendor_id  String
  date       DateTime @db.Date
  is_open    Boolean  @default(false)
  opens_at   String?
  closes_at  String?
  reason     String?
  created_at DateTime @default(now())
  vendor     Vendor   @relation(fields: [vendor_id], references: [id], onDelete: Cascade)

  @@unique([vendor_id, date])
}
```

Also add to Vendor model relations:
```prisma
  operating_schedule VendorOperatingSchedule[]
  special_days       VendorSpecialDay[]
```

- [ ] **Step 2: Push schema**

```bash
cd /home/hareesh/projects/oneseva && pnpm prisma db push
```

Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add VendorOperatingSchedule and VendorSpecialDay models"
```

---

### Task 2: API — operating schedule CRUD

**Files:**
- Create: `src/app/api/vendor/schedule/route.ts`
- Create: `src/app/api/vendor/special-days/route.ts`
- Create: `src/app/api/vendor/special-days/[id]/route.ts`

- [ ] **Step 1: Create schedule GET/PUT route**

```typescript
// src/app/api/vendor/schedule/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const DEFAULT_SCHEDULE = DAYS.map(day => ({
  day_of_week: day,
  is_open: day !== 'SUN',
  opens_at: '09:00',
  closes_at: '22:00',
  notes: null,
}))

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendorId = session.user!.id as string
  const rows = await prisma.vendorOperatingSchedule.findMany({
    where: { vendor_id: vendorId },
    orderBy: { day_of_week: 'asc' },
  })

  // If no schedule set yet, return defaults (not saved)
  if (rows.length === 0) return NextResponse.json(DEFAULT_SCHEDULE)
  return NextResponse.json(rows)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendorId = session.user!.id as string
  const days: Array<{ day_of_week: string; is_open: boolean; opens_at?: string; closes_at?: string; notes?: string }> = await req.json()

  // Upsert all 7 rows
  const results = await Promise.all(
    days.map(day =>
      prisma.vendorOperatingSchedule.upsert({
        where: { vendor_id_day_of_week: { vendor_id: vendorId, day_of_week: day.day_of_week } },
        create: { vendor_id: vendorId, ...day },
        update: { is_open: day.is_open, opens_at: day.opens_at ?? null, closes_at: day.closes_at ?? null, notes: day.notes ?? null },
      })
    )
  )

  return NextResponse.json(results)
}
```

- [ ] **Step 2: Create special days routes**

```typescript
// src/app/api/vendor/special-days/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = await prisma.vendorSpecialDay.findMany({
    where: { vendor_id: session.user!.id as string },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(days)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const day = await prisma.vendorSpecialDay.create({
    data: {
      vendor_id: session.user!.id as string,
      date: new Date(body.date),
      is_open: body.is_open ?? false,
      opens_at: body.opens_at ?? null,
      closes_at: body.closes_at ?? null,
      reason: body.reason ?? null,
    },
  })
  return NextResponse.json(day, { status: 201 })
}
```

```typescript
// src/app/api/vendor/special-days/[id]/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.vendorSpecialDay.deleteMany({
    where: { id, vendor_id: session.user!.id as string },
  })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/vendor/schedule/ src/app/api/vendor/special-days/
git commit -m "feat: vendor operating schedule and special days API"
```

---

### Task 3: Public vendor profile API — include schedule

**Files:**
- Modify: `src/app/api/vendors/[id]/route.ts` (or wherever vendor public profile is loaded)

- [ ] **Step 1: Add schedule to public profile query**

In the vendor public profile endpoint, add to the Prisma include:
```typescript
operating_schedule: {
  orderBy: { day_of_week: 'asc' },
},
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/vendors/
git commit -m "feat: include operating schedule in public vendor profile"
```

---

### Task 4: Vendor settings — Schedule tab UI

**Files:**
- Create: `src/app/(vendor)/vendor/schedule/page.tsx`
- Modify: vendor nav to add Schedule link

- [ ] **Step 1: Create schedule settings page**

```typescript
// src/app/(vendor)/vendor/schedule/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'

const DAYS = [
  { key: 'MON', label: 'Monday' },
  { key: 'TUE', label: 'Tuesday' },
  { key: 'WED', label: 'Wednesday' },
  { key: 'THU', label: 'Thursday' },
  { key: 'FRI', label: 'Friday' },
  { key: 'SAT', label: 'Saturday' },
  { key: 'SUN', label: 'Sunday' },
]

type DayRow = { day_of_week: string; is_open: boolean; opens_at: string; closes_at: string; notes: string }
type SpecialDay = { id: string; date: string; is_open: boolean; opens_at: string | null; closes_at: string | null; reason: string | null }

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DayRow[]>(
    DAYS.map(d => ({ day_of_week: d.key, is_open: d.key !== 'SUN', opens_at: '09:00', closes_at: '22:00', notes: '' }))
  )
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newSpecial, setNewSpecial] = useState({ date: '', is_open: false, opens_at: '', closes_at: '', reason: '' })
  const [showSpecialForm, setShowSpecialForm] = useState(false)

  useEffect(() => {
    fetch('/api/vendor/schedule').then(r => r.json()).then((rows: DayRow[]) => {
      // Map by day_of_week to preserve order
      const byDay: Record<string, DayRow> = {}
      rows.forEach(r => { byDay[r.day_of_week] = r })
      setSchedule(DAYS.map(d => byDay[d.key] ?? { day_of_week: d.key, is_open: d.key !== 'SUN', opens_at: '09:00', closes_at: '22:00', notes: '' }))
    })
    fetch('/api/vendor/special-days').then(r => r.json()).then(setSpecialDays)
  }, [])

  function updateDay(key: string, field: keyof DayRow, value: unknown) {
    setSchedule(prev => prev.map(d => d.day_of_week === key ? { ...d, [field]: value } : d))
  }

  async function saveSchedule() {
    setSaving(true)
    await fetch('/api/vendor/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addSpecialDay() {
    if (!newSpecial.date) return
    setSaving(true)
    const res = await fetch('/api/vendor/special-days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSpecial),
    })
    const day = await res.json()
    setSpecialDays(prev => [...prev, day].sort((a, b) => a.date.localeCompare(b.date)))
    setNewSpecial({ date: '', is_open: false, opens_at: '', closes_at: '', reason: '' })
    setShowSpecialForm(false)
    setSaving(false)
  }

  async function deleteSpecialDay(id: string) {
    await fetch(`/api/vendor/special-days/${id}`, { method: 'DELETE' })
    setSpecialDays(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Operating Hours</h1>
        <p className="text-gray-500 text-sm">Your regular weekly schedule. Customers see this on your profile.</p>
      </div>

      {/* Weekly schedule */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b">
          <h3 className="font-medium text-gray-800">Weekly Schedule</h3>
        </div>
        <div className="divide-y">
          {schedule.map(row => {
            const dayLabel = DAYS.find(d => d.key === row.day_of_week)?.label ?? row.day_of_week
            return (
              <div key={row.day_of_week} className="px-5 py-3 flex items-center gap-4">
                <div className="w-28 text-sm font-medium text-gray-700">{dayLabel}</div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={row.is_open}
                    onChange={e => updateDay(row.day_of_week, 'is_open', e.target.checked)}
                    className="rounded"
                  />
                  <span className={row.is_open ? 'text-gray-700' : 'text-gray-400'}>
                    {row.is_open ? 'Open' : 'Closed'}
                  </span>
                </label>
                {row.is_open && (
                  <>
                    <Input
                      type="time"
                      value={row.opens_at}
                      onChange={e => updateDay(row.day_of_week, 'opens_at', e.target.value)}
                      className="h-8 w-32 text-sm"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <Input
                      type="time"
                      value={row.closes_at}
                      onChange={e => updateDay(row.day_of_week, 'closes_at', e.target.value)}
                      className="h-8 w-32 text-sm"
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
        <div className="px-5 py-4 border-t bg-gray-50 flex items-center gap-3">
          <Button onClick={saveSchedule} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Schedule'}
          </Button>
        </div>
      </div>

      {/* Special days */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-medium text-gray-800">Special Days</h3>
          <button
            onClick={() => setShowSpecialForm(v => !v)}
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {showSpecialForm && (
          <div className="px-5 py-4 border-b bg-orange-50 space-y-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Date *</label>
                <Input type="date" value={newSpecial.date} onChange={e => setNewSpecial(f => ({ ...f, date: e.target.value }))} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Reason</label>
                <Input value={newSpecial.reason} onChange={e => setNewSpecial(f => ({ ...f, reason: e.target.value }))} className="h-8 text-sm" placeholder="Eid, Christmas, etc." />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-0.5">
                <input type="checkbox" checked={newSpecial.is_open} onChange={e => setNewSpecial(f => ({ ...f, is_open: e.target.checked }))} className="rounded" />
                Open this day
              </label>
              {newSpecial.is_open && (
                <>
                  <Input type="time" value={newSpecial.opens_at} onChange={e => setNewSpecial(f => ({ ...f, opens_at: e.target.value }))} className="h-8 w-32 text-sm" />
                  <span className="text-gray-400 text-sm mb-0.5">to</span>
                  <Input type="time" value={newSpecial.closes_at} onChange={e => setNewSpecial(f => ({ ...f, closes_at: e.target.value }))} className="h-8 w-32 text-sm" />
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSpecialForm(false)}>Cancel</Button>
              <Button size="sm" onClick={addSpecialDay} disabled={saving || !newSpecial.date} className="bg-orange-600 hover:bg-orange-700">Add</Button>
            </div>
          </div>
        )}

        {specialDays.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-gray-400">No special days added.</div>
        ) : (
          <div className="divide-y">
            {specialDays.map(day => (
              <div key={day.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {day.reason && <span className="ml-2 text-sm text-gray-500">{day.reason}</span>}
                  <span className={`ml-2 text-xs font-medium ${day.is_open ? 'text-green-600' : 'text-red-500'}`}>
                    {day.is_open ? `Open ${day.opens_at ?? ''}–${day.closes_at ?? ''}` : 'Closed'}
                  </span>
                </div>
                <button onClick={() => deleteSpecialDay(day.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Schedule to vendor nav**

In `src/app/(vendor)/vendor/layout.tsx` or wherever vendor nav links are defined, add:
```typescript
{ href: '/vendor/schedule', label: 'Operating Hours' }
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(vendor)/vendor/schedule/ src/app/api/vendor/schedule/ src/app/api/vendor/special-days/
git commit -m "feat: vendor operating hours settings page"
```

---

### Task 5: Public profile — show operating schedule

**Files:**
- Modify: whichever component renders the public vendor profile (e.g. `src/app/(customer)/vendors/[id]/page.tsx` or similar)

- [ ] **Step 1: Add schedule display**

In the public profile component, after the vendor bio/contact section, add:

```typescript
// Helper to format schedule summary
function formatScheduleSummary(schedule: Array<{ day_of_week: string; is_open: boolean; opens_at?: string | null; closes_at?: string | null }>) {
  const DAY_LABELS: Record<string, string> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }
  const openDays = schedule.filter(d => d.is_open)
  if (openDays.length === 0) return 'Currently not accepting bookings'
  if (openDays.length === 7) {
    const { opens_at, closes_at } = openDays[0]
    return `Open daily ${opens_at ?? ''}–${closes_at ?? ''}`
  }
  const dayNames = openDays.map(d => DAY_LABELS[d.day_of_week]).join(', ')
  const { opens_at, closes_at } = openDays[0]
  return `Typically open ${dayNames} ${opens_at ?? ''}–${closes_at ?? ''}`
}
```

Then in JSX:
```tsx
{vendor.operating_schedule && vendor.operating_schedule.length > 0 && (
  <div className="text-sm text-gray-500 flex items-center gap-1.5">
    <Clock className="h-3.5 w-3.5" />
    {formatScheduleSummary(vendor.operating_schedule)}
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/
git commit -m "feat: show operating schedule on public vendor profile"
```
