# Event Creation Redesign + Public Vendor Discovery

## Goal

Replace the current 5-step event creation wizard with a streamlined 3-step flow. Move service selection and requirements into dedicated per-service pages on the event dashboard. Add public SEO-friendly vendor browse and profile pages. Remove the background matching job.

## Architecture

Event creation collects only essential details. All service-specific setup happens post-creation on the event dashboard via dedicated service pages. Vendor discovery is always visible — no gates before results. OneSeva vendors rank first; Google Places fills every gap. Public pages make vendor profiles indexable by Google from day one.

## Tech Stack

Next.js 16 App Router, Prisma 5, PostgreSQL, Google Places API (already integrated), NextAuth, Tailwind CSS.

---

## Section 1 — Simplified Event Creation Wizard

### What changes

Current: 5 steps (type → details → services → catering prefs → confirm)
New: 3 steps (type → details → confirm)

Steps 3 (services selection) and 4 (catering preferences) are removed from the wizard entirely. The confirm step becomes a simple 2-field summary.

### Steps

**Step 1 — Event Type**
Unchanged. 16 event types in 4 groups. Returns `event_type`.

**Step 2 — Event Details**
Unchanged. Fields: `event_name`, `event_date`, `city`, `venue` (optional), `guest_count`, `total_budget`, `currency`. Same validation.

**Step 3 — Review & Create**
Simple summary of steps 1 and 2. Single "Create Event" button. No service selection, no catering prefs.

### API change — POST /api/events

Remove `selected_services` and `catering_prefs` from the request body and schema. Event creation no longer creates EventRequests or triggers matching. Returns the created event and redirects to `/events/[id]`.

### Files to change

- `src/components/customer/EventWizard.tsx` — remove steps 3, 4; wire step 3 → step 5 (now step 3)
- `src/components/customer/steps/Step3Services.tsx` — delete
- `src/components/customer/steps/Step4CateringPrefs.tsx` — keep file, repurpose as the catering requirements form on the service page
- `src/components/customer/steps/Step5Confirm.tsx` — simplify to show only event details summary
- `src/app/api/events/route.ts` — remove `selected_services`, `catering_prefs` from schema and creation logic

---

## Section 2 — Event Dashboard: Services Section

### What changes

Remove: vendor match preview panel, "Find Vendors" quick action card.

Add: **Services** section — a grid of cards, one per admin-enabled service type.

### Service card states

| State | Visual | Action |
|---|---|---|
| Not added | Grey icon, service name, "Add" button | → `/events/[id]/services/[type]` |
| Requirements saved | Coloured icon, green dot, summary line (e.g. "Vegetarian · North Indian"), "View" button | → `/events/[id]/services/[type]` |
| Has vendors | Same as above + vendor count badge | → `/events/[id]/services/[type]` |

All admin-enabled service types are shown regardless of whether the customer has set them up. The customer can ignore any service they don't need.

### Entry point

Clicking "Add" or "View" on any card navigates to `/events/[id]/services/[type]`. No modals, no inline forms.

### Files to change

- `src/app/(customer)/events/[id]/page.tsx` — add Services section, remove vendor match preview

---

## Section 3 — Service Page

### Route

`/events/[id]/services/[type]` (e.g. `/events/abc123/services/catering`)

### Service type classification

Services split into two categories based on who typically provides them:

**Business services** — registered businesses, appear on Google Maps
- CATERER, FLORIST, DECORATOR, TRANSPORT, TENT_MARQUEE, FURNITURE_RENTAL, EQUIPMENT_RENTAL

**Individual services** — freelancers and sole traders, not on Google Maps
- PHOTOGRAPHER, VIDEOGRAPHER, DJ, MEHENDI_ARTIST, MAKEUP_HAIR, DHOL_PLAYER, LIVE_BAND, CLASSICAL_MUSICIAN, CHOREOGRAPHER, PANDIT_OFFICIANT, MC_HOST, BARTENDER, CHAI_STATION, GAMES_ENTERTAINMENT, INVITATION_DESIGNER

This distinction drives two different fallback strategies when no OneSeva vendors are available.

### Layout — All service types

The service page has the same three-section structure regardless of service class:

**Top — Requirements panel** (collapsible once saved)
Service-specific form. Visible by default; collapsed to a summary bar once saved with an "Edit" button.

