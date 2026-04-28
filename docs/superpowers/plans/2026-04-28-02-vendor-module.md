# Vendor Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete vendor onboarding flow (7-step wizard), public vendor profile page, and vendor dashboard with full sidebar navigation.

**Architecture:** Onboarding is a multi-step client form stored in React state, with each step submitting independently to `/api/vendor/*` routes. The public profile page is a server component fetching vendor data by slug/id. The vendor dashboard uses a persistent sidebar layout with nested App Router route groups. Cloudinary handles photo uploads via a signed upload endpoint.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma 5, Cloudinary, shadcn/ui, React Hook Form, Zod

---

## File Structure

```
src/
├── app/
│   ├── (vendor)/
│   │   ├── layout.tsx                          # Vendor shell layout (sidebar + topnav)
│   │   ├── vendor/
│   │   │   ├── dashboard/page.tsx              # Dashboard overview (leads count, metrics)
│   │   │   ├── onboarding/
│   │   │   │   └── page.tsx                    # Multi-step onboarding wizard
│   │   │   ├── menu/page.tsx                   # Dish library + menu packages
│   │   │   ├── availability/page.tsx           # Availability calendar
│   │   │   └── photos/page.tsx                 # Photo gallery manager
│   └── vendors/
│       └── [id]/page.tsx                       # Public vendor profile page
├── api/
│   └── vendor/
│       ├── profile/route.ts                    # GET/PUT vendor profile
│       ├── menu-items/route.ts                 # GET/POST menu items
│       ├── menu-items/[id]/route.ts            # PUT/DELETE single menu item
│       ├── menu-packages/route.ts              # GET/POST menu packages
│       ├── menu-packages/[id]/route.ts         # PUT/DELETE single package
│       ├── availability/route.ts               # GET/POST availability
│       ├── photos/route.ts                     # POST photo (Cloudinary upload)
│       ├── photos/[id]/route.ts                # DELETE photo
│       └── upload-signature/route.ts           # GET Cloudinary signed upload params
└── components/
    └── vendor/
        ├── OnboardingWizard.tsx                # Orchestrates all 7 steps
        ├── steps/
        │   ├── Step1BusinessInfo.tsx
        │   ├── Step2Services.tsx
        │   ├── Step3ComplianceDocs.tsx
        │   ├── Step4DishLibrary.tsx
        │   ├── Step5MenuPackages.tsx
        │   ├── Step6Availability.tsx
        │   └── Step7Photos.tsx
        ├── VendorSidebar.tsx
        ├── AvailabilityCalendar.tsx
        └── MenuPackageBuilder.tsx
```

---

### Task 1: Vendor dashboard shell layout with sidebar

**Files:**
- Create: `src/app/(vendor)/layout.tsx`, `src/components/vendor/VendorSidebar.tsx`

- [ ] **Step 1: Install additional shadcn components**

```bash
cd /home/hareesh/projects/bhoj
pnpm dlx shadcn@latest add separator scroll-area avatar progress dialog sheet
```

- [ ] **Step 2: Create VendorSidebar component**

```typescript
// src/components/vendor/VendorSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FileText,
  UtensilsCrossed,
  Calendar,
  Image,
  CreditCard,
  Settings,
  Star,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/leads', label: 'Leads', icon: Users },
  { href: '/vendor/quotes', label: 'Quotes', icon: FileText },
  { href: '/vendor/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/vendor/availability', label: 'Availability', icon: Calendar },
  { href: '/vendor/photos', label: 'Photos', icon: Image },
  { href: '/vendor/messages', label: 'Messages', icon: MessageSquare },
  { href: '/vendor/reviews', label: 'Reviews', icon: Star },
  { href: '/vendor/billing', label: 'Billing', icon: CreditCard },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
]

export function VendorSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-white border-r flex flex-col">
      <div className="px-6 py-5 border-b">
        <Link href="/vendor/dashboard" className="text-xl font-bold text-orange-600">
          Bhoj
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">Vendor Portal</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-orange-50 text-orange-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Create vendor shell layout**

```typescript
// src/app/(vendor)/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VendorSidebar } from '@/components/vendor/VendorSidebar'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user as any).role !== 'vendor') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VendorSidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{session.user?.name}</span>
          </div>
        </header>
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(vendor\)/layout.tsx src/components/vendor/VendorSidebar.tsx
git commit -m "feat: add vendor dashboard shell layout with sidebar navigation"
git push
```

---

### Task 2: Vendor profile API — GET/PUT

**Files:**
- Create: `src/app/api/vendor/profile/route.ts`

- [ ] **Step 1: Write GET/PUT profile route**

```typescript
// src/app/api/vendor/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { VendorType } from '@prisma/client'

