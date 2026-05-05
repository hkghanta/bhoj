# Plan 1: Foundation — Schema + ServiceConfig + Admin Catalogue

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ServiceConfig, RequestResponse models; extend EventRequest and Vendor models; seed service catalogue; build admin service toggle page.

**Architecture:** Pure schema + API + one admin page. No customer-facing changes. Everything in Plans 2–5 depends on this being done first. Uses `npx prisma db push` (no migrations). Admin auth via `isAdminRequest()` header check, same pattern as `/api/admin/vendors`.

**Tech Stack:** Prisma 5, Next.js App Router API routes, TypeScript, Tailwind CSS.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add 4 new fields + 2 new models |
| `prisma/seed-services.ts` | Create | Seed all 26 ServiceConfig rows |
| `src/app/api/admin/services/route.ts` | Create | GET all service configs |
| `src/app/api/admin/services/[type]/route.ts` | Create | PATCH enable/disable |
| `src/app/admin/services/page.tsx` | Create | Admin toggle UI |
| `src/app/admin/layout.tsx` | Modify | Add "Services" nav link |

---

### Task 1: Schema changes

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add fields and models to schema**

Open `prisma/schema.prisma`. Make these 4 edits:

**1a. Add to EventRequest model** (after `status` field):
```prisma
  public_token   String       @unique @default(cuid())
  public_status  String       @default("OPEN")
  service_notes  String?
```

**1b. Add to Vendor model** (after `instagram` field):
```prisma
  profile_type   String       @default("BUSINESS")
  first_name     String?
  last_name      String?
```

**1c. Add RequestResponse model** (after EventMenuPreference model):
```prisma
model RequestResponse {
  id               String       @id @default(cuid())
  event_request_id String
  vendor_id        String?
  name             String
  phone            String?
  pitch            String
  price_note       String?
  portfolio_url    String?
  status           String       @default("PENDING")
  created_at       DateTime     @default(now())
  event_request    EventRequest @relation(fields: [event_request_id], references: [id], onDelete: Cascade)
  vendor           Vendor?      @relation(fields: [vendor_id], references: [id])
}
```

**1d. Add ServiceConfig model** (after RequestResponse model):
```prisma
model ServiceConfig {
  id            String  @id @default(cuid())
  vendor_type   String  @unique
  is_enabled    Boolean @default(false)
  sort_order    Int     @default(0)
  label         String
  icon          String
  service_class String  @default("BUSINESS")
}
```

**1e. Add back-relations** to existing models:

In EventRequest model, add after existing relations:
```prisma
  responses      RequestResponse[]
```

In Vendor model, add after existing relations:
```prisma
  request_responses RequestResponse[]
```

- [ ] **Step 2: Push schema to database**

```bash
cd /home/hareesh/projects/bhoj
npx prisma db push
```

Expected output ends with: `✔ Generated Prisma Client`

- [ ] **Step 3: Verify new tables exist**

```bash
npx prisma studio
```