**Middle — OneSeva vendors/professionals**
Ranked by relevance (location + requirements fit + rating).
- Business services: card shows business logo, company name, city, tier badge, rating, pricing, "Request Quote" button.
- Individual services: card shows portrait photo, first + last name, skill tags, portfolio strip, rating, starting price, "Request Quote" button.

If no OneSeva vendors exist for this service type + city, this section is hidden.

**Bottom — Public request board panel** (shown for ALL service types once requirements are saved)
A panel labelled "Your request is live — anyone can respond." Shows the public request URL, response count, and status (Open / Filled). Anyone — registered vendors, freelancers, or members of the public — can find this request and respond. This is the platform's growth engine: every event request is a job posting, naturally building a supply-side community.

**Additionally for Business services only:**
A fourth section: **Other local businesses** — Google Places results below the request board panel. Card shows: name, Google rating, review count, phone number, address. Labelled "Not on OneSeva yet — call to enquire".

### Open request board — public, SEO-indexed

When a customer saves requirements for any service type (individual or business), the `EventRequest` is created with a public token URL:

`/requests/[service-slug]/[city-slug]/[token]`

Examples:
- `/requests/photographer/london/abc123`
- `/requests/dj/birmingham/xyz789`
- `/requests/caterer/manchester/def456`

**What is shown publicly (no login required):**
- Service type + city
- Event type (Wedding, Birthday…)
- Event date (month + year only, not exact date)
- Guest count
- Budget range (e.g. "£500–£1,000") — not exact
- Requirements (style, cuisine, hours etc.)
- Number of responses received
- Status: Open / Filled

**What is never shown publicly:**
- Customer name, phone, email, venue, exact date

**Anyone can respond — no account required:**
Clicking "I can help" opens a response form:
- Name
- WhatsApp / phone number
- Brief pitch (2–3 sentences)
- Rough price / rate
- Optional: link to Instagram, website, or portfolio

Submitting the form creates a `RequestResponse` record linked to the `EventRequest`. The respondent gets a confirmation message: "Your response has been sent. The host will review and contact you if interested."

**Registered OneSeva vendors** see the same public requests on their leads feed (`/vendor/leads`) — their profile is attached automatically when they respond, so they don't need to fill the form manually.

**Host dashboard:**
Customer sees all responses on `/events/[id]/services/[type]` — name, pitch, price, portfolio link. They can:
- **Ask for full quote** → sends responder a magic link (email + WhatsApp if available) to submit a structured quote — no account required
- **Mark as filled** → request page shows "This request has been filled", no new responses accepted
- **Ignore** → no action needed

All responses and quotes — from both the public board and OneSeva vendors — appear in one unified view (see Section 3a — Unified Quotes).

Responders who submit a full quote via magic link see a nudge after submission: "Want to manage bookings and get more leads? Create your OneSeva profile free →". Registration is optional, never a gate.

**SEO value:**
Each public request page is indexable. A photographer Googling "wedding photography jobs London June 2026" can find it. Customer can share the link on WhatsApp: "Anyone know a good DJ? Here's my request."

**Request lifecycle:**
```
OPEN → responses come in → host accepts one or more → FILLED (or auto-expires 2 weeks after event date)
```

### Vendor profile card distinction

**Business vendor card:** business logo/photo, company name, city, tier badge, Google-style rating, price range, "Request Quote"

**Individual professional card:** personal portrait photo, first name + last name, city, skill tags (e.g. "Candid · Traditional · Drone"), portfolio strip (3 thumbnail photos), rating, starting price, "Request Quote"

Vendor onboarding sets `profile_type: BUSINESS | INDIVIDUAL` on the Vendor model. Individual profiles show name fields instead of business name, and portfolio is more prominent than packages.

### Requirements forms per service type

Each service type has its own hardcoded question set. No dynamic form builder.

