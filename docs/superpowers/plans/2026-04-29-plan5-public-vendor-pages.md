# Plan 5: Public Vendor Profiles + SEO Browse Pages + Sitemap

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build public, unauthenticated vendor profile pages (`/vendors/[id]`) and service-city browse pages (`/vendors/[service-slug]/[city-slug]`). Add a dynamic sitemap. These pages are SEO-indexed from day one and give non-authenticated visitors a way to discover vendors and request quotes.

**Architecture:** All pages are Next.js Server Components under `(public)` route group (layout from Plan 4). Profile and browse APIs are public (no auth). For business services, browse pages also show Google Places results below OneSeva vendors. Individual services show a "Join OneSeva" CTA instead of Google Places. Sitemap is generated dynamically from Prisma.

**Tech Stack:** Next.js 16 App Router, Prisma 5, TypeScript, Tailwind CSS, `generateMetadata`, `generateStaticParams` where applicable.

**Depends on:** Plan 1 (Vendor.profile_type, first_name, last_name fields), Plan 4 (public layout exists at `src/app/(public)/layout.tsx`).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/api/vendors/[id]/route.ts` | Create | Public vendor profile API (no auth) |
| `src/app/api/vendors/browse/route.ts` | Create | Public browse API — OneSeva vendors by service + city |
| `src/app/(public)/vendors/[id]/page.tsx` | Create | Public vendor profile page |
| `src/app/(public)/vendors/[service-slug]/[city-slug]/page.tsx` | Create | Service-city browse page |
| `src/app/sitemap.ts` | Create | Dynamic sitemap |

---

### Task 1: Public vendor profile API

**Files:**
- Create: `src/app/api/vendors/[id]/route.ts`

Returns full public-safe vendor data. No auth required. Does not expose customer PII.

- [ ] **Step 1: Create the file**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { id: string }

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params

  const vendor = await prisma.vendor.findUnique({
    where: { id, status: 'ACTIVE' },
    select: {
      id: true,
      business_name: true,
      city: true,
      vendor_type: true,
      profile_type: true,
      first_name: true,
      last_name: true,
      profile_photo: true,
      description: true,
      avg_rating: true,
      is_verified: true,
      currency: true,
      price_per_head_min: true,
      price_per_head_max: true,
      instagram: true,
      menu_packages: {
        where: { is_active: true },
        select: {
          id: true, name: true, description: true,
          price_per_head: true, min_guests: true, max_guests: true,
          is_halal: true, is_jain: true, is_kosher: true,
          cuisine_tags: true, service_style: true,
        },
        orderBy: { price_per_head: 'asc' },
      },
      reviews: {
        where: { is_approved: true },
        select: {
          id: true, rating: true, comment: true, created_at: true,
          customer: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
      },
    },
  })

  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(vendor)
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/vendors/[id]/route.ts
git commit -m "feat: add public vendor profile API — no auth required"
```

---

### Task 2: Public browse API

**Files:**
- Create: `src/app/api/vendors/browse/route.ts`

Returns OneSeva vendors for a given service type + city, sorted by rating. Used by both the browse page and can be called client-side for filtering.