Open browser at `http://localhost:5555`. Confirm you see `ServiceConfig`, `RequestResponse` tables and that `EventRequest` has `public_token`, `public_status`, `service_notes` columns. Close Prisma Studio (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add ServiceConfig, RequestResponse models; extend EventRequest and Vendor"
```

---

### Task 2: Seed service catalogue

**Files:**
- Create: `prisma/seed-services.ts`

- [ ] **Step 1: Create seed script**

```typescript
// prisma/seed-services.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SERVICES = [
  // Business services — have Google Places listings
  { vendor_type: 'CATERER',           label: 'Catering',           icon: '🍽',  service_class: 'BUSINESS',    is_enabled: true,  sort_order: 1 },
  { vendor_type: 'DECORATOR',         label: 'Decoration',         icon: '✨',  service_class: 'BUSINESS',    is_enabled: true,  sort_order: 2 },
  { vendor_type: 'FLORIST',           label: 'Florist',            icon: '💐',  service_class: 'BUSINESS',    is_enabled: true,  sort_order: 7 },
  { vendor_type: 'DESSERT_VENDOR',    label: 'Desserts & Sweets',  icon: '🍰',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 10 },
  { vendor_type: 'BARTENDER',         label: 'Bar & Bartender',    icon: '🍹',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 11 },
  { vendor_type: 'CHAI_STATION',      label: 'Chai Station',       icon: '☕',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 12 },
  { vendor_type: 'FOOD_TRUCK',        label: 'Food Truck',         icon: '🚚',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 13 },
  { vendor_type: 'TENT_MARQUEE',      label: 'Tent & Marquee',     icon: '⛺',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 14 },
  { vendor_type: 'LIGHTING',          label: 'Lighting',           icon: '💡',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 15 },
  { vendor_type: 'FURNITURE_RENTAL',  label: 'Furniture Rental',   icon: '🪑',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 16 },
  { vendor_type: 'EQUIPMENT_RENTAL',  label: 'Equipment Rental',   icon: '🔧',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 17 },
  { vendor_type: 'TRANSPORT',         label: 'Transport',          icon: '🚗',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 18 },
  { vendor_type: 'SECURITY',          label: 'Security',           icon: '🛡',  service_class: 'BUSINESS',    is_enabled: false, sort_order: 19 },
  // Individual services — freelancers, not on Google Maps
  { vendor_type: 'PHOTOGRAPHER',      label: 'Photography',        icon: '📷',  service_class: 'INDIVIDUAL',  is_enabled: true,  sort_order: 3 },
  { vendor_type: 'VIDEOGRAPHER',      label: 'Videography',        icon: '🎬',  service_class: 'INDIVIDUAL',  is_enabled: false, sort_order: 20 },
  { vendor_type: 'DJ',                label: 'DJ',                 icon: '🎵',  service_class: 'INDIVIDUAL',  is_enabled: true,  sort_order: 4 },
  { vendor_type: 'MEHENDI_ARTIST',    label: 'Mehendi Artist',     icon: '🌿',  service_class: 'INDIVIDUAL',  is_enabled: true,  sort_order: 5 },
  { vendor_type: 'MAKEUP_HAIR',       label: 'Makeup & Hair',      icon: '💄',  service_class: 'INDIVIDUAL',  is_enabled: true,  sort_order: 6 },
  { vendor_type: 'DHOL_PLAYER',       label: 'Dhol Player',        icon: '🥁',  service_class: 'INDIVIDUAL',  is_enabled: false, sort_order: 21 },
  { vendor_type: 'LIVE_BAND',         label: 'Live Band',          icon: '🎸',  service_class: 'INDIVIDUAL',  is_enabled: false, sort_order: 22 },
  { vendor_type: 'CLASSICAL_MUSICIAN',label: 'Classical Musician', icon: '🎻',  service_class: 'INDIVIDUAL',  is_enabled: false, sort_order: 23 },
  { vendor_type: 'CHOREOGRAPHER',     label: 'Choreographer',      icon: '💃',  service_class: 'INDIVIDUAL',  is_enabled: false, sort_order: 24 },
  { vendor_type: 'PANDIT_OFFICIANT',  label: 'Pandit / Officiant', icon: '🙏',  service_class: 'INDIVIDUAL',  is_enabled: false, sort_order: 25 },
  { vendor_type: 'MC_HOST',           label: 'MC / Host',          icon: '🎤',  service_class: 'INDIVIDUAL',  is_enabled: false, sort_order: 26 },
  { vendor_type: 'INVITATION_DESIGNER',label:'Invitation Designer',icon: '✉️',  service_class: 'INDIVIDUAL',  is_enabled: false, sort_order: 27 },
  { vendor_type: 'GAMES_ENTERTAINMENT',label:'Games & Entertainment',icon:'🎮', service_class: 'INDIVIDUAL',  is_enabled: false, sort_order: 28 },
]