**CATERER**
- Dietary type (Non-Veg / Vegetarian / Vegan)
- Certifications (Halal, Jain, Kosher)
- Allergen-free (Nut-free, Gluten-free, Dairy-free, Egg-free)
- Cuisine preferences (multi-select: North Indian, Punjabi, South Indian, Mughlai, Gujarati, Rajasthani, Bengali, Hyderabadi, Maharashtrian, Continental, Chinese)
- Service style (Buffet, Seated, Live Counters, Family Style)
- Pricing preference (No preference / Per person / By tray)
- Tray wishlist (if By tray selected — item name + qty)
- Menu specification (Let caterer decide / I'll specify counts)
- Special notes

**PHOTOGRAPHER**
- Event coverage hours (number input)
- Style (Candid / Traditional / Both)
- Indoor / Outdoor / Both
- Deliverables (Online gallery / Prints / Album / Drone shots)
- Special notes

**DECORATOR**
- Theme / colour scheme (free text)
- Venue type (Banquet hall / Outdoor / Home / Other)
- Items needed (Floral / Lighting / Backdrop / Table decor / Balloon decor — multi-select)
- Special notes

**DJ**
- Event hours (number input)
- Music genre (Bollywood / Bhangra / Hip-hop / Mixed / Classical — multi-select)
- Equipment needed (Yes — DJ brings own / No — venue has setup)
- Special notes

**MEHENDI_ARTIST**
- Style (Traditional / Arabic / Fusion)
- Number of people needing mehendi
- Occasion (Mehendi ceremony / Wedding day / Other)
- Special notes

**MAKEUP_HAIR**
- Number of people
- Services needed (Bridal makeup / Bridesmaid / Hair styling / Saree draping — multi-select)
- Special notes

**FLORIST**
- Arrangements needed (Bouquets / Centrepieces / Mandap / Car decoration / Garlands — multi-select)
- Flower preference (free text, optional)
- Special notes

**All other enabled service types** — show a single "Special notes / requirements" textarea until specific questions are defined.

### Ranking logic (computed at query time, no pre-stored scores)

For OneSeva vendors, score = weighted sum:
- Location distance to event city: 40%
- Requirements fit (dietary match, cuisine overlap): 35%
- Avg rating: 15%
- Verified status: 10%

Computed in the API handler, not a background job. Returns sorted list.

### Quote request flow

Customer clicks "Request Quote" on an OneSeva vendor card:
1. Creates an `EventRequest` record for this event + service type (if not exists)
2. Creates a `Match` record linking the EventRequest to the vendor
3. Saves the service requirements to `EventMenuPreference` (catering) or a generic notes field (other types)
4. Enqueues a lead notification to the vendor
5. Redirects customer to the quotes page

This is the billable event for future pay-per-lead monetisation. The Match record is the lead.

### Files to create/change

- `src/app/(customer)/events/[id]/services/[type]/page.tsx` — new page
- `src/app/api/events/[id]/services/[type]/route.ts` — GET (fetch saved requirements + vendors), POST (save requirements)
- `src/app/api/events/[id]/services/[type]/request-quote/route.ts` — POST (create EventRequest + Match + notify)

---

## Section 3a — Unified Quotes & Responses

### Concept

Every quote and every public board response for an event appears in one place: the global quotes page at `/events/[id]/quotes`. Customers never need to check two separate pages. The page groups entries by service type and shows a summary table with an expandable detail panel.

### Two entry types

| | OneSeva vendor quote | Public board response |
|---|---|---|
| Source | Registered vendor used the quote builder | Anyone responded via `/requests/...` |
| Initial data | Structured (per-head/tray, menu, line items, discount) | Unstructured (name, pitch, rough price note) |
| Full quote | Already submitted | Triggered by "Ask for full quote" → magic link |
| Display | Rich detail: menu, dietary, tray lines | Pitch text + what's included + service details |
| Actions | Accept · Negotiate · Reject | Ask for full quote · Accept · Decline |

### Page layout

```
My Quotes                              [Filter: All ▾  or  by service type]

─── Catering (3) ──────────────────────────────────────────────────────────
 Name              Price       Type          Status     Action
 Royal Caterers    £28/head    Full quote    Sent       [View]
 Ahmed's Kitchen   ~£25/head   Pitch only    Replied    [Ask for full quote]
 Spice Garden      £32/head    Full quote    Sent       [View]

─── Photography (1) ────────────────────────────────────────────────────────
 Priya Sharma      £600/day    Pitch only    Replied    [Ask for full quote]
```

Clicking any row expands an inline detail panel:
- **Full quote rows:** show the full quote breakdown (menu, tray lines, discount, totals) — same content as the existing quote detail page.
- **Pitch-only rows:** show the responder's pitch, price note, portfolio link, and phone (if already accepted).
- **Full quote via magic link rows:** show the structured what's included + service details form they filled in.

### Schema additions to RequestResponse

To support the two-stage pitch → full quote flow, add to `RequestResponse`:

```prisma
email              String?      // for magic link delivery
quote_token        String?  @unique @default(cuid())  // magic link token
quoted_price       Decimal?
price_unit         String?      // "per_head" | "per_event" | "per_hour" | "per_day"
what_includes      String?      // free text: what is covered
service_details    String?      // dietary, equipment, style, hours — JSON or free text
availability_note  String?      // "Available on your date" / "Need to confirm"
quote_submitted_at DateTime?
```

`quote_token` is always generated. The magic link is `/quote-request/[quote_token]`. Accessible without login.

### Magic link flow

```
Customer clicks "Ask for full quote" on a pitch-only response
  → PATCH /api/requests/[token] { action: "request_full_quote", response_id }
  → System sends email + WhatsApp (if phone available) to responder:
    "Hi [Name], [Customer's event type] in [City] wants a full quote from you.
     Fill in the details here → oneseva.com/quote-request/[quote_token]"
  → RequestResponse.status updated to "QUOTE_REQUESTED"

Responder opens /quote-request/[quote_token]
  → Sees: event type, city, guest count, budget band, requirements
  → Fills: price + unit, what's included, service details, availability note
  → Submits → RequestResponse updated with structured fields + quote_submitted_at
  → Confirmation page: "Quote sent! Create your OneSeva profile to get more leads →"
  → Customer notified: "[Name] sent you a full quote"
```

### Lightweight quote form fields

At `/quote-request/[quote_token]` (no login required):

- **Price** (number) + **Unit** (per person / per event / per hour / per day)
- **What's included** (textarea — e.g. "Setup, service staff, cleanup, crockery")
- **Service details** — service-type-specific questions:
  - Catering: dietary options covered, cuisine, service style
  - Photography: hours covered, deliverables (gallery, album, drone)
  - DJ: hours, equipment provided (yes/no), genres
  - Other types: free text "Tell them what you offer"
- **Availability** (radio: "I'm available on this date" / "I need to confirm availability" / "I'm not available — suggesting alternative")
- **Any other notes** (optional textarea)

### Files to create/change

- `src/app/(customer)/events/[id]/quotes/page.tsx` — rewrite as unified table grouped by service type
- `src/app/(public)/quote-request/[token]/page.tsx` — lightweight quote form (no auth)
- `src/app/api/quote-request/[token]/route.ts` — GET (prefill event details), POST (save structured quote)
- `prisma/schema.prisma` — add fields to `RequestResponse`

---

## Section 4 — Admin Service Catalogue

### Schema

New models:

```prisma
model ServiceConfig {
  id             String  @id @default(cuid())
  vendor_type    String  @unique
  is_enabled     Boolean @default(false)
  sort_order     Int     @default(0)
  label          String
  icon           String
  service_class  String  @default("BUSINESS") // "BUSINESS" | "INDIVIDUAL"
}
```

`service_class` drives which layout and fallback the service page uses. Seeded with all 26 vendor types. Initially 7 enabled: CATERER, DECORATOR, PHOTOGRAPHER, DJ, MEHENDI_ARTIST, MAKEUP_HAIR, FLORIST.

**EventRequest additions:**
```prisma
// Added to EventRequest model:
public_token   String   @unique @default(cuid())
is_public      Boolean  @default(true)
public_status  String   @default("OPEN") // "OPEN" | "FILLED" | "EXPIRED"
```

**New model — RequestResponse:**
```prisma
model RequestResponse {
  id              String       @id @default(cuid())
  event_request_id String
  vendor_id       String?      // null if respondent is not a registered vendor
  name            String
  phone           String?
  pitch           String
  price_note      String?
  portfolio_url   String?
  status          String       @default("PENDING") // "PENDING" | "ACCEPTED" | "DECLINED"
  created_at      DateTime     @default(now())
  event_request   EventRequest @relation(fields: [event_request_id], references: [id], onDelete: Cascade)
  vendor          Vendor?      @relation(fields: [vendor_id], references: [id])
}
```

**Vendor model addition:**
```prisma
// Added to Vendor model:
profile_type  String  @default("BUSINESS") // "BUSINESS" | "INDIVIDUAL"
first_name    String?
last_name     String?
```
Individual vendors use `first_name` + `last_name` for display. `business_name` stays for business vendors.

### Admin page — `/admin/services`

Table of all service types. Columns: Icon, Label, Enabled toggle, Sort order (drag or number input). Toggle updates `is_enabled` via PATCH `/api/admin/services/[type]`.

Disabled service types are hidden from customer dashboards. Enabled types show even with zero OneSeva vendors signed up — Google Places fills the gap.

### Files to create

- `prisma/schema.prisma` — add `ServiceConfig` model
- `src/app/admin/services/page.tsx` — admin toggle page
- `src/app/api/admin/services/route.ts` — GET all configs
- `src/app/api/admin/services/[type]/route.ts` — PATCH enable/disable

---

## Section 5 — Public Vendor Pages

### Public vendor profile — `/vendors/[id]`

No authentication required to view. Shows:
- Business name, city, tier badge, verification badge
- Profile photo + gallery
- About / description
- Menu packages (for caterers) or service offerings
- Reviews and avg rating
- Pricing range

Call to action:
- Logged-in customer: "Request Quote" → initiates quote flow
- Logged-out visitor: "Request Quote" → redirects to login, then back to this page

### Public browse pages — `/vendors/[service-slug]/[city-slug]`

SEO-friendly URLs. Examples:
- `/vendors/catering/london`
- `/vendors/photographer/birmingham`
- `/vendors/dj/manchester`

Page shows:
- H1: "Indian Caterers in London" / "Wedding Photographers in Birmingham" (for SEO)
- OneSeva vendors/professionals for that service type + city — sorted by rating
- For business services: Google Places results below — labelled "Other local businesses"
- For individual services: no Google Places — instead a CTA "Are you a photographer in Birmingham? Join OneSeva free"
- Meta title + description for Google indexing

Service slug mapping (hardcoded):
- `catering` → CATERER
- `photographer` → PHOTOGRAPHER
- `decorator` → DECORATOR
- `dj` → DJ
- `florist` → FLORIST
- `mehendi` → MEHENDI_ARTIST
- `makeup-hair` → MAKEUP_HAIR

No authentication required. No event context — pure discovery.

### Sitemap

`/sitemap.xml` generated dynamically. Includes all public vendor profile URLs + all service/city combinations that have at least one OneSeva vendor.

### Files to create

- `src/app/(public)/vendors/[id]/page.tsx` — public vendor profile
- `src/app/(public)/vendors/[service-slug]/[city-slug]/page.tsx` — public browse page
- `src/app/sitemap.ts` — dynamic sitemap
- `src/app/api/vendors/[id]/route.ts` — public vendor API (no auth)
- `src/app/api/vendors/public/route.ts` — public browse API (no auth)

---

## Section 6 — Matching Algorithm

### What is removed

- Background match job (`src/lib/jobs/match.ts`) — no longer triggered at EventRequest creation
- Auto-creation of EventRequests and Match records at event creation
- The 5-vendor-limit pre-computation

### What is kept

- `Match` model — still used for vendor leads and quote flow
- Scoring logic — moved to a utility function called at query time when rendering the service page vendor list
- `EventRequest` model — still created when customer requests a quote from a specific vendor
- `service_notes String?` added to `EventRequest` — stores requirements for non-catering service types (photographer hours/style, DJ genre, etc.) as a JSON string. Catering still uses `EventMenuPreference`.

### New utility

`src/lib/matching/rank-vendors.ts` — pure function, takes vendor list + event requirements, returns sorted list. No DB writes.

---

## Section 7 — Monetisation Foundation

No payment implemented now. Everything is free to use.

**Two future monetisation levers — no implementation required yet, but architecture must not block them:**

**1. Pay-per-lead (vendor side)**
- A **lead** = a `Match` record created when customer clicks "Request Quote" on a vendor
- `Match` records store `created_at` — sufficient for future billing
- Gate: add a payment check before the lead notification is sent to the vendor

**2. Response credits (public request board)**
- Responding to public requests will eventually cost credits
- Free tier: 3–5 responses/month per person/account (exact number TBD)
- Beyond free tier: purchase a credit pack
- Architecture requirement: `RequestResponse.email` (added in Section 3a) is also the identifier for credit tracking per person
- For now all responses are free
- When credits are introduced: add `credits_used Boolean @default(false)` to `RequestResponse` and a `ResponderCredit` table — no other schema changes needed

**Posting events is always free.** We never charge customers to post. Revenue comes from the supply side (vendors paying for leads and response credits).

---

## Data Flow Summary

```
Customer creates event (3 steps)
  → Event record created
  → Redirects to /events/[id]

Customer opens a BUSINESS service page (/events/[id]/services/catering)
  → Fetches OneSeva vendors (ranked live) + Google Places vendors
  → Customer fills requirements (saved on submit)
  → Results re-rank based on requirements
  → Customer clicks "Request Quote" → EventRequest + Match created → vendor notified

Customer opens any service page (/events/[id]/services/photographer)
  → Fetches OneSeva professionals (ranked live)
  → Customer fills requirements → EventRequest created
  → Public request page goes live: /requests/photographer/london/[token]
  → Indexed by Google, shareable via link

Anyone finds the public request (Google, shared link, vendor leads feed)
  → Sees event details, NO host contact info
  → Clicks "I can help" → fills name, phone, pitch, price
  → RequestResponse record created → host notified

Host reviews responses on their dashboard (unified quotes page, grouped by service)
  → Clicks "Ask for full quote" on a pitch-only response
  → System sends magic link via email + WhatsApp to responder
  → Responder fills lightweight quote form at /quote-request/[token] (no login)
  → Quote appears in unified table alongside OneSeva vendor quotes
  → Host compares all, accepts or negotiates

Vendor (business) receives lead
  → Builds quote via quote builder → Sends to customer
  → Quote appears in same unified table

Vendor profile viewed publicly (/vendors/[id])
  → No auth required
  → Business: company card. Individual: person card with portfolio
  → "Request Quote" → login → quote flow

SEO browse pages (/vendors/catering/london, /vendors/photographer/birmingham)
  → No auth required
  → Business services: OneSeva vendors + Google Places
  → Individual services: OneSeva professionals + "Join OneSeva" CTA
  → Drives organic traffic
```

---

## Section 8 — Privacy & Contact Reveal

### Principle

Event requirements are visible within the platform. Customer identity and contact details are never shown until the customer explicitly initiates contact with a specific vendor or professional.

### What is always visible to vendors/professionals

On the open request board and in leads:
- Event type (Wedding, Birthday, Corporate…)
- Event date
- City
- Guest count
- Budget range (e.g. "£1,000–£2,000") — not exact figure
- Service requirements (dietary, style, hours, etc.)
- Number of days until event

### What is never shown until contact is initiated

- Customer full name
- Customer phone number
- Customer email
- Exact venue/address
- Any other personally identifiable information

### Contact reveal triggers

**Browsing OneSeva vendors (customer initiates):**
Customer clicks "Request Quote" on a specific vendor card → customer details revealed to that vendor only. Customer is always in control.

**Public open request — anyone responds:**
Respondent submits the "I can help" form → they see NO customer details. Customer receives a notification: "3 people have responded to your photographer request." Customer reviews each response (name, pitch, price, portfolio) and clicks "Accept & share details" → contact details (phone/WhatsApp) revealed to that respondent only. Others never see customer details.

**Declined / ignored:**
If customer ignores a response, the respondent never sees their details. No match is created.

### Public pages

No customer data appears on public SEO pages (`/vendors/catering/london`). These pages show vendor listings only. Zero privacy risk.

### Why this matters

1. **Customer safety** — personal details not exposed to unknown vendors
2. **Platform retention** — vendors cannot bypass OneSeva to deal directly with customers before the platform gets credit for the lead
3. **Pay-per-lead readiness** — the reveal moment is the billable event. Charging vendors to unlock contact details is a clean, enforceable model

---

## What This Is Not

- No invitation system (separate spec)
- No in-app payments (future)
- No dynamic form builder for service questions (hardcoded per type for now)
- No vendor self-serve slug customisation (auto-generated from business name)
