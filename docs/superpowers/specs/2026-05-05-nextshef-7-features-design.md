# NextShef 7 Features for OneSeva — Design Spec

## Goal

Add 7 features from NextShef into OneSeva: Station Templates, Multi-vendor Event Bundling, Cancellation Policies, Vendor Badges, Quote Comparison Highlights, Spend Tracking, and Sustainability Tags.

## Architecture

Schema-light approach: leverage existing models (StationTemplate, VendorStation, CancellationPolicy, VendorBadge, Quote, Review), add minimal new models (EventVendor, CancellationPreset), and compute quote comparison + spend tracking on-the-fly.

---

## Feature 1: Station Templates

**Approach:** Platform catalog (14 seeded) + vendor custom stations (B).

**Schema Changes:**
- `StationTemplate`: Add `is_custom Boolean @default(false)`, `vendor_id String?` (null = platform, set = vendor-created)
- `VendorStation`: Already complete, no changes

**Seed Data (14 templates):**
chaat_counter, dosa_station, tandoor_station, biryani_station, pani_puri, pasta_station, pizza_oven, taco_bar, sushi_rolling, wok_station, carving_station, cocktail_bar, coffee_bar, dessert_station

**API Routes:**
- `GET /api/stations/templates` — list all active templates (public)
- `POST /api/vendor/stations` — vendor adds a station offering (links to template or creates custom)
- `PATCH /api/vendor/stations/[id]` — update offering
- `DELETE /api/vendor/stations/[id]` — remove offering
- `GET /api/vendor/stations` — list vendor's own stations

**Frontend:**
- Vendor dashboard: "Live Stations" tab — manage offerings, create custom templates
- Customer browsing: see vendor's stations on profile

---

## Feature 2: Multi-vendor Event Bundling

**Approach:** Linked quotes with unified dashboard (A).

**New Model: `EventVendor`**
```
EventVendor {
  id            String   @id @default(cuid())
  event_id      String   → Event
  vendor_id     String   → Vendor
  quote_id      String?  → Quote (accepted quote)
  role          String   // "caterer", "bar_service", "desserts", etc.
  setup_time    DateTime?
  service_start DateTime?
  service_end   DateTime?
  notes         String?
  created_at    DateTime @default(now())
  @@unique([event_id, vendor_id])
  @@index([event_id])
}
```

**Auto-population:** When a quote is accepted (status → ACCEPTED), auto-create an EventVendor record linking that vendor to the event.

**API Routes:**
- `GET /api/events/[id]/vendors` — list all vendors for an event (with quotes, timelines)
- `PATCH /api/events/[id]/vendors/[vendorId]` — update timeline/role/notes
- `DELETE /api/events/[id]/vendors/[vendorId]` — remove vendor from event

**Frontend:**
- Customer event page: "Vendors" tab showing all attached vendors, their roles, timelines, total cost summary
- Timeline view: visual timeline of all vendor setup/service windows

---

## Feature 3: Cancellation Policies

**Approach:** Platform templates + vendor customization (B).

**New Model: `CancellationPreset`**
```
CancellationPreset {
  id          String  @id @default(cuid())
  name        String  @unique  // "Flexible", "Moderate", "Strict"
  description String?
  tiers       Json    // [{ hours_before: 72, refund_percent: 100 }, ...]
}
```

**Schema Change:**
- `Vendor`: Add `cancellation_preset_id String?` → CancellationPreset

**Seed Data:**
- Flexible: 48h+ = 100%, 24-48h = 75%, <24h = 50%
- Moderate: 72h+ = 100%, 24-72h = 50%, <24h = 0%
- Strict: 168h+ = 100%, 72-168h = 50%, <72h = 0%

**How it works:**
- Vendor picks a preset OR defines custom tiers in CancellationPolicy table (existing)
- If vendor has preset + custom tiers, custom tiers override
- Cancellation policy displayed on vendor profile and in quote details

