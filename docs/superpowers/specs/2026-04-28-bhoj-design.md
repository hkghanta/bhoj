# Bhoj — Indian Event Services Marketplace
## Design Specification
**Date:** 2026-04-28  
**Status:** Approved for implementation planning

---

## 1. Overview

Bhoj is an international Indian event services marketplace and planning platform. Customers discover, compare, and track vendors for Indian events (weddings, corporate, social, festivals). Vendors list their services, receive algorithmically matched leads, and submit quotes.

**Core differentiator:** Concierge-style algorithmic matching in a completely unserved global niche — Indian diaspora events in US, UK, Canada, Australia.

**Launch markets:** United States, United Kingdom, Canada, Australia. India expansion in Phase 2.

**Platform model:** Hybrid — algorithmic matching with self-improving scoring engine. Customers submit event requests; algorithm surfaces the best 3–5 vendors per category. Quotes exchanged on-platform; finalization happens offline.

**Not a transaction platform.** No payment processing between parties. Revenue comes from vendor subscriptions and customer event passes.

---

## 2. Competitive Position

| Platform | Gap |
|---|---|
| WeddingWire / The Knot | Generic, no Indian focus, no curation |
| Sulekha | Lead spam, no vetting, India-only |
| HoneyFiddler | India-only, passive directory |
| Cater2.me | US corporate lunches only |
| EazyDiner | Restaurant booking, not event catering |

**White space:** No funded platform combines Indian cuisine/culture specialisation + international diaspora reach + concierge matching. Indian weddings in UK/US/Canada average £40k–£150k. Discovery still happens via WhatsApp groups.

---

## 3. Revenue Model

### Vendor Side (recurring)

| Tier | Price | Leads/month | Features |
|---|---|---|---|
| Free | $0 | 3 | Listed, basic profile, appears in search |
| Pro | $49/mo | Unlimited | Priority matching, full portfolio, reviews, tasting feature |
| Premium | $99/mo | Unlimited | Top placement, verified badge, analytics dashboard, multiple locations |

- Tier boost: flat +5 points in algorithm score (quality signals always dominate)
- Auto-suppression: response rate < 40% or hidden feedback avg < 2.5 → removed from matching pool

### Customer Side (per event)

| Tier | Price | Features |
|---|---|---|
| Free | $0 | Up to 5 matched vendors shown, request quotes from up to 3 per category |
| Event Pass | $29–$49 per event | Unlimited vendor quotes, priority matching, extended search beyond top picks, all premium checklist features, PDF export, collaborator access (up to 10), WhatsApp notifications |

- One-time per event, not a subscription — removes friction for occasional users
- High-spend events make the pass trivial (£30 on a £30,000 wedding)

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Web | Next.js 15 (App Router, React Server Components, SEO-optimised) |
| Mobile | React Native + Expo (iOS + Android, shared business logic) |
| API | Next.js API Routes |
| Matching Engine | Weighted scoring (Node.js), self-improves weekly |
| Background Jobs | BullMQ (matching, email, WhatsApp, weight re-tuning) |
| Database | PostgreSQL |
| Cache / Queue | Redis |
| Media | Cloudinary (photos, menus, compliance docs) |
| Subscriptions | Stripe (vendor subscriptions + customer event passes) |
| Email | Resend |
| WhatsApp | WhatsApp Business API (Twilio or 360dialog) |
| Push notifications | Expo Push / Firebase Cloud Messaging |
| Currency conversion | Open Exchange Rates API (cached hourly in Redis) |

---

## 5. Data Model

### 5.1 Vendor (base entity)

All service providers on Bhoj share this base entity.

```
Vendor
  id · business_name · owner_name · contact_name
  vendor_type (enum — see Section 6)

  // Contact
  business_phone · cell_phone · email
  address · city · state · country · postcode · website

  // Compliance (required fields vary by vendor_type)
  business_licence_number · licence_expiry
  health_inspection_cert · inspection_date · inspection_expiry  // food vendors only
  food_safety_cert · food_safety_cert_expiry                    // food vendors only
  business_registration_number
  insurance_provider · insurance_expiry
  verified_by_bhoj · verification_date · verification_notes

  // Capabilities
  service_areas[] · min_guests · max_guests
  price_range_min · price_range_max · currency
  tier (free | pro | premium)

  // Performance (maintained by system)
  verified · response_rate · avg_rating
  shortlist_rate · booking_rate · past_events_count

  created_at · updated_at
```