async function main() {
  console.log('Seeding ServiceConfig...')
  for (const s of SERVICES) {
    await prisma.serviceConfig.upsert({
      where: { vendor_type: s.vendor_type },
      update: { label: s.label, icon: s.icon, service_class: s.service_class, sort_order: s.sort_order },
      create: s,
    })
  }
  console.log(`Seeded ${SERVICES.length} service types.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Run the seed**

```bash
cd /home/hareesh/projects/bhoj
npx tsx prisma/seed-services.ts
```

Expected output:
```
Seeding ServiceConfig...
Seeded 26 service types.
```

- [ ] **Step 3: Verify in database**

```bash
npx prisma studio
```

Open `ServiceConfig` table. Confirm 26 rows exist. 7 rows have `is_enabled = true`. Close (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add prisma/seed-services.ts
git commit -m "feat: seed ServiceConfig with 26 service types"
```

---

### Task 3: Admin services API

**Files:**
- Create: `src/app/api/admin/services/route.ts`
- Create: `src/app/api/admin/services/[type]/route.ts`

- [ ] **Step 1: Create GET all configs route**

```typescript
// src/app/api/admin/services/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configs = await prisma.serviceConfig.findMany({
    orderBy: { sort_order: 'asc' },
  })
  return NextResponse.json(configs)
}
```

- [ ] **Step 2: Create PATCH enable/disable route**

```typescript
// src/app/api/admin/services/[type]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  is_enabled: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const config = await prisma.serviceConfig.update({
    where: { vendor_type: type },
    data: parsed.data,
  })
  return NextResponse.json(config)
}
```

- [ ] **Step 3: Test the routes manually**

Start the dev server if not running:
```bash
pnpm dev
```

In another terminal, get the admin auth header value from `src/lib/admin-auth.ts` (look for the header name and expected value). Then:
```bash
# Get all services
curl -H "x-admin-secret: <value>" http://localhost:3002/api/admin/services | jq '.[0:3]'
```
Expected: array of 3 service config objects with `vendor_type`, `is_enabled`, `label`, etc.

```bash
# Toggle VIDEOGRAPHER on
curl -X PATCH -H "x-admin-secret: <value>" -H "Content-Type: application/json" \
  -d '{"is_enabled": true}' \
  http://localhost:3002/api/admin/services/VIDEOGRAPHER
```
Expected: `{"vendor_type":"VIDEOGRAPHER","is_enabled":true,...}`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/services/route.ts src/app/api/admin/services/[type]/route.ts
git commit -m "feat: admin services API — list and toggle service types"
```

---

### Task 4: Admin services page

**Files:**
- Create: `src/app/admin/services/page.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Create admin services page**

```typescript
// src/app/admin/services/page.tsx
'use client'
import { useState, useEffect } from 'react'

type ServiceConfig = {
  id: string
  vendor_type: string
  label: string
  icon: string
  service_class: string
  is_enabled: boolean
  sort_order: number
}

export default function AdminServicesPage() {
  const [configs, setConfigs] = useState<ServiceConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/services')
      .then(r => r.json())
      .then(data => { setConfigs(data); setLoading(false) })
  }, [])

  async function toggle(type: string, current: boolean) {
    setToggling(type)
    const res = await fetch(`/api/admin/services/${type}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: !current }),
    })
    if (res.ok) {
      const updated = await res.json()
      setConfigs(prev => prev.map(c => c.vendor_type === type ? { ...c, is_enabled: updated.is_enabled } : c))
    }
    setToggling(null)
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  const enabled = configs.filter(c => c.is_enabled)
  const disabled = configs.filter(c => !c.is_enabled)

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Catalogue</h1>
        <p className="text-sm text-gray-500 mt-1">
          {enabled.length} of {configs.length} service types enabled. Enabled types appear on customer event dashboards.
        </p>
      </div>

      <div className="space-y-6">
        {[
          { title: 'Enabled', items: enabled, emptyMsg: 'No services enabled.' },
          { title: 'Disabled', items: disabled, emptyMsg: 'All services are enabled.' },
        ].map(({ title, items, emptyMsg }) => (
          <div key={title}>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</h2>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 italic">{emptyMsg}</p>
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {items.map(c => (
                  <div key={c.vendor_type} className="flex items-center gap-4 px-4 py-3">
                    <span className="text-2xl w-8 text-center">{c.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{c.label}</p>
                      <p className="text-xs text-gray-400">{c.vendor_type} · {c.service_class}</p>
                    </div>
                    <button
                      onClick={() => toggle(c.vendor_type, c.is_enabled)}
                      disabled={toggling === c.vendor_type}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        c.is_enabled ? 'bg-orange-500' : 'bg-gray-200'
                      } ${toggling === c.vendor_type ? 'opacity-50' : ''}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        c.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add Services link to admin nav**

Open `src/app/admin/layout.tsx`. Find the nav links section and add:
```tsx
<Link href="/admin/services" className="...">Services</Link>
```
Match the exact className pattern used by existing nav links in that file.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3002/admin/services`. You should see:
- "7 of 26 service types enabled" 
- Enabled section: CATERER, DECORATOR, FLORIST, PHOTOGRAPHER, DJ, MEHENDI_ARTIST, MAKEUP_HAIR
- Disabled section: remaining 19 services
- Toggle switches working — click one and confirm it flips

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/services/page.tsx src/app/admin/layout.tsx
git commit -m "feat: admin service catalogue page with enable/disable toggles"
```