**API Routes:**
- `GET /api/cancellation-presets` — list platform presets (public)
- `PUT /api/vendor/cancellation-policy` — set vendor's policy (preset or custom tiers)
- `GET /api/vendors/[id]/cancellation-policy` — view vendor's effective policy (public)

**Frontend:**
- Vendor settings: Choose preset or define custom tiers
- Vendor profile: Display cancellation policy
- Quote detail: Show applicable cancellation terms

---

## Feature 4: Vendor Badges

**Approach:** Fully automatic calculation (A).

**No schema changes** — existing VendorBadge model with BadgeType enum is sufficient.

**Badge Criteria:**
- **TOP_RATED**: avg overall_rating >= 4.5 from Review table, minimum 5 reviews
- **FAST_RESPONDER**: median quote response time < 2 hours (Quote.created_at - Match.created_at) over last 30 days, minimum 5 quotes
- **POPULAR**: 10+ accepted quotes in last 90 days
- **NEW_VENDOR**: vendor created within last 30 days, 0 accepted quotes

**Computation:**
- API endpoint `POST /api/admin/badges/recalculate` — evaluates all vendors, awards/revokes badges
- Can be triggered manually or via cron
- Sets `expires_at` to 30 days from award (badges re-evaluated periodically)

**Frontend:**
- Vendor profile: Display earned badges with icons
- Search results: Show badge icons next to vendor name

---

## Feature 5: Quote Comparison Highlights

**Approach:** Tags + side-by-side comparison table (C).

**No schema changes** — computed on-the-fly from existing Quote data.

**Auto-tags (computed per EventRequest):**
- "Cheapest" — lowest total_estimate among quotes
- "Highest Rated" — vendor with highest avg rating
- "Fastest Response" — shortest time between match creation and quote creation

**Comparison Table Columns:**
- Vendor name + badges
- Price (per head + total)
- Rating (avg + count)
- Response time
- Cancellation policy summary
- Sustainability tags
- Station offerings (if applicable)

**API Route:**
- `GET /api/events/[id]/requests/[requestId]/compare` — returns all quotes with auto-tags and comparison data

**Frontend:**
- Customer quotes page: Comparison table with tag badges (green "Cheapest", gold "Highest Rated", blue "Fastest")

---

## Feature 6: Spend Tracking

**Approach:** Basic summaries from existing data (A).

**No schema changes** — queries existing Quote (ACCEPTED) + PaymentSchedule data.

**Summaries:**
- Per event: total spent, breakdown by vendor
- Account-level: total across all events, breakdown by vendor, by event type

**API Route:**
- `GET /api/events/[id]/spend` — event-level spend summary
- `GET /api/customer/spend` — account-level spend summary with filters (date range, event type)

**Frontend:**
- Customer event page: Spend summary card in overview
- Customer dashboard: "Spending" section with totals and breakdowns

---

## Feature 7: Sustainability Tags

**Approach:** Fixed tag set, vendor self-selected (A).

**Schema Change:**
- `Vendor`: Add `sustainability_tags String[] @default([])`

**Fixed Tags:**
COMPOSTABLE, LOCALLY_SOURCED, ORGANIC, ZERO_WASTE, PLANT_BASED, FAIR_TRADE, SEASONAL_MENU, ENERGY_EFFICIENT

**API:**
- `PATCH /api/vendor/profile` — already exists, just include sustainability_tags in update
- Tags displayed wherever vendor info is shown

**Frontend:**
- Vendor settings: Checkbox list of available tags
- Vendor profile: Display tags with icons
- Search/comparison: Tags visible in results

---

## Implementation Order

1. Schema migration (all models + fields at once)
2. Seed data (station templates + cancellation presets)
3. Station Templates API + UI
4. Sustainability Tags (profile update + display)
5. Cancellation Policies API + UI
6. Vendor Badges computation + display
7. Multi-vendor Event Bundling API + UI
8. Quote Comparison API + UI
9. Spend Tracking API + UI