### 5.2 Extended Vendor Profiles

Each `vendor_type` gets a supplementary profile table with type-specific fields:

**CatererProfile** (vendor_id FK)
- cuisines[] · dietary_options[] · event_types[] · service_styles[]
- offers_tasting · tasting_min_guests
- has_commercial_kitchen · kitchen_certified

**DecoratorProfile** (vendor_id FK)
- styles[] · themes[] (floral | drapes | lighting | mandap | balloon)
- setup_time_hours · teardown_included · portfolio_url

*(Additional profiles added as needed: DJProfile, PhotographerProfile, etc.)*

### 5.3 VendorService

One row per service offered by any vendor.

```
VendorService
  id · vendor_id · service_type · custom_label (if "other")
  is_available · service_radius_km
  price_type (included | per_head | flat_fee | quote_based)
  price · currency
  staff_count · equipment_provided
  provider_type (self | subcontracted | partner_referred)
  partner_name · partner_contact
  description · notes
  created_at · updated_at
```

### 5.4 VendorAvailability

```
VendorAvailability
  id · vendor_id
  blocked_date · blocked_reason (booked | personal | holiday)
  created_at
```

### 5.5 PastEvent (vendor portfolio)

```
PastEvent
  id · vendor_id
  event_type · event_name · event_date
  city · country · guest_count
  cuisine_served[] · service_style · duration_hours
  description · photos[]
  client_name (optional)
  verified_by_bhoj · created_at
```

### 5.6 Customer

```
Customer
  id · name · email · phone
  city · country
  auth_provider · created_at
```

### 5.7 Event (master planning record)

```
Event
  id · customer_id
  event_name · event_type (wedding | birthday | corporate | festival | other)
  event_date · city · venue · guest_count
  total_budget · currency

  // Auto-calculated
  total_spent · budget_remaining · checklist_progress (%)

  status (planning | confirmed | completed | cancelled)
  is_premium (bool — Event Pass purchased)
  notes · created_at · updated_at
```

### 5.8 EventCollaborator

```
EventCollaborator
  id · event_id · customer_id
  role (owner | editor | viewer)
  invited_by · invited_at · accepted_at
```

### 5.9 EventChecklistItem

```
EventChecklistItem
  id · event_id · category · item_name
  status (pending | searching | shortlisted | finalized | not_needed)
  is_custom (bool)

  // Vendor — one of:
  bhoj_vendor_id (nullable — FK to Vendor)
  external_vendor_name · external_vendor_phone · external_vendor_email

  // Pricing
  quoted_price · quoted_price_type (per_head | flat_fee | quote_based)
  finalized_price · finalized_price_type
  deposit_paid (bool) · deposit_amount
  balance_due · balance_due_date

  // Tracking
  notes · due_date · completed_at · created_at
```

### 5.10 EventRequest

Triggered when customer requests Bhoj matches for a checklist item.

```
EventRequest
  id · event_id · customer_id · checklist_item_id
  vendor_types_needed[]
  event_type · date · city · venue · guest_count
  budget_min · budget_max · currency
  cuisines[] · dietary[] · service_style
  services_needed[] · tasting_requested
  status (open | matched | closed)
  created_at
```

### 5.11 Match

```
Match
  id · event_request_id · vendor_id · vendor_type
  score (0–100) · rank
  status (pending | viewed | quoted | shortlisted | rejected)
  created_at · viewed_at
```

### 5.12 Quote

```
Quote
  id · match_id · vendor_id
  price_per_head · total_estimate · currency
  notes
  tasting_offered · tasting_cost · tasting_date · tasting_location
  status (draft | sent | viewed | accepted | declined)
  expires_at · created_at
  // Menu items stored in QuoteMenuItem (see section 5.18+)
```

### 5.13 HiddenFeedback (internal only)

Never shown to vendors or public. Feeds algorithm.