- [ ] **Step 1: Create the file**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SLUG_TO_TYPE: Record<string, string> = {
  catering: 'CATERER',
  photographer: 'PHOTOGRAPHER',
  videographer: 'VIDEOGRAPHER',
  decorator: 'DECORATOR',
  dj: 'DJ',
  florist: 'FLORIST',
  mehendi: 'MEHENDI_ARTIST',
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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const serviceSlug = searchParams.get('service')
  const city = searchParams.get('city')

  if (!serviceSlug || !city) {
    return NextResponse.json({ error: 'service and city params required' }, { status: 400 })
  }

  const vendorType = SLUG_TO_TYPE[serviceSlug]
  if (!vendorType) return NextResponse.json({ error: 'Unknown service type' }, { status: 404 })

  const vendors = await prisma.vendor.findMany({
    where: {
      vendor_type: vendorType,
      status: 'ACTIVE',
      city: { contains: city, mode: 'insensitive' },
    },
    select: {
      id: true,
      business_name: true,
      city: true,
      profile_type: true,
      first_name: true,
      last_name: true,
      profile_photo: true,
      avg_rating: true,
      is_verified: true,
      currency: true,
      price_per_head_min: true,
      price_per_head_max: true,
    },
    orderBy: [{ avg_rating: 'desc' }, { is_verified: 'desc' }],
    take: 50,
  })

  return NextResponse.json(vendors)
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/vendors/browse/route.ts
git commit -m "feat: add public vendor browse API — service + city query, no auth"
```

---

### Task 3: Public vendor profile page

**Files:**
- Create: `src/app/(public)/vendors/[id]/page.tsx`

Server component. Fetches vendor data from the public API. Shows business profile, packages/offerings, reviews. "Request Quote" button redirects unauthenticated users to login with a return URL.

- [ ] **Step 1: Create the file**

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Star, CheckCircle2 } from 'lucide-react'

type Package = {
  id: string; name: string; description: string | null
  price_per_head: number | null; min_guests: number | null; max_guests: number | null
  is_halal: boolean; is_jain: boolean; is_kosher: boolean
  cuisine_tags: string[]; service_style: string | null
}

type Review = {
  id: string; rating: number; comment: string | null; created_at: string
  customer: { name: string | null } | null
}

type Vendor = {
  id: string; business_name: string; city: string; vendor_type: string
  profile_type: string; first_name: string | null; last_name: string | null
  profile_photo: string | null; description: string | null
  avg_rating: number | null; is_verified: boolean
  currency: string; price_per_head_min: number | null; price_per_head_max: number | null
  instagram: string | null; menu_packages: Package[]; reviews: Review[]
}

type Params = { id: string }

async function fetchVendor(id: string): Promise<Vendor | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'
  const res = await fetch(`${baseUrl}/api/vendors/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params
  const vendor = await fetchVendor(id)
  if (!vendor) return { title: 'Vendor not found' }
  const name = vendor.profile_type === 'INDIVIDUAL' && vendor.first_name
    ? `${vendor.first_name}${vendor.last_name ? ` ${vendor.last_name}` : ''}`
    : vendor.business_name
  return {
    title: `${name} — ${vendor.vendor_type.replace(/_/g, ' ')} in ${vendor.city} | OneSeva`,
    description: vendor.description?.slice(0, 155) ?? `Book ${name} for your event in ${vendor.city}.`,
  }
}