const updateSchema = z.object({
  business_name: z.string().min(2).optional(),
  vendor_type: z.nativeEnum(VendorType).optional(),
  description: z.string().optional(),
  phone_business: z.string().optional(),
  phone_cell: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  instagram: z.string().optional(),
  license_number: z.string().optional(),
  insurance_number: z.string().optional(),
  health_inspection_date: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: session.user.id },
    include: {
      services: true,
      documents: true,
      photos: true,
      availability: { orderBy: { date: 'asc' }, take: 90 },
      subscriptions: { orderBy: { created_at: 'desc' }, take: 1 },
    },
  })

  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  return NextResponse.json(vendor)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.health_inspection_date) {
    data.health_inspection_date = new Date(parsed.data.health_inspection_date)
  }

  const vendor = await prisma.vendor.update({
    where: { id: session.user.id },
    data,
  })

  return NextResponse.json(vendor)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/vendor/profile/
git commit -m "feat: add vendor profile GET/PUT API route"
git push
```

---

### Task 3: Menu items API + dish library

**Files:**
- Create: `src/app/api/vendor/menu-items/route.ts`, `src/app/api/vendor/menu-items/[id]/route.ts`

- [ ] **Step 1: Write menu items collection route**

```typescript
// src/app/api/vendor/menu-items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { MenuCategory, SpiceLevel } from '@prisma/client'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(MenuCategory),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  is_jain: z.boolean().default(false),
  is_halal: z.boolean().default(false),
  is_kosher: z.boolean().default(false),
  contains_nuts: z.boolean().default(false),
  contains_gluten: z.boolean().default(false),
  contains_dairy: z.boolean().default(false),
  contains_eggs: z.boolean().default(false),
  contains_soy: z.boolean().default(false),
  contains_shellfish: z.boolean().default(false),
  spice_level: z.nativeEnum(SpiceLevel).default('MEDIUM'),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.menuItem.findMany({
    where: { vendor_id: session.user.id, is_active: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const item = await prisma.menuItem.create({
    data: { ...parsed.data, vendor_id: session.user.id },
  })

  return NextResponse.json(item, { status: 201 })
}
```

- [ ] **Step 2: Write single menu item route**

```typescript
// src/app/api/vendor/menu-items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { MenuCategory, SpiceLevel } from '@prisma/client'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(MenuCategory).optional(),
  is_vegetarian: z.boolean().optional(),
  is_vegan: z.boolean().optional(),
  is_jain: z.boolean().optional(),
  is_halal: z.boolean().optional(),
  contains_nuts: z.boolean().optional(),
  contains_gluten: z.boolean().optional(),
  contains_dairy: z.boolean().optional(),
  spice_level: z.nativeEnum(SpiceLevel).optional(),
  is_active: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const existing = await prisma.menuItem.findFirst({
    where: { id, vendor_id: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = await prisma.menuItem.update({ where: { id }, data: parsed.data })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.menuItem.findFirst({
    where: { id, vendor_id: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Soft delete: mark inactive
  await prisma.menuItem.update({ where: { id }, data: { is_active: false } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/vendor/menu-items/
git commit -m "feat: add vendor menu items CRUD API"
git push
```

---

### Task 4: Menu packages API

**Files:**
- Create: `src/app/api/vendor/menu-packages/route.ts`, `src/app/api/vendor/menu-packages/[id]/route.ts`

- [ ] **Step 1: Write menu packages collection route**

```typescript
// src/app/api/vendor/menu-packages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price_per_head: z.number().positive(),
  currency: z.string().length(3).default('GBP'),
  min_guests: z.number().int().positive().optional(),
  max_guests: z.number().int().positive().optional(),
  cuisine_type: z.string().optional(),
  is_vegetarian: z.boolean().default(false),
  is_vegan: z.boolean().default(false),
  is_jain: z.boolean().default(false),
  is_halal: z.boolean().default(false),
  nut_free: z.boolean().default(false),
  gluten_free: z.boolean().default(false),
  dairy_free: z.boolean().default(false),
  includes_service: z.boolean().default(false),
  includes_setup: z.boolean().default(false),
  item_ids: z.array(z.string()).default([]),  // MenuItem ids to link
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const packages = await prisma.menuPackage.findMany({
    where: { vendor_id: session.user.id, is_active: true },
    include: {
      items: {
        include: { menu_item: true },
        orderBy: { sort_order: 'asc' },
      },
    },
    orderBy: { price_per_head: 'asc' },
  })

  return NextResponse.json(packages)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { item_ids, price_per_head, ...rest } = parsed.data

  const pkg = await prisma.menuPackage.create({
    data: {
      ...rest,
      price_per_head,
      vendor_id: session.user.id,
      items: {
        create: item_ids.map((menu_item_id, i) => ({
          menu_item_id,
          sort_order: i,
        })),
      },
    },
    include: { items: { include: { menu_item: true } } },
  })

  return NextResponse.json(pkg, { status: 201 })
}
```

- [ ] **Step 2: Write single package route**

```typescript
// src/app/api/vendor/menu-packages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price_per_head: z.number().positive().optional(),
  is_active: z.boolean().optional(),
  includes_service: z.boolean().optional(),
  includes_setup: z.boolean().optional(),
  item_ids: z.array(z.string()).optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const existing = await prisma.menuPackage.findFirst({
    where: { id, vendor_id: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { item_ids, ...rest } = parsed.data

  // If item_ids provided, replace all package items
  if (item_ids !== undefined) {
    await prisma.menuPackageItem.deleteMany({ where: { package_id: id } })
    await prisma.menuPackageItem.createMany({
      data: item_ids.map((menu_item_id, i) => ({
        package_id: id,
        menu_item_id,
        sort_order: i,
      })),
    })
  }

  const pkg = await prisma.menuPackage.update({
    where: { id },
    data: rest,
    include: { items: { include: { menu_item: true } } },
  })

  return NextResponse.json(pkg)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.menuPackage.findFirst({
    where: { id, vendor_id: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.menuPackage.update({ where: { id }, data: { is_active: false } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/vendor/menu-packages/
git commit -m "feat: add vendor menu packages CRUD API"
git push
```

---

### Task 5: Availability API + calendar component

**Files:**
- Create: `src/app/api/vendor/availability/route.ts`, `src/components/vendor/AvailabilityCalendar.tsx`, `src/app/(vendor)/vendor/availability/page.tsx`

- [ ] **Step 1: Write availability API**

```typescript
// src/app/api/vendor/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') ?? new Date().toISOString().split('T')[0]
  const to = searchParams.get('to') ?? new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]

  const availability = await prisma.vendorAvailability.findMany({
    where: {
      vendor_id: session.user.id,
      date: { gte: new Date(from), lte: new Date(to) },
    },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(availability)
}

const upsertSchema = z.object({
  dates: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      is_available: z.boolean(),
      reason: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Upsert each date
  const results = await Promise.all(
    parsed.data.dates.map(({ date, is_available, reason, notes }) =>
      prisma.vendorAvailability.upsert({
        where: { vendor_id_date: { vendor_id: session.user.id, date: new Date(date) } },
        update: { is_available, reason, notes },
        create: { vendor_id: session.user.id, date: new Date(date), is_available, reason, notes },
      })
    )
  )

  return NextResponse.json(results)
}
```

- [ ] **Step 2: Write AvailabilityCalendar component**

```typescript
// src/components/vendor/AvailabilityCalendar.tsx
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type DayStatus = { date: string; is_available: boolean }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function AvailabilityCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({})

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December']

  useEffect(() => {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = getDaysInMonth(year, month)
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    fetch(`/api/vendor/availability?from=${from}&to=${to}`)
      .then(r => r.json())
      .then((data: DayStatus[]) => {
        const map: Record<string, boolean> = {}
        data.forEach(d => {
          map[d.date.split('T')[0]] = d.is_available
        })
        setAvailability(map)
        setPendingChanges({})
      })
  }, [year, month])

  function toggleDay(dateStr: string) {
    const current = pendingChanges[dateStr] ?? availability[dateStr] ?? true
    setPendingChanges(p => ({ ...p, [dateStr]: !current }))
  }

  async function saveChanges() {
    setSaving(true)
    const dates = Object.entries(pendingChanges).map(([date, is_available]) => ({ date, is_available }))
    await fetch('/api/vendor/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dates }),
    })
    setAvailability(a => ({ ...a, ...pendingChanges }))
    setPendingChanges({})
    setSaving(false)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const blanks = Array(firstDay).fill(null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-semibold">{monthNames[month]} {year}</h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-3 w-3 rounded-full bg-green-100 border border-green-300 inline-block" /> Available
            <span className="h-3 w-3 rounded-full bg-red-100 border border-red-300 inline-block ml-2" /> Blocked
          </div>
          {Object.keys(pendingChanges).length > 0 && (
            <Button size="sm" onClick={saveChanges} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
              {saving ? 'Saving…' : `Save ${Object.keys(pendingChanges).length} changes`}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isAvailable = pendingChanges[dateStr] ?? availability[dateStr] ?? true
          const isPending = dateStr in pendingChanges
          const isPast = new Date(dateStr) < today

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => !isPast && toggleDay(dateStr)}
              className={cn(
                'aspect-square rounded-lg text-sm font-medium transition-colors',
                isPast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                isAvailable
                  ? 'bg-green-50 text-green-800 hover:bg-green-100 border border-green-200'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
                isPending && 'ring-2 ring-orange-400'
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write availability page**

```typescript
// src/app/(vendor)/vendor/availability/page.tsx
import { AvailabilityCalendar } from '@/components/vendor/AvailabilityCalendar'

export default function AvailabilityPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
        <p className="text-gray-500 mt-1">
          Click any future date to toggle availability. Green = available, Red = blocked.
          Changes are saved in batches when you click Save.
        </p>
      </div>
      <AvailabilityCalendar />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/vendor/availability/ src/components/vendor/AvailabilityCalendar.tsx src/app/\(vendor\)/vendor/availability/
git commit -m "feat: add vendor availability API and interactive calendar component"
git push
```

---

### Task 6: Cloudinary photo upload

**Files:**
- Create: `src/app/api/vendor/upload-signature/route.ts`, `src/app/api/vendor/photos/route.ts`, `src/app/api/vendor/photos/[id]/route.ts`, `src/app/(vendor)/vendor/photos/page.tsx`

- [ ] **Step 1: Install Cloudinary SDK**

```bash
cd /home/hareesh/projects/bhoj
pnpm add cloudinary
```

- [ ] **Step 2: Add Cloudinary helper**

```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export { cloudinary }
```

- [ ] **Step 3: Write signed upload route**

```typescript
// src/app/api/vendor/upload-signature/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cloudinary } from '@/lib/cloudinary'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const timestamp = Math.round(Date.now() / 1000)
  const folder = `bhoj/vendors/${session.user.id}`
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, transformation: 'c_limit,w_1600,q_auto' },
    process.env.CLOUDINARY_API_SECRET!
  )

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  })
}
```

- [ ] **Step 4: Write photos POST route**

```typescript
// src/app/api/vendor/photos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  is_cover: z.boolean().default(false),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const photos = await prisma.vendorPhoto.findMany({
    where: { vendor_id: session.user.id },
    orderBy: [{ is_cover: 'desc' }, { sort_order: 'asc' }],
  })
  return NextResponse.json(photos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Count existing photos
  const count = await prisma.vendorPhoto.count({ where: { vendor_id: session.user.id } })

  // If setting as cover, unset any existing cover
  if (parsed.data.is_cover) {
    await prisma.vendorPhoto.updateMany({
      where: { vendor_id: session.user.id, is_cover: true },
      data: { is_cover: false },
    })
  }

  const photo = await prisma.vendorPhoto.create({
    data: {
      ...parsed.data,
      vendor_id: session.user.id,
      sort_order: count,
    },
  })

  return NextResponse.json(photo, { status: 201 })
}
```

- [ ] **Step 5: Write photos DELETE route**

```typescript
// src/app/api/vendor/photos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cloudinary } from '@/lib/cloudinary'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const photo = await prisma.vendorPhoto.findFirst({
    where: { id, vendor_id: session.user.id },
  })
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Extract public_id from Cloudinary URL and delete
  try {
    const urlParts = photo.url.split('/')
    const publicId = urlParts.slice(-2).join('/').replace(/\.[^/.]+$/, '')
    await cloudinary.uploader.destroy(publicId)
  } catch {
    // Log but don't block deletion
    console.error('Cloudinary delete failed for', photo.url)
  }

  await prisma.vendorPhoto.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Write photos page with client upload**

```typescript
// src/app/(vendor)/vendor/photos/page.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, Trash2, Star } from 'lucide-react'
import Image from 'next/image'

type Photo = { id: string; url: string; caption: string | null; is_cover: boolean; sort_order: number }

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/vendor/photos').then(r => r.json()).then(setPhotos)
  }, [])

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      // Get signed upload params
      const sigRes = await fetch('/api/vendor/upload-signature')
      const { signature, timestamp, folder, cloud_name, api_key } = await sigRes.json()

      // Upload directly to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('signature', signature)
      formData.append('timestamp', timestamp)
      formData.append('folder', folder)
      formData.append('api_key', api_key)
      formData.append('transformation', 'c_limit,w_1600,q_auto')

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        { method: 'POST', body: formData }
      )
      const uploadData = await uploadRes.json()

      // Save URL to our DB
      const photoRes = await fetch('/api/vendor/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadData.secure_url, is_cover: photos.length === 0 }),
      })
      const newPhoto = await photoRes.json()
      setPhotos(p => [...p, newPhoto])
    } finally {
      setUploading(false)
    }
  }

  async function deletePhoto(id: string) {
    await fetch(`/api/vendor/photos/${id}`, { method: 'DELETE' })
    setPhotos(p => p.filter(ph => ph.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photos</h1>
          <p className="text-gray-500 mt-1">Showcase your food and events. First photo is your cover image.</p>
        </div>
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Uploading…' : 'Upload Photo'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
      </div>

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center">
          <p className="text-gray-400">No photos yet. Upload your first photo to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden border">
              <div className="aspect-video relative">
                <Image src={photo.url} alt={photo.caption ?? ''} fill className="object-cover" />
              </div>
              {photo.is_cover && (
                <Badge className="absolute top-2 left-2 bg-orange-600">
                  <Star className="h-3 w-3 mr-1" /> Cover
                </Badge>
              )}
              <button
                onClick={() => deletePhoto(photo.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full p-1.5 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/cloudinary.ts src/app/api/vendor/upload-signature/ src/app/api/vendor/photos/ src/app/\(vendor\)/vendor/photos/
git commit -m "feat: add Cloudinary photo upload flow for vendor gallery"
git push
```

---

### Task 7: Multi-step onboarding wizard

**Files:**
- Create: `src/app/(vendor)/vendor/onboarding/page.tsx`, `src/components/vendor/OnboardingWizard.tsx`, `src/components/vendor/steps/Step1BusinessInfo.tsx`, `src/components/vendor/steps/Step2Services.tsx`, `src/components/vendor/steps/Step3ComplianceDocs.tsx`

- [ ] **Step 1: Write OnboardingWizard orchestrator**

```typescript
// src/components/vendor/OnboardingWizard.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { Step1BusinessInfo } from './steps/Step1BusinessInfo'
import { Step2Services } from './steps/Step2Services'
import { Step3ComplianceDocs } from './steps/Step3ComplianceDocs'

const STEPS = [
  { label: 'Business Info' },
  { label: 'Services' },
  { label: 'Compliance' },
  { label: 'Dish Library' },
  { label: 'Menu Packages' },
  { label: 'Availability' },
  { label: 'Photos' },
]

export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const router = useRouter()

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else router.push('/vendor/dashboard')
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}</span>
          <span className="text-sm font-medium text-orange-600">{STEPS[step].label}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        <div className="flex justify-between mt-2">
          {STEPS.map((s, i) => (
            <span
              key={i}
              className={`text-xs ${i === step ? 'text-orange-600 font-medium' : i < step ? 'text-green-600' : 'text-gray-300'}`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border p-8">
        {step === 0 && <Step1BusinessInfo onNext={next} />}
        {step === 1 && <Step2Services onNext={next} onBack={back} />}
        {step === 2 && <Step3ComplianceDocs onNext={next} onBack={back} />}
        {step >= 3 && (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Continue to <strong>{STEPS[step].label}</strong> from your dashboard.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={back} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
              <button
                onClick={next}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
              >
                {step === STEPS.length - 1 ? 'Go to Dashboard' : 'Continue →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write Step 1 — Business Info**

```typescript
// src/components/vendor/steps/Step1BusinessInfo.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const VENDOR_TYPES = [
  { value: 'CATERER', label: 'Caterer' },
  { value: 'DESSERT_VENDOR', label: 'Dessert Vendor' },
  { value: 'BARTENDER', label: 'Bartender' },
  { value: 'CHAI_STATION', label: 'Chai Station' },
  { value: 'FOOD_TRUCK', label: 'Food Truck' },
  { value: 'DECORATOR', label: 'Decorator' },
  { value: 'DJ', label: 'DJ' },
  { value: 'PHOTOGRAPHER', label: 'Photographer' },
  { value: 'MEHENDI_ARTIST', label: 'Mehendi Artist' },
]

type Props = { onNext: () => void }

export function Step1BusinessInfo({ onNext }: Props) {
  const [form, setForm] = useState({
    business_name: '', vendor_type: '', description: '',
    city: '', country: 'GB', website: '', instagram: '',
    phone_business: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!form.business_name || !form.vendor_type || !form.city) {
      setError('Business name, type and city are required.')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch('/api/vendor/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) onNext()
    else setError('Failed to save. Please try again.')
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">Tell us about your business</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-1">
        <Label>Business name *</Label>
        <Input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Spice Garden Catering" />
      </div>

      <div className="space-y-1">
        <Label>Business type *</Label>
        <Select value={form.vendor_type} onValueChange={v => setForm(f => ({ ...f, vendor_type: v }))}>
          <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
          <SelectContent>
            {VENDOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>City *</Label>
          <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="London" />
        </div>
        <div className="space-y-1">
          <Label>Country</Label>
          <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="IN">India</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>About your business</Label>
        <Textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe your specialties, experience, and what makes you unique…"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input value={form.phone_business} onChange={e => setForm(f => ({ ...f, phone_business: e.target.value }))} placeholder="+44 20 1234 5678" />
        </div>
        <div className="space-y-1">
          <Label>Website</Label>
          <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://yoursite.com" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700">
        {saving ? 'Saving…' : 'Save & Continue →'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Write Step 2 — Services**

```typescript
// src/components/vendor/steps/Step2Services.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'

const SUGGESTED_SERVICES = [
  'Full-service catering', 'Drop-off catering', 'Live cooking stations',
  'Breakfast/brunch catering', 'Corporate lunch boxes', 'Wedding catering',
  'Buffet setup', 'Plated service', 'Cocktail canapes',
]

type Props = { onNext: () => void; onBack: () => void }

export function Step2Services({ onNext, onBack }: Props) {
  const [services, setServices] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleSuggested(name: string) {
    setServices(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name])
  }

  function addCustom() {
    if (custom.trim() && !services.includes(custom.trim())) {
      setServices(s => [...s, custom.trim()])
      setCustom('')
    }
  }

  async function handleSave() {
    if (services.length === 0) { onNext(); return }
    setSaving(true)
    await fetch('/api/vendor/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: services.map(name => ({ name })) }),
    })
    setSaving(false)
    onNext()
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">What services do you offer?</h2>
      <p className="text-gray-500 text-sm">Select all that apply. You can edit these later.</p>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_SERVICES.map(s => (
          <button
            key={s}
            onClick={() => toggleSuggested(s)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              services.includes(s)
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()}
          placeholder="Add custom service…"
        />
        <Button variant="outline" onClick={addCustom}><Plus className="h-4 w-4" /></Button>
      </div>

      {services.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {services.map(s => (
            <Badge key={s} variant="secondary" className="flex items-center gap-1">
              {s}
              <button onClick={() => setServices(sv => sv.filter(x => x !== s))}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700">
          {saving ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write Step 3 — Compliance Docs**

```typescript
// src/components/vendor/steps/Step3ComplianceDocs.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Upload } from 'lucide-react'

type DocEntry = { doc_type: string; url: string; expires_at?: string }
type Props = { onNext: () => void; onBack: () => void }

const REQUIRED_DOCS = [
  { key: 'food_hygiene', label: 'Food Hygiene Certificate', required: true },
  { key: 'public_liability', label: 'Public Liability Insurance', required: true },
  { key: 'allergen_training', label: 'Allergen Training Certificate', required: false },
  { key: 'halal_cert', label: 'Halal Certificate', required: false },
]

export function Step3ComplianceDocs({ onNext, onBack }: Props) {
  const [docs, setDocs] = useState<Record<string, DocEntry>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [profile, setProfile] = useState({ license_number: '', insurance_number: '' })
  const [saving, setSaving] = useState(false)

  async function uploadDoc(doc_type: string, file: File) {
    setUploading(doc_type)
    const sigRes = await fetch('/api/vendor/upload-signature')
    const { signature, timestamp, folder, cloud_name, api_key } = await sigRes.json()

    const formData = new FormData()
    formData.append('file', file)
    formData.append('signature', signature)
    formData.append('timestamp', timestamp)
    formData.append('folder', folder)
    formData.append('api_key', api_key)
    formData.append('resource_type', 'auto')  // allow PDFs

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/raw/upload`, { method: 'POST', body: formData })
    const data = await res.json()
    setDocs(d => ({ ...d, [doc_type]: { doc_type, url: data.secure_url } }))
    setUploading(null)
  }

  async function handleSave() {
    setSaving(true)
    // Save compliance fields
    await fetch('/api/vendor/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    // Save uploaded docs
    if (Object.keys(docs).length > 0) {
      await fetch('/api/vendor/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: Object.values(docs) }),
      })
    }
    setSaving(false)
    onNext()
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">Compliance Documents</h2>
      <p className="text-gray-500 text-sm">
        Upload your certifications. Required documents must be provided before receiving leads.
      </p>

      <div className="space-y-3">
        {REQUIRED_DOCS.map(doc => (
          <div key={doc.key} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-800">{doc.label}</p>
              {doc.required && <Badge variant="outline" className="text-xs mt-0.5">Required</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {docs[doc.key] ? (
                <span className="flex items-center gap-1.5 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Uploaded
                </span>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,image/*"
                    disabled={uploading === doc.key}
                    onChange={e => e.target.files?.[0] && uploadDoc(doc.key, e.target.files[0])}
                  />
                  <span className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm text-gray-600 hover:bg-gray-50">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading === doc.key ? 'Uploading…' : 'Upload'}
                  </span>
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>License / Registration number</Label>
          <Input value={profile.license_number} onChange={e => setProfile(p => ({ ...p, license_number: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Insurance policy number</Label>
          <Input value={profile.insurance_number} onChange={e => setProfile(p => ({ ...p, insurance_number: e.target.value }))} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700">
          {saving ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write onboarding page + supporting API routes**

```typescript
// src/app/(vendor)/vendor/onboarding/page.tsx
import { OnboardingWizard } from '@/components/vendor/OnboardingWizard'

export default function OnboardingPage() {
  return (
    <div className="min-h-[80vh] flex items-start py-8">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Set up your vendor profile</h1>
          <p className="text-gray-500 mt-2">
            Complete these steps to start receiving leads from Bhoj.
          </p>
        </div>
        <OnboardingWizard />
      </div>
    </div>
  )
}
```

```typescript
// src/app/api/vendor/services/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  services: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Replace existing services
  await prisma.vendorService.deleteMany({ where: { vendor_id: session.user.id } })
  await prisma.vendorService.createMany({
    data: parsed.data.services.map(s => ({ ...s, vendor_id: session.user.id })),
  })

  return NextResponse.json({ ok: true })
}
```

```typescript
// src/app/api/vendor/documents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  documents: z.array(z.object({
    doc_type: z.string(),
    url: z.string().url(),
    expires_at: z.string().optional(),
  })),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  await prisma.vendorDocument.createMany({
    data: parsed.data.documents.map(d => ({
      ...d,
      vendor_id: session.user.id,
      expires_at: d.expires_at ? new Date(d.expires_at) : undefined,
    })),
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/vendor/ src/app/\(vendor\)/vendor/onboarding/ src/app/api/vendor/services/ src/app/api/vendor/documents/
git commit -m "feat: add vendor onboarding wizard with 3 active steps and supporting API routes"
git push
```

---

### Task 8: Public vendor profile page

**Files:**
- Create: `src/app/vendors/[id]/page.tsx`

- [ ] **Step 1: Write public vendor profile**

```typescript
// src/app/vendors/[id]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, CheckCircle2 } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vendor = await prisma.vendor.findUnique({ where: { id, is_active: true } })
  if (!vendor) return { title: 'Vendor not found' }
  return {
    title: `${vendor.business_name} — Bhoj`,
    description: vendor.description ?? `${vendor.business_name} on Bhoj Indian Events`,
  }
}

export default async function VendorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const vendor = await prisma.vendor.findUnique({
    where: { id, is_active: true },
    include: {
      photos: { orderBy: [{ is_cover: 'desc' }, { sort_order: 'asc' }], take: 12 },
      services: { where: { is_active: true } },
      menu_packages: {
        where: { is_active: true },
        include: { items: { include: { menu_item: true }, orderBy: { sort_order: 'asc' } } },
        orderBy: { price_per_head: 'asc' },
      },
      reviews: {
        where: { is_published: true },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: { customer: { select: { name: true, avatar_url: true } } },
      },
      past_events: { orderBy: { event_date: 'desc' }, take: 3 },
    },
  })

  if (!vendor) notFound()

  const avgRating = vendor.reviews.length
    ? vendor.reviews.reduce((sum, r) => sum + r.overall_rating, 0) / vendor.reviews.length
    : null

  const coverPhoto = vendor.photos.find(p => p.is_cover) ?? vendor.photos[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b px-6 py-4">
        <a href="/" className="text-xl font-bold text-orange-600">Bhoj</a>
      </nav>

      {/* Cover */}
      <div className="relative h-64 bg-gray-200">
        {coverPhoto && (
          <Image src={coverPhoto.url} alt={vendor.business_name} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-6 left-8 text-white">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold">{vendor.business_name}</h1>
            {vendor.is_verified && (
              <CheckCircle2 className="h-6 w-6 text-blue-400" />
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {vendor.city}, {vendor.country}
            </span>
            {avgRating && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {avgRating.toFixed(1)} ({vendor.reviews.length} reviews)
              </span>
            )}
            <Badge variant="outline" className="text-white border-white text-xs">
              {vendor.vendor_type.replace(/_/g, ' ')}
            </Badge>
            {vendor.tier !== 'FREE' && (
              <Badge className="bg-orange-600 text-white text-xs">{vendor.tier}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-3 gap-8">
        {/* Main content */}
        <div className="col-span-2 space-y-8">
          {/* About */}
          {vendor.description && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-3">About</h2>
              <p className="text-gray-600 leading-relaxed">{vendor.description}</p>
            </section>
          )}

          {/* Services */}
          {vendor.services.length > 0 && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-3">Services</h2>
              <div className="flex flex-wrap gap-2">
                {vendor.services.map(s => (
                  <Badge key={s.id} variant="secondary">{s.name}</Badge>
                ))}
              </div>
            </section>
          )}

          {/* Menu Packages */}
          {vendor.menu_packages.length > 0 && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Menu Packages</h2>
              <div className="space-y-4">
                {vendor.menu_packages.map(pkg => (
                  <div key={pkg.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                      <span className="text-lg font-bold text-orange-600">
                        £{Number(pkg.price_per_head).toFixed(2)}<span className="text-sm font-normal text-gray-500">/head</span>
                      </span>
                    </div>
                    {pkg.description && <p className="text-gray-500 text-sm mb-3">{pkg.description}</p>}
                    <div className="flex flex-wrap gap-1">
                      {pkg.is_vegetarian && <Badge variant="outline" className="text-xs text-green-700 border-green-200">Vegetarian</Badge>}
                      {pkg.is_halal && <Badge variant="outline" className="text-xs">Halal</Badge>}
                      {pkg.includes_service && <Badge variant="outline" className="text-xs">Service included</Badge>}
                    </div>
                    {pkg.items.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        {pkg.items.slice(0, 6).map(i => i.menu_item.name).join(', ')}
                        {pkg.items.length > 6 && ` +${pkg.items.length - 6} more`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Photos */}
          {vendor.photos.length > 1 && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Gallery</h2>
              <div className="grid grid-cols-3 gap-3">
                {vendor.photos.slice(0, 9).map(photo => (
                  <div key={photo.id} className="aspect-video relative rounded-lg overflow-hidden">
                    <Image src={photo.url} alt={photo.caption ?? ''} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          {vendor.reviews.length > 0 && (
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Reviews</h2>
              <div className="space-y-4">
                {vendor.reviews.map(review => (
                  <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.overall_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{review.customer.name}</span>
                      {review.event_type && <span className="text-xs text-gray-400">· {review.event_type}</span>}
                    </div>
                    {review.title && <p className="font-medium text-sm text-gray-800">{review.title}</p>}
                    {review.body && <p className="text-sm text-gray-600 mt-1">{review.body}</p>}
                    {review.vendor_reply && (
                      <div className="mt-2 pl-3 border-l-2 border-orange-200">
                        <p className="text-xs text-orange-700 font-medium">Response from {vendor.business_name}</p>
                        <p className="text-sm text-gray-600">{review.vendor_reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: contact card */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl border p-6 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">Request a quote</h3>
            <a
              href={`/events/new?vendor=${vendor.id}`}
              className="block w-full text-center py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Get a Quote
            </a>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Free to request. Usually responds within 24 hours.
            </p>

            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                className="mt-4 block text-sm text-center text-orange-600 hover:underline">
                Visit website →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/vendors/
git commit -m "feat: add public vendor profile page with gallery, packages, and reviews"
git push
```

---