```
HiddenFeedback
  id · vendor_id · customer_id
  event_request_id · match_id
  would_recommend (bool)
  communication_score (1–5)
  professionalism_score (1–5)
  quote_accuracy (1–5)
  overall_experience (1–5)
  notes (free text)
  booked_offline (bool)
  created_at
```

### 5.14 Review (public)

```
Review
  id · vendor_id · customer_id · event_id
  rating (1–5) · comment
  food_quality · punctuality · value_for_money
  verified · created_at
```

### 5.15 VendorMetrics (system-maintained)

```
VendorMetrics
  vendor_id · vendor_type · period (weekly)
  lead_count · quote_rate · shortlist_rate
  avg_response_hrs · avg_rating · booking_rate
  hidden_feedback_avg
```

### 5.16 Subscription (vendor)

```
Subscription
  id · vendor_id · tier (free | pro | premium)
  stripe_subscription_id
  status · current_period_end
  leads_this_month · leads_limit
```

### 5.17 CustomerEventPass

```
CustomerEventPass
  id · customer_id · event_id
  stripe_payment_intent_id
  amount · currency
  status (active | expired | refunded)
  purchased_at · expires_at  // event_date + 60 days (covers post-event review window)
```

### 5.18 EventMenuPreference

Captures what the customer wants from a caterer. Created when customer submits a catering request. Two modes:

- **Mode A (customer_specified):** Customer picks per-category dish counts. Caterer builds to that spec.
- **Mode B (caterer_proposes):** Customer describes preferences only. Caterer proposes a full menu; customer can accept or request tweaks.

```
EventMenuPreference
  id · event_id · caterer_request_id
  menu_mode: customer_specified | caterer_proposes

  // Preferences (both modes)
  cuisine_preferences (text[])
  service_style: buffet | plated | family_style | stations

  // Per-category dish counts (Mode A only — null in Mode B)
  soup_salad_count · appetizer_count
  main_count · main_veg_count · main_non_veg_count
  bread_count · rice_biryani_count · dal_count
  dessert_count · live_counter_count · beverage_count

  // Dietary flags
  is_vegetarian · is_vegan · is_jain · is_halal · is_kosher

  // Allergy declarations (per-event; caterer must flag conflicting dishes)
  nut_free · gluten_free · dairy_free · egg_free · shellfish_free · soy_free

  special_notes (free text)
```

### 5.19 MenuPackage

Pre-defined packages offered by a caterer (Bronze / Silver / Gold or custom names).

```
MenuPackage
  id · vendor_id
  name · description
  price_per_head · currency
  min_guests · max_guests
  cuisine_type
  is_vegetarian · is_vegan · is_jain · is_halal
  nut_free · gluten_free · dairy_free
  includes_service · includes_setup
  is_active · created_at
```

### 5.20 MenuItem

Individual dish in a caterer's master dish library.

```
MenuItem
  id · vendor_id
  name · description

  // Category (display grouping in quotes and menus)
  category: soup_salad | appetizer | main_course | bread | rice_biryani
            | dal | dessert | beverage | live_counter | other

  // Dietary
  is_vegetarian · is_vegan · is_jain · is_halal · is_kosher

  // Allergens (caterer tags per dish)
  contains_nuts · contains_gluten · contains_dairy
  contains_eggs · contains_soy · contains_shellfish

  spice_level: mild | medium | hot | very_hot
  is_active
```

### 5.21 MenuPackageItem

Join table linking dishes to packages.

```
MenuPackageItem
  id · package_id · menu_item_id
  is_optional  // customer can request a swap
  sort_order
```

### 5.22 QuoteMenuItem

Snapshot of each dish at the time a quote is submitted. Caterer edits to their dish library do not affect existing quotes.

```
QuoteMenuItem
  id · quote_id · menu_item_id
  item_name  // snapshot at quote time
  category · is_vegetarian · is_jain · is_halal
  contains_nuts · contains_gluten · contains_dairy
  is_optional · notes · sort_order
```

---

## 5a. Menu System — How It Works

### Customer request flow

1. Customer fills event request → specifies cuisine, dietary, service style
2. Customer chooses mode:
   - **"I know what I want"** — sets per-category dish counts (e.g. 4 appetizers, 4 mains, 3 breads, 2 rice/biryani, 3 desserts, 3 live counters)
   - **"Build one for me"** — describes preferences only; caterer proposes full menu
