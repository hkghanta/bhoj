# NextShef Features Port to OneSeva — Design Spec

## Goal

Port 7 unique NextShef features into OneSeva's Next.js/Prisma/PostgreSQL stack, following OneSeva's existing patterns (API routes, auth, Prisma ORM, component structure).

## Architecture

All features are implemented as:
- **Prisma schema additions** in `prisma/schema.prisma`
- **Next.js API routes** in `src/app/api/`
- **Frontend pages** in `src/app/(vendor)/` and `src/app/(customer)/`
- **Shared components** in `src/components/`
- Auth via existing next-auth session (`getServerSession`)

No new infrastructure. No new databases. Everything extends the existing OneSeva stack.

---

## Feature 1: Quote Negotiation

### Problem
OneSeva quotes are accept/decline only. Customers can't counter-offer on price or request changes through a structured flow — they can only send a chat message.

### Design

**New Prisma Model: `QuoteNegotiation`**
```
- id, quote_id (FK → Quote), sender_id, sender_type (CUSTOMER/VENDOR)
- message, suggested_total, suggested_per_head
- menu_changes (Json — [{action: 'add'|'remove'|'modify', item_name, category?, notes?}])
- proposed_menu (Json — full revised menu if provided)
- action_type: COUNTER_OFFER | MENU_CHANGE | REVISION | MESSAGE
- created_at
```

**New QuoteStatus value:** `NEGOTIATING` (added to QuoteStatus enum)

**Quote status flow change:**
```
DRAFT → SENT → VIEWED → NEGOTIATING ↔ (back and forth) → ACCEPTED | DECLINED
```

**API Routes:**
- `POST /api/quotes/[id]/counter-offer` — customer sends counter-offer (price + optional menu changes + message)
- `POST /api/quotes/[id]/revise` — vendor revises quote in response (updates Quote record, resets status to SENT)
- `GET /api/quotes/[id]/negotiations` — negotiation history for both parties

**Frontend:**
- **Customer quote detail page** (`/events/[id]/quotes/[quoteId]`): Add "Negotiate Price" button that opens a modal with:
  - Current price display
  - Suggested price input
  - Message textarea
  - Menu change toggles (reuse existing customization UI)
  - Send button
- **Negotiation history** section below quote details (chat-like timeline)
- **Vendor quote builder**: Show incoming counter-offers with "Revise Quote" action
- **Status badge**: Yellow "Negotiating" badge

---

## Feature 2: Auto-Quote Engine

### Problem
Vendors must manually build quotes for every request. High-volume caterers waste hours on repetitive quoting.

### Design

**New Prisma Model: `AutoQuoteRule`**
```
- id, vendor_id (FK → Vendor)
- name, is_active
- Matching: event_types (String[]), guest_count_min, guest_count_max, cuisine_match (String[])
- Pricing: menu_package_id (FK → MenuPackage), markup_percent (Decimal), include_delivery (Boolean)
- auto_message (String — template message sent with auto-quote)
- created_at, updated_at
```

**How it works:**
1. When customer creates an EventRequest for CATERER type, system checks all active AutoQuoteRules
2. For each matching rule: event type matches, guest count in range, cuisine overlap
3. Auto-creates a Quote from the linked MenuPackage, applying markup_percent to price_per_head
4. Quote marked with `is_auto_generated: true` (new Boolean field on Quote model)
5. Auto-quote sent immediately (status = SENT)

**API Routes:**
- `POST /api/vendor/auto-quote-rules` — create rule
- `GET /api/vendor/auto-quote-rules` — list vendor's rules
- `PATCH /api/vendor/auto-quote-rules/[id]` — update rule
- `DELETE /api/vendor/auto-quote-rules/[id]` — delete rule

**Frontend:**
- **Vendor settings page** (`/vendor/auto-quotes`): CRUD interface for rules
  - Rule card: name, event types, guest range, linked menu package, markup %, active toggle
  - Create/edit modal: event type multi-select, guest range inputs, menu package dropdown, markup slider
