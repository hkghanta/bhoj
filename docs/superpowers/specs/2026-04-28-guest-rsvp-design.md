# Sub-Events & Guest RSVP Design

## Goal

Allow customers to break a complex event (e.g. a wedding) into multiple sub-events (Mehendi, Puja, Ceremony, Reception), each with its own date, vendors, checklist, and budget. Guest households are invited to specific sub-events and receive one RSVP link that shows all their invitations. Every RSVP page is an OneSeva marketing surface.

Simple events (birthday, corporate) with no sub-events continue to work exactly as today — sub-events are purely additive.

---

## Architecture

```
Event (parent container)
├── metadata: name, city, total budget, status
├── SubEvent[]  ← new (Mehendi / Puja / Ceremony / Reception)
│     ├── own date + time
│     ├── own EventRequests (vendor matching)
│     ├── own ChecklistItems
│     └── own budget allocation
└── GuestHousehold[]  ← new (one per family)
      ├── one RSVP token
      └── GuestSubEventInvite[]  ← which sub-events they're invited to
            └── GuestAttendee[]  ← per-person dietary info per sub-event
```

**For simple events (no sub-events):** Event itself holds vendors, checklist, budget as today. Nothing changes.

**For complex events:** Customer adds sub-events. Vendors, checklist items, and EventRequests migrate to sub-event scope.

---

## Data Model

### New model: `SubEvent`

```prisma
model SubEvent {
  id            String    @id @default(cuid())
  event_id      String
  event         Event     @relation(fields: [event_id], references: [id], onDelete: Cascade)
  name          String                        // "Mehendi Night", "Reception", etc.
  event_date    DateTime
  venue         String?
  guest_count   Int?                          // expected headcount for this sub-event
  budget        Decimal?  @db.Decimal(12,2)   // slice of total budget
  currency      String    @default("GBP")
  notes         String?
  sort_order    Int       @default(0)         // display order
  created_at    DateTime  @default(now())

  checklist_items  EventChecklistItem[]       // checklist scoped to this sub-event
  requests         EventRequest[]             // vendor requests for this sub-event
  invites          GuestSubEventInvite[]
}
```

### New model: `GuestHousehold`
One per family — belongs to the parent event, invited to specific sub-events.

```prisma
model GuestHousehold {
  id           String    @id @default(cuid())
  event_id     String
  event        Event     @relation(fields: [event_id], references: [id], onDelete: Cascade)
  label        String                         // "Sharma Family", "Raj & Priya"
  email        String?                        // optional, for sending invite email
  phone        String?                        // optional, for WhatsApp sharing later
  token        String    @unique @default(cuid())
  declined     Boolean   @default(false)      // manually marked by customer
  created_at   DateTime  @default(now())

  invites      GuestSubEventInvite[]
}
```

### New model: `GuestSubEventInvite`
Links a household to a specific sub-event. One RSVP per sub-event per household.

```prisma
model GuestSubEventInvite {
  id            String         @id @default(cuid())
  household_id  String
  household     GuestHousehold @relation(fields: [household_id], references: [id], onDelete: Cascade)
  sub_event_id  String
  sub_event     SubEvent       @relation(fields: [sub_event_id], references: [id], onDelete: Cascade)
  responded_at  DateTime?
  created_at    DateTime       @default(now())

  attendees     GuestAttendee[]

  @@unique([household_id, sub_event_id])
}
```

### New model: `GuestAttendee`
One per person per sub-event invite.

```prisma
model GuestAttendee {
  id            String              @id @default(cuid())
  invite_id     String
  invite        GuestSubEventInvite @relation(fields: [invite_id], references: [id], onDelete: Cascade)
  name          String?
  dietary_type  GuestDietaryType    @default(NON_VEG)
  allergens     String[]            @default([])   // ["nut_free","gluten_free","dairy_free","egg_free"]
  created_at    DateTime            @default(now())
}

enum GuestDietaryType {
  NON_VEG
  VEGETARIAN
  VEGAN
  JAIN
  HALAL
}
```

### Event model additions

```prisma
// added to Event model
invite_image_url  String?    // uploaded by customer, shown on RSVP pages
invite_message    String?    // personal message shown on RSVP pages
sub_events        SubEvent[]
households        GuestHousehold[]
```

### EventChecklistItem + EventRequest additions

Both models get an optional `sub_event_id` foreign key:

```prisma
// added to EventChecklistItem
sub_event_id  String?
sub_event     SubEvent? @relation(fields: [sub_event_id], references: [id])

// added to EventRequest
sub_event_id  String?
sub_event     SubEvent? @relation(fields: [sub_event_id], references: [id])
```

`null` = belongs to the parent event (simple event behaviour). Set = scoped to a sub-event.

---

## Pages & Routes

### Customer: `/events/[id]` (updated)

When sub-events exist, the event page shows a tab or section per sub-event:

- Sub-event cards: name, date, venue, vendor status summary, confirmed guest count
- "Add sub-event" button
- Overall budget bar (total vs sum of sub-event allocations)

When no sub-events exist: page renders exactly as today.

---

### Customer: `/events/[id]/sub-events` (new)

Manage sub-events:

- List of sub-events with date, venue, budget slice, guest count
- Add sub-event form: name, date, time, venue, budget allocation
- Edit / delete sub-event
- Reorder (drag or up/down arrows)

---

### Customer: `/events/[id]/vendors` (updated)

When sub-events exist, left sidebar shows sub-event grouping:

```
Mehendi Night (3 May)
  🌿 Mehendi Artist  [3 matches]
  💄 Makeup & Hair   [2 matches]

Reception (8 May)
  🍽 Catering        [5 matches]
  🎵 DJ              [4 matches]
  ...
```

"Add a service" scoped to selected sub-event.

---

### Customer: `/events/[id]/guests` (new)

**Top stats bar:**
- Total households · Responded · Pending · Declined
- Total confirmed attendees across all sub-events

**Per sub-event dietary breakdown:**
```
Reception (8 May)
  142 confirmed — 90 non-veg · 38 veg · 8 Jain · 6 Halal — 5 nut-free, 2 gluten-free
  [Apply to catering prefs]

Mehendi Night (3 May)
  48 confirmed — 30 veg · 10 Jain · 8 non-veg
  [Apply to catering prefs]
```

**Invite setup (once per event):**
- Upload invite image
- Personal message
- Saved via `PATCH /api/events/[id]/invite`

**Guest list table:**
- Household label
- Email / phone (if set)
- Sub-events invited to (pills: "Mehendi · Reception")
- Status per sub-event: Responded / Pending
- Party size per sub-event
- Actions: Send invite email · Copy link · Mark declined · Delete

**Add household form:**
- Label (required)
- Email (optional)
- Sub-events to invite (multi-select checkboxes of sub-events for this event)
- For simple events with no sub-events: no sub-event selector shown

---

### Guest-facing: `/e/[token]` (new, public)

Token resolves to a `GuestHousehold`. Page shows all sub-events they're invited to.

**Layout:**
```
[Invite image]

Priya & Raj's Wedding
"We'd love for you to celebrate with us. Please let us know..."

─────────────────────────────────────
Mehendi Night
Friday, 7 May 2026 · 6:00 PM
The Grand Banquet, Leicester

How many in your party? [  2  ]

Person 1: [Name optional] [● Non-veg ○ Veg ○ Vegan ○ Jain ○ Halal] [allergens]
Person 2: [Name optional] [○ Non-veg ● Veg ○ Vegan ○ Jain ○ Halal] [allergens]

[Confirm for Mehendi Night ✓]

─────────────────────────────────────
Reception
Saturday, 8 May 2026 · 7:00 PM
The Grand Banquet, Leicester

How many in your party? [  4  ]

Person 1–4: dietary rows...

[Confirm for Reception ✓]
─────────────────────────────────────

footer: Planning your own event? Find vendors on OneSeva →
```

**Behaviour:**
- Each sub-event section is independent — guest can submit one at a time or all at once
- Once a sub-event is confirmed, its section shows read-only summary: "Confirmed · 2 people · 1 veg, 1 non-veg ✓"
- Guest can re-open and edit before the event date
- If household is marked declined: page shows "You've been marked as unable to attend. Contact [customer name] if this is a mistake."
- If all sub-events have passed: "This event has already taken place."

**noindex meta tag** — not publicly searchable, link-only access.

---

## API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/events/[id]/sub-events` | Customer | List sub-events |
| POST | `/api/events/[id]/sub-events` | Customer | Create sub-event |
| PATCH | `/api/events/[id]/sub-events/[subId]` | Customer | Update sub-event |
| DELETE | `/api/events/[id]/sub-events/[subId]` | Customer | Delete sub-event |
| GET | `/api/events/[id]/guests` | Customer | List households + invites + attendees |
| POST | `/api/events/[id]/guests` | Customer | Add household + sub-event invites |
| PATCH | `/api/events/[id]/guests/[householdId]` | Customer | Update label / mark declined |
| DELETE | `/api/events/[id]/guests/[householdId]` | Customer | Remove household |
| POST | `/api/events/[id]/guests/[householdId]/send-invite` | Customer | Send invite email |
| PATCH | `/api/events/[id]/invite` | Customer | Save invite image + message |
| GET | `/api/rsvp/[token]` | Public | Fetch household + sub-event invites |
| POST | `/api/rsvp/[token]/[inviteId]` | Public | Submit attendees for one sub-event |

---

## Email: Invite Send

Plain HTML email sent via Resend:

```
[Invite image if uploaded]

Hi Sharma Family,

[Customer's message or default "You're invited!"]

You're invited to:
• Mehendi Night — Fri 7 May, 6pm · The Grand Banquet
• Reception — Sat 8 May, 7pm · The Grand Banquet

→ [Open your invitation]   (links to /e/[token])

---
Powered by OneSeva
```

- One email per household regardless of how many sub-events they're invited to
- "Resend" replaces "Send" after first send

---

## Dietary Aggregation → Catering Prefs

"Apply to catering prefs" per sub-event:
1. Aggregate `GuestAttendee` rows for that sub-event's `GuestSubEventInvite` records
2. Upsert `EventMenuPreference` on the CATERER `EventRequest` scoped to that sub-event
3. Re-run match scorer for that sub-event's CATERER request

---

## Backward Compatibility

- Existing events with no sub-events: `sub_event_id = null` on all checklist items and event requests — behaviour unchanged
- All existing API routes continue to work — sub-event filtering is additive
- Event wizard unchanged — customer can add sub-events after creation from the event page

---

## Out of Scope (MVP)

- WhatsApp / SMS sending from platform — future paid feature (per-send or bundle pricing)
- Custom invite card designer (customer uploads their own from Canva etc.)
- Reminder emails to pending guests
- Seating plans
- Sub-event-level budget enforcement / warnings
- Guest login or guest portal
- RSVP deadline (customer tracks pending manually)