3. Customer declares allergy requirements (nut-free, gluten-free, dairy-free, etc.)

### Caterer receives Menu Brief

Auto-generated from the EventMenuPreference and sent with the lead notification:

- Required cuisines and dietary flags as visual tags
- **Allergy alerts** — prominently highlighted; system auto-flags any dish the caterer adds that conflicts with a declared allergy
- Per-category dish targets (Mode A) or open prompt (Mode B)
- Customer's special notes
- Suggested packages from the caterer's own library that match the requirements

### Caterer builds menu

Three paths:
- **Use existing package** — select Gold/Silver/Bronze; dishes auto-populate
- **Customise package** — start from package, add/swap/remove dishes
- **Build from scratch** — pick from dish library filtered by category; create new dishes on the fly

**Guided builder** shows requirements checklist on the left at all times:
- Per-category progress (e.g. "Breads ⚠️ 2/3")
- Jain section coverage
- Allergy conflicts flagged in real-time
- Budget per-head tracker

### Menu categories

| Category | Examples |
|---|---|
| Soups & Salads | Shorba, raita, green salad |
| Appetizers | Samosa chaat, tikka, kebab, dahi puri |
| Main Course | Paneer butter masala, dal makhani, chicken curry |
| Breads | Roti, naan, paratha, puri |
| Rice & Biryani | Veg biryani, chicken biryani, jeera rice, khichdi |
| Desserts | Gulab jamun, kheer, halwa, ice cream |
| Beverages | Lassi, chai, soft drinks |
| Live Counters | Dosa station, chaat counter, biryani counter, grill |

### 5.23 Review (public)

Left by customer after the event. Displayed on vendor's public profile. Separate from HiddenFeedback (which is internal only).

```
Review
  id · vendor_id · customer_id · event_id
  overall_rating (1–5)
  food_quality_rating (1–5)     // caterers only
  service_rating (1–5)
  value_rating (1–5)
  title · body (public text)
  event_type · event_date       // context without revealing customer identity
  is_verified                   // customer must have a completed event to leave review
  vendor_reply (text)           // vendor can respond publicly
  is_published · created_at
```

Reviews are gated — customer can only submit after marking the checklist item as "finalized" and the event date has passed.

### 5.24 Conversation + Message

In-platform messaging between customer and vendor, scoped to a specific quote request.

```
Conversation
  id · match_id · customer_id · vendor_id
  last_message_at · is_archived
  created_at

Message
  id · conversation_id · sender_id · sender_type (customer | vendor)
  body (text)
  is_read · created_at
```

One conversation per match (not per quote). All negotiation, clarification, and tasting coordination happens here. No external contact details shared until customer shortlists.

### 5.25 VendorAvailability

Caterer (and any vendor) marks dates as unavailable — either booked or blocked. Used as a hard gate in matching: if a vendor is unavailable on the event date, they are excluded from results entirely.

```
VendorAvailability
  id · vendor_id
  date · is_available (bool)
  reason: booked | blocked | holiday | other
  notes (optional)
  created_at
```

Vendors manage this via a calendar in their dashboard. Recurring blocks (e.g. every Sunday) supported. Algorithm checks availability before scoring.

### 5.26 NotificationPreference

Per-user opt-in/out for each notification channel. Defaults to all channels on.

```
NotificationPreference
  id · user_id · user_type (customer | vendor)
  channel: email | push | whatsapp
  event_type: new_lead | quote_received | message | review | payment_reminder | weekly_summary
  is_enabled (bool)
  updated_at
```

---

## 6. Vendor Types (26)

### Food & Beverage
`caterer` · `dessert_vendor` · `bartender` · `chai_station` · `food_truck`

### Decor & Setup
`decorator` · `florist` · `tent_marquee` · `lighting` · `furniture_rental` · `equipment_rental`

### Entertainment
`dj` · `av_sound_system` · `live_music` · `games` · `kids_entertainment` · `dance_performance` · `fireworks_pyrotechnics`

### Media & Memories
`photographer` · `videographer` · `photo_booth` · `invitation_designer`

### Logistics & Staffing
`transport` · `horse_procession` · `valet_parking` · `event_staff` · `security`