- **Quote list**: Badge for auto-generated quotes
- **Customer side**: Auto-quotes appear like normal quotes with an "Auto-generated" subtle badge

**Integration point:** Hook into EventRequest creation flow — after request is saved, call `processAutoQuotes(eventRequest)`.

---

## Feature 3: Live Station Templates

### Problem
OneSeva has no concept of live cooking stations (sushi bars, taco bars, etc.) — a popular catering add-on.

### Design

**New Prisma Models:**

`StationTemplate` (seeded, admin-managed):
```
- id, station_key (unique, e.g. "sushi_rolling"), name, description, icon
- typical_min_guests, typical_max_guests
- active
```

`VendorStation` (vendor-specific offerings):
```
- id, vendor_id (FK → Vendor), station_template_id (FK → StationTemplate)
- pricing_model: FLAT | PER_PERSON | HOURLY
- base_price, price_per_person, hourly_rate
- min_guests, max_guests, includes_chef, includes_equipment
- description, photos (String[])
- is_active
```

**Seed data:** 14 templates — sushi_rolling, taco_bar, pasta_station, pizza_oven, carving_station, wok_station, crepe_station, cocktail_bar, coffee_bar, raw_bar, build_your_own, hibachi, smoker_bbq, fondue_station

**API Routes:**
- `GET /api/stations/templates` — list all templates (public)
- `GET /api/stations/search?type=sushi_rolling&guests=50&city=Houston` — search vendors offering stations
- `POST /api/vendor/stations` — add station offering
- `PATCH /api/vendor/stations/[id]` — update
- `DELETE /api/vendor/stations/[id]` — remove
- `GET /api/vendors/[id]/stations` — list vendor's stations (public)

**Frontend:**
- **Vendor dashboard**: "Live Stations" section to manage offerings
- **Customer event services**: Browse available stations when planning event; filter by type/guest count
- **Vendor profile page**: Show offered stations with pricing

---

## Feature 4: Equipment Catalog

### Problem
OneSeva has EQUIPMENT_RENTAL as a vendor type but no structured catalog — vendors can't list specific equipment with pricing.

### Design

**New Prisma Model: `VendorEquipment`**
```
- id, vendor_id (FK → Vendor)
- equipment_key (String — e.g. "chafing_dishes", "tables", "linens")
- name, description
- price_per_unit (Decimal?), price_per_event (Decimal?)
- quantity_available (Int), min_rental_hours (Int, default 4)
- photos (String[]), is_active
- @@unique([vendor_id, equipment_key])
```

**Standard equipment keys:** chafing_dishes, serving_ware, tables, chairs, linens, bar_equipment, tents, lighting, beverage_dispensers, dinnerware, flatware, glassware

**API Routes:**
- `GET /api/equipment/search?type=chafing_dishes&city=Houston` — search (public)
- `POST /api/vendor/equipment` — add listing
- `PATCH /api/vendor/equipment/[id]` — update
- `DELETE /api/vendor/equipment/[id]` — remove
- `GET /api/vendors/[id]/equipment` — list vendor's equipment (public)

**Frontend:**
- **Vendor dashboard**: "Equipment" management section
- **Customer browsing**: Equipment search with filters
- **Integration with event checklist**: Link equipment bookings to checklist items

---

## Feature 5: Staffing Catalog

### Problem
No way for vendors to list available staff with structured pricing and availability.

### Design

**New Prisma Model: `VendorStaffListing`**
```
- id, vendor_id (FK → Vendor)
- staff_role_key (String — e.g. "server", "bartender", "chef_onsite")
- hourly_rate (Decimal), min_hours (Int, default 4)
- max_staff_available (Int)
- includes_uniform (Boolean), background_checked (Boolean)
- description, is_active
- @@unique([vendor_id, staff_role_key])
```

**Standard roles:** server, bartender, event_coordinator, chef_onsite, cleanup_crew

**API Routes:** Same pattern as equipment — search, vendor CRUD, public listing.

**Frontend:** Same pattern as equipment — vendor management + customer browsing.