export default async function PublicVendorProfilePage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const vendor = await fetchVendor(id)
  if (!vendor) notFound()

  const displayName = vendor.profile_type === 'INDIVIDUAL' && vendor.first_name
    ? `${vendor.first_name}${vendor.last_name ? ` ${vendor.last_name}` : ''}`
    : vendor.business_name

  const serviceLabel = vendor.vendor_type.replace(/_/g, ' ').toLowerCase()
    .replace(/^\w/, c => c.toUpperCase())

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-orange-500 to-orange-400" />
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4">
            {vendor.profile_photo ? (
              <img
                src={vendor.profile_photo}
                alt={displayName}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-orange-50 border-4 border-white shadow-md flex items-center justify-center text-3xl">
                🏢
              </div>
            )}
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900">{displayName}</h1>
                {vendor.is_verified && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{serviceLabel} · {vendor.city}</p>
              {vendor.avg_rating !== null && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold text-gray-700">{vendor.avg_rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({vendor.reviews.length} reviews)</span>
                </div>
              )}
            </div>
            <Link
              href={`/login?redirect=/vendors/${vendor.id}`}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Request Quote
            </Link>
          </div>
          {vendor.description && (
            <p className="text-sm text-gray-600 mt-4 leading-relaxed">{vendor.description}</p>
          )}
        </div>
      </div>

      {/* Packages */}
      {vendor.menu_packages.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Packages</h2>
          <div className="space-y-3">
            {vendor.menu_packages.map(pkg => (
              <div key={pkg.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-sm text-gray-600 mt-0.5">{pkg.description}</p>
                    )}
                  </div>
                  {pkg.price_per_head !== null && (
                    <p className="text-sm font-semibold text-orange-600 flex-shrink-0">
                      {vendor.currency}{pkg.price_per_head}/head
                    </p>
                  )}
                </div>
                {(pkg.min_guests || pkg.max_guests) && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {pkg.min_guests && `Min ${pkg.min_guests}`}
                    {pkg.min_guests && pkg.max_guests && ' · '}
                    {pkg.max_guests && `Max ${pkg.max_guests} guests`}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pkg.cuisine_tags.map(tag => (
                    <span key={tag} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                  {pkg.is_halal && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">Halal</span>}
                  {pkg.is_jain && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">Jain</span>}
                  {pkg.is_kosher && <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">Kosher</span>}
                  {pkg.service_style && <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5 capitalize">{pkg.service_style.replace(/_/g, ' ')}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {vendor.reviews.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Reviews</h2>
          <div className="space-y-3">
            {vendor.reviews.map(review => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {review.customer?.name ?? 'Anonymous'}
                  </span>
                </div>
                {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
              </div>
            ))}
          </div>
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
git add src/app/(public)/vendors/[id]/page.tsx
git commit -m "feat: add public vendor profile page with SEO metadata"
```

---

### Task 4: Service-city browse page

**Files:**
- Create: `src/app/(public)/vendors/[service-slug]/[city-slug]/page.tsx`

Server component. H1 is SEO-targeted. Shows OneSeva vendors for service + city. For business services, shows a Google Places placeholder section. For individual services, shows a "Join OneSeva" CTA.

- [ ] **Step 1: Create the file**

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Star, CheckCircle2 } from 'lucide-react'

type Vendor = {
  id: string; business_name: string; city: string
  profile_type: string; first_name: string | null; last_name: string | null
  profile_photo: string | null; avg_rating: number | null; is_verified: boolean
  currency: string; price_per_head_min: number | null; price_per_head_max: number | null
}

type Params = { 'service-slug': string; 'city-slug': string }

const SERVICE_LABELS: Record<string, string> = {
  catering: 'Indian Caterers', photographer: 'Photographers', videographer: 'Videographers',
  decorator: 'Decorators', dj: 'DJs', florist: 'Florists', mehendi: 'Mehendi Artists',
  'makeup-hair': 'Makeup & Hair Artists', transport: 'Transport', 'tent-marquee': 'Tents & Marquees',
  'dhol-player': 'Dhol Players', 'live-band': 'Live Bands', 'classical-musician': 'Classical Musicians',
  choreographer: 'Choreographers', 'pandit-officiant': 'Pandits & Officiants',
  'mc-host': 'MCs & Hosts', bartender: 'Bartenders', 'chai-station': 'Chai Stations',
  'games-entertainment': 'Games & Entertainment', 'invitation-designer': 'Invitation Designers',
  'furniture-rental': 'Furniture Rental', 'equipment-rental': 'Equipment Rental',
}

// Individual service slugs — no Google Places fallback
const INDIVIDUAL_SLUGS = new Set([
  'photographer', 'videographer', 'dj', 'mehendi', 'makeup-hair',
  'dhol-player', 'live-band', 'classical-musician', 'choreographer',
  'pandit-officiant', 'mc-host', 'bartender', 'chai-station',
  'games-entertainment', 'invitation-designer',
])

async function fetchVendors(serviceSlug: string, city: string): Promise<Vendor[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'
  const res = await fetch(
    `${baseUrl}/api/vendors/browse?service=${encodeURIComponent(serviceSlug)}&city=${encodeURIComponent(city)}`,
    { cache: 'no-store' },
  )
  if (!res.ok) return []
  return res.json()
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { 'service-slug': serviceSlug, 'city-slug': citySlug } = await params
  const label = SERVICE_LABELS[serviceSlug]
  if (!label) return { title: 'Vendors — OneSeva' }
  const city = citySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return {
    title: `${label} in ${city} — OneSeva`,
    description: `Find the best ${label.toLowerCase()} for your event in ${city}. Compare profiles, read reviews, and request quotes.`,
  }
}

export default async function BrowsePage({ params }: { params: Promise<Params> }) {
  const { 'service-slug': serviceSlug, 'city-slug': citySlug } = await params

  const label = SERVICE_LABELS[serviceSlug]
  if (!label) notFound()

  const city = citySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const vendors = await fetchVendors(serviceSlug, city)
  const isIndividual = INDIVIDUAL_SLUGS.has(serviceSlug)

  return (
    <div className="space-y-6">
      {/* SEO header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">{label} in {city}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {vendors.length > 0
            ? `${vendors.length} professionals available on OneSeva`
            : 'Be the first to join OneSeva in this area'}
        </p>
      </div>

      {/* OneSeva vendors */}
      {vendors.length > 0 && (
        <div className="space-y-3">
          {vendors.map(v => {
            const displayName = v.profile_type === 'INDIVIDUAL' && v.first_name
              ? `${v.first_name}${v.last_name ? ` ${v.last_name}` : ''}`
              : v.business_name
            return (
              <Link
                key={v.id}
                href={`/vendors/${v.id}`}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 hover:border-orange-300 transition-colors"
              >
                {v.profile_photo ? (
                  <img src={v.profile_photo} alt={displayName} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-2xl">🏢</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-gray-900 text-sm truncate">{displayName}</p>
                    {v.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500">{v.city}</p>
                  {v.avg_rating !== null && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-gray-600">{v.avg_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {(v.price_per_head_min || v.price_per_head_max) && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">from</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {v.currency}{(v.price_per_head_min ?? v.price_per_head_max)}/head
                    </p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Google Places placeholder — business services only */}
      {!isIndividual && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="font-semibold text-gray-700 mb-1">Other local businesses</p>
          <p className="text-sm text-gray-500">
            Additional local businesses not yet on OneSeva will appear here.
          </p>
          <p className="text-xs text-gray-400 mt-1 italic">Google Places integration — coming soon</p>
        </div>
      )}

      {/* Individual service CTA */}
      {isIndividual && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center">
          <p className="font-semibold text-orange-900 mb-1">
            Are you a {label.toLowerCase().replace(/s$/, '')} in {city}?
          </p>
          <p className="text-sm text-orange-700 mb-3">
            Join OneSeva free and get leads from events in your area.
          </p>
          <Link
            href="/register?role=vendor"
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Join free →
          </Link>
        </div>
      )}

      {/* Browse other cities / services */}
      <div className="text-center text-sm text-gray-400">
        <Link href="/vendors" className="hover:text-orange-600 hover:underline">
          Browse all vendor types →
        </Link>
      </div>
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
git add src/app/(public)/vendors/[service-slug]/[city-slug]/page.tsx
git commit -m "feat: add SEO browse page /vendors/[service]/[city]"
```

---

### Task 5: Dynamic sitemap

**Files:**
- Create: `src/app/sitemap.ts`

Next.js will serve this at `/sitemap.xml`. Includes:
1. All active public vendor profile URLs
2. All service-city combinations that have at least one active OneSeva vendor

- [ ] **Step 1: Create the file**

```ts
import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const TYPE_TO_SLUG: Record<string, string> = {
  CATERER: 'catering',
  PHOTOGRAPHER: 'photographer',
  VIDEOGRAPHER: 'videographer',
  DECORATOR: 'decorator',
  DJ: 'dj',
  FLORIST: 'florist',
  MEHENDI_ARTIST: 'mehendi',
  MAKEUP_HAIR: 'makeup-hair',
  TRANSPORT: 'transport',
  TENT_MARQUEE: 'tent-marquee',
  DHOL_PLAYER: 'dhol-player',
  LIVE_BAND: 'live-band',
  CLASSICAL_MUSICIAN: 'classical-musician',
  CHOREOGRAPHER: 'choreographer',
  PANDIT_OFFICIANT: 'pandit-officiant',
  MC_HOST: 'mc-host',
  BARTENDER: 'bartender',
  CHAI_STATION: 'chai-station',
  GAMES_ENTERTAINMENT: 'games-entertainment',
  INVITATION_DESIGNER: 'invitation-designer',
  FURNITURE_RENTAL: 'furniture-rental',
  EQUIPMENT_RENTAL: 'equipment-rental',
}

function citySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

  const vendors = await prisma.vendor.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, vendor_type: true, city: true, updated_at: true },
  })

  // Individual vendor profile URLs
  const profileUrls: MetadataRoute.Sitemap = vendors.map(v => ({
    url: `${baseUrl}/vendors/${v.id}`,
    lastModified: v.updated_at,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Service-city browse URLs (deduplicated)
  const seen = new Set<string>()
  const browseUrls: MetadataRoute.Sitemap = []
  for (const v of vendors) {
    const slug = TYPE_TO_SLUG[v.vendor_type]
    if (!slug) continue
    const cs = citySlug(v.city)
    const key = `${slug}/${cs}`
    if (!seen.has(key)) {
      seen.add(key)
      browseUrls.push({
        url: `${baseUrl}/vendors/${slug}/${cs}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      })
    }
  }

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ...browseUrls,
    ...profileUrls,
  ]
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add dynamic sitemap — vendor profiles + service/city browse pages"
```