### Specialist & Other
`event_planner` · `makeup_artist` · `mehndi_artist` · `pandit_priest` · `other`

**Compliance requirements by type:**
- Food vendors: health inspection cert + food safety cert required
- All vendors: business licence + insurance required
- Non-food vendors: public liability insurance required

---

## 7. Matching Algorithm

### Step 1 — Hard Gates (instant exclusion, no scoring)
- Service area does not cover event city → excluded
- Not available on event date (VendorAvailability) → excluded
- Guest count outside min/max capacity → excluded
- Not verified by Bhoj → excluded

### Step 2 — Weighted Scoring (0–100)

**Caterer scoring weights:**
| Factor | Weight |
|---|---|
| Cuisine match | 25% |
| Budget range overlap | 20% |
| Event type experience | 15% |
| Dietary options match | 10% |
| Services match | 10% |
| Rating + reviews | 10% |
| Past events (count + type) | 8% |
| Response rate + speed | 7% |
| Hidden feedback score | 5% |
| Tier boost (Pro/Premium) | +5 pts flat |

**Other vendor scoring weights:**
| Factor | Weight |
|---|---|
| Service type match | 25% |
| Budget range overlap | 20% |
| Event type experience | 15% |
| Rating + reviews | 15% |
| Past events (count + type) | 10% |
| Services offered match | 10% |
| Response rate + speed | 5% |
| Hidden feedback score | 5% |
| Tier boost (Pro/Premium) | +5 pts flat |

- Top 5 vendors per type shown to free customers; quotes capped at 3 per category
- Premium Event Pass customers: unlimited vendors surfaced, ranked by score

### Step 3 — Self-Improvement Loop (weekly BullMQ job)

1. **Collect signals:** shortlisted vs rejected, quote acceptance, hidden feedback scores, booked_offline flag
2. **Analyse correlations:** which factors best predict shortlisting and positive hidden feedback
3. **Re-tune weights:** update factor weights stored in DB
4. **A/B testing:** 10% of traffic gets experimental weight set; winning weights graduate to 100%
5. **Bad actor detection:** vendor with hidden_feedback_avg < 2.5 or response_rate < 40% auto-suppressed

---

## 8. Event Planning & Checklist

### Auto-generated checklists by event type

**Wedding:** Caterer, Decorator, Florist, DJ/Live Music, Photographer, Videographer, Makeup Artist, Mehndi Artist, Horse Procession, Tent/Marquee, Pandit/Priest, Transport, Invitations

**Birthday/Social:** Caterer, Decorator, DJ, Photographer, Entertainment, Transport

**Corporate:** Caterer, AV/Sound, Photographer, Transport, Event Staff

Customers can delete items, add custom tasks (free text, no vendor), and add external vendors.

### Checklist item tracking
Each item tracks: status · vendor (Bhoj or external) · quoted price · finalized price · deposit paid · balance due + date · notes · due date

### Budget dashboard
Event-level: total budget · committed · remaining (auto-calculated) · % checklist done

### Collaborators (Event Pass feature)
- Owner invites up to 10 collaborators by email
- Roles: editor (full access) or viewer (read-only)
- All see same real-time checklist, budget, notes

### Export
PDF export of full event plan — vendor details, prices, deposits, balances, notes, contact info.

---

## 9. Tasting Event Feature

- Unlocked when guest_count ≥ 100
- Caterer profile shows "Offers Tasting" badge
- Customer can tick "Interested in tasting" on quote request
- Caterer responds with: tasting_date · tasting_location · tasting_cost (may be free for large events) · what's included
- Customer picks a caterer to taste with → goes offline to arrange

---

## 10. Notifications

| Channel | Used for |
|---|---|
| Email (Resend) | Account verification, quote received, lead notification, payment receipts |
| Push (Expo/FCM) | New lead, quote received, message received, tasting request |
| WhatsApp (Business API) | Quote received, vendor matched, balance due reminders, event day reminders |

WhatsApp notifications require opt-in. Event Pass customers get WhatsApp included.

---

## 11. Multi-Currency