---

## Feature 6: Cancellation Policies

### Problem
No structured cancellation/refund rules. Cancellations are ad-hoc.

### Design

**New Prisma Model: `CancellationPolicy`**
```
- id, vendor_id (FK → Vendor)
- hours_before_event (Int — e.g. 168 = 7 days, 48 = 2 days)
- refund_percent (Int, 0-100)
- description (String)
- @@unique([vendor_id, hours_before_event])
```

Example tiers for a vendor:
- 168+ hours (7+ days): 100% refund
- 48-168 hours (2-7 days): 50% refund
- 0-48 hours (< 2 days): 0% refund

**API Routes:**
- `GET /api/vendors/[id]/cancellation-policy` — view (public)
- `PUT /api/vendor/cancellation-policy` — set tiers (vendor, accepts array)
- `GET /api/events/[id]/cancellation-preview?quoteId=xxx` — calculate refund for customer

**Frontend:**
- **Vendor settings**: Define cancellation tiers
- **Vendor profile**: Show policy to customers
- **Customer event page**: "Cancel" button shows refund preview before confirming

---

## Feature 7: Contract Management

### Problem
No formal agreement after quote acceptance. Everything is informal.

### Design

**New Prisma Models:**

`ContractTemplate`:
```
- id, vendor_id (FK → Vendor), name, content (Text), terms_and_conditions (Text)
- is_default (Boolean), created_at
```

`Contract`:
```
- id, contract_number (unique auto-generated)
- vendor_id, customer_id, quote_id (FK → Quote), event_id (FK → Event)
- template_id (FK → ContractTemplate, optional)
- content, terms_and_conditions
- status: DRAFT | SENT | SIGNED | CANCELLED
- expires_at, created_at, updated_at
```

`ContractSignature`:
```
- id, contract_id (FK → Contract)
- signer_id, signer_role (CUSTOMER/VENDOR), signer_name
- signature_data (Text — base64 or typed text)
- signature_type: DRAWN | TYPED
- ip_address, user_agent
- signed_at
```

`ContractAmendment`:
```
- id, contract_id (FK → Contract)
- proposed_by, proposed_by_role (CUSTOMER/VENDOR)
- description, new_total (Decimal?)
- status: PROPOSED | ACCEPTED | REJECTED
- created_at, responded_at
```

**API Routes:**
- Templates: CRUD under `/api/vendor/contract-templates`
- Contracts: `POST /api/contracts` (create from quote), `GET /api/contracts/[id]`, `PATCH /api/contracts/[id]/send`
- Signing: `POST /api/contracts/[id]/sign`
- Amendments: `POST /api/contracts/[id]/amendments`, `PATCH /api/contracts/[id]/amendments/[aid]/accept|reject`

**Frontend:**
- **Vendor**: Contract template editor, send contract after quote acceptance
- **Customer**: View contract, sign (drawn/typed), propose amendments
- **Both**: Amendment history, signature audit trail

---

## Implementation Order

1. **Quote Negotiation** — schema + API + UI (extends existing quote pages)
2. **Auto-Quote Engine** — schema + API + vendor settings page + hook into EventRequest
3. **Live Stations** — schema + seed + API + vendor/customer pages
4. **Equipment Catalog** — schema + API + vendor/customer pages
5. **Staffing Catalog** — schema + API + vendor/customer pages
6. **Cancellation Policies** — schema + API + vendor settings + customer preview
7. **Contract Management** — schema + API + vendor/customer pages (most complex, last)

Each feature is independent and can be shipped incrementally.

---

## Tech Notes

- All new models go in `prisma/schema.prisma` with proper relations and indexes
- API routes follow OneSeva pattern: `src/app/api/[resource]/route.ts` with session auth
- Frontend uses existing shadcn/ui components, Tailwind CSS, Lucide icons
- Follow `AGENTS.md`: Read Next.js docs in `node_modules/next/dist/docs/` before writing code
- Prisma migrations via `npx prisma migrate dev`
- No new dependencies needed