- Vendors set their base currency on signup (USD / GBP / CAD / AUD)
- Customers see prices converted to their local currency
- Exchange rates cached hourly via Open Exchange Rates API (Redis)
- All stored amounts kept in vendor's base currency; converted at display time
- India expansion adds INR in Phase 2

---

## 12. Vendor Analytics Dashboard (Pro/Premium)

- Profile views (last 30/90 days)
- Lead volume (matched, viewed, quoted, shortlisted)
- Quote acceptance rate
- Avg response time
- Rating trend
- Estimated rank position vs category average
- Lead source breakdown by event type

---

## 13. Admin Panel

Internal Bhoj dashboard for platform operations:

- **Vendor management:** Review applications, approve/reject compliance docs, grant/revoke Verified badge, suspend vendors
- **Subscription management:** View active subscriptions, handle refunds, override tiers
- **Dispute management:** Customer complaints, vendor flags, bad actor review queue
- **Platform analytics:** GMV equivalent (total lead value), active vendors/customers, match rates, conversion by vendor type, revenue by country
- **Algorithm controls:** View current weights, manually trigger re-tuning, A/B test management
- **Content moderation:** Review flagged reviews, photos, profiles

---

## 14. User Flows

### Customer Journey
1. Sign up (Google/email auth)
2. Create Event → auto-checklist generated by event type
3. Pick checklist item → fill request details → algorithm runs → 3–5 vendors shown (unlimited with Event Pass)
4. Browse vendor profiles (photos, past events, ratings, compliance badges)
5. Request quotes from 1–3 vendors (unlimited with Event Pass)
6. Compare quotes side-by-side on platform
7. Message vendors in-platform → shortlist → finalize offline
8. Mark as finalized in checklist → add price, deposit, notes
9. Share checklist with collaborators (Event Pass)
10. Post-event: leave public review + hidden feedback

### Vendor Journey
1. Sign up with business details + vendor type
2. Build profile (photos, services, compliance docs, pricing)
3. Automated vetting → go live on Free tier; manual review for Verified badge
4. Add past events portfolio (boosts algorithm score)
5. Set availability calendar (block booked dates)
6. Receive lead notification (push + email + WhatsApp)
7. Submit quote via platform (price, menu/services, tasting offer)
8. Message customer in-platform
9. Customer shortlists → finalize offline
10. Receive public review; hidden feedback collected silently

---

## 15. MVP Scope (Phase 1)

**Must have:**
- Vendor signup, profile builder, compliance upload
- Automated vetting checks
- Customer signup, event creation, auto-checklist
- Event request form + matching algorithm (v1 weighted scoring)
- Quote submission and comparison
- In-platform messaging
- Vendor availability calendar
- Event checklist tracker (Bhoj + external vendors + custom tasks)
- Budget dashboard
- Stripe subscriptions (vendor tiers)
- Stripe Event Pass (customer)
- Email notifications (Resend)
- Admin panel (basic: vendor approval, subscriptions)
- Multi-currency display (USD, GBP, CAD, AUD)
- Next.js web + React Native mobile

**Phase 2:**
- Self-improving algorithm (weight re-tuning + A/B testing)
- WhatsApp notifications
- Vendor analytics dashboard
- Event collaborators
- PDF export
- Tasting event feature
- Public reviews + hidden feedback system
- India expansion (INR currency, Indian market onboarding)

---

## 16. Screenshots Reference

All design visuals saved to `docs/screenshots/`:

| File | Content |
|---|---|
| 01-platform-model.png | Platform model comparison |
| 02-approaches.png | Tech stack approaches |
| 04-architecture.png | Full system architecture |
| 05-data-model-v4.png | Data model with past events + hidden feedback |
| 06-caterer-services.png | VendorService entity |
| 07-addon-providers.png | Third-party add-on model options |
| 08-vendor-model.png | Unified Vendor model |
| 09-vendor-types-final.png | All 26 vendor types |
| 10-matching-algorithm.png | Matching algorithm design |
| 11-event-planner-v3.png | Event planning dashboard |
| 12-user-flows.png | Customer and vendor journeys |
| 13-menu-model.png | Menu data model (MenuPackage, MenuItem, QuoteMenuItem, allergens) |
| 14-menu-brief.png | Menu request flow — customer modes, brief, guided builder |
