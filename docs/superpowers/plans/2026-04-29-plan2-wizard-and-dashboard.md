# Plan 2: Wizard Simplification + Dashboard Services Section

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trim the event creation wizard from 5 steps to 3 (type → details → confirm), remove service/catering steps from the wizard, and replace the vendor match preview on the event dashboard with a Services grid using admin-enabled ServiceConfig rows.

**Architecture:** Wizard simplification is a pure frontend change — remove steps 3 and 4, wire step 2 directly to confirm. API `/api/events` drops `selected_services` and `catering_prefs` from its schema. Dashboard reads `ServiceConfig` (seeded in Plan 1) and `EventRequest` records to render service card states.

**Tech Stack:** Next.js 16 App Router, React, Prisma 5, TypeScript, Tailwind CSS.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/components/customer/EventWizard.tsx` | Modify | Remove steps 3 & 4; wire step 1→2→3 |
| `src/components/customer/steps/Step3Services.tsx` | Delete | No longer used in wizard |
| `src/components/customer/steps/Step5Confirm.tsx` | Modify | Remove service/catering summary panels |
| `src/app/api/events/route.ts` | Modify | Remove `selected_services`, `catering_prefs` from schema + logic |
| `src/app/(customer)/events/[id]/page.tsx` | Modify | Add Services grid; remove vendor match preview |

---

### Task 1: Simplify EventWizard

**Files:**
- Modify: `src/components/customer/EventWizard.tsx`
- Delete: `src/components/customer/steps/Step3Services.tsx`

- [ ] **Step 1: Rewrite EventWizard.tsx**

Replace the entire file content with:

```tsx
'use client'
import { useState } from 'react'
import { Step1EventType } from './steps/Step1EventType'
import { Step2EventDetails } from './steps/Step2EventDetails'
import { Step5Confirm } from './steps/Step5Confirm'

type EventDetails = {
  event_name: string; event_date: string; city: string; venue: string;
  guest_count: number; total_budget: number; currency: string
}

export function EventWizard() {
  const [step, setStep] = useState(0)
  const [eventType, setEventType] = useState('')
  const [details, setDetails] = useState<EventDetails | null>(null)

  return (
    <div className="bg-white rounded-xl border p-8 max-w-2xl mx-auto">
      {/* Progress */}
      {step > 0 && (
        <div className="flex items-center gap-1.5 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all ${
                i < step ? 'bg-orange-500' : i === step ? 'bg-orange-300' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      )}

      {step === 0 && (
        <Step1EventType onNext={(type) => { setEventType(type); setStep(1) }} />
      )}

      {step === 1 && (
        <Step2EventDetails
          eventType={eventType}
          onNext={(d) => { setDetails(d); setStep(2) }}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && details && (
        <Step5Confirm
          eventType={eventType}
          details={details}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Delete Step3Services.tsx**

```bash
rm src/components/customer/steps/Step3Services.tsx
```

- [ ] **Step 3: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors referencing `Step3Services` or old wizard props.

- [ ] **Step 4: Commit**

```bash
git add src/components/customer/EventWizard.tsx
git rm src/components/customer/steps/Step3Services.tsx
git commit -m "feat: simplify event wizard to 3 steps (type → details → confirm)"
```

---

### Task 2: Simplify Step5Confirm

**Files:**
- Modify: `src/components/customer/steps/Step5Confirm.tsx`

Step5Confirm currently receives `selectedServices` and `cateringPrefs` props. Strip these — the confirm step now only shows a summary of event details and a single "Create Event" button.

- [ ] **Step 1: Rewrite Step5Confirm.tsx**

Replace the entire file with:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

type EventDetails = {
  event_name: string; event_date: string; city: string; venue: string;
  guest_count: number; total_budget: number; currency: string
}

type Props = {
  eventType: string
  details: EventDetails
  onBack: () => void
}

export function Step5Confirm({ eventType, details, onBack }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function createEvent() {
    setCreating(true)
    setError('')
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType, ...details }),
    })
    if (res.ok) {
      const event = await res.json()
      router.push(`/events/${event.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to create event.')
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review your event</h2>
        <p className="text-gray-500 text-sm mt-1">
          Once created, you can add services and search for vendors from your event dashboard.
        </p>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        {[
          { label: 'Event', value: details.event_name },
          { label: 'Type', value: <span className="capitalize">{eventType.replace(/_/g, ' ')}</span> },
          { label: 'Date', value: format(new Date(details.event_date), 'EEEE, d MMMM yyyy') },
          { label: 'Location', value: `${details.city}${details.venue ? ` — ${details.venue}` : ''}` },
          { label: 'Guests', value: details.guest_count.toLocaleString() },
        ].map(row => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Budget</span>
          <span className="font-medium text-orange-600">
            {details.currency} {details.total_budget.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={createEvent} disabled={creating} className="flex-1 bg-orange-600 hover:bg-orange-700">
          {creating ? 'Creating your event…' : 'Create Event →'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors from Step5Confirm.

- [ ] **Step 3: Commit**

```bash
git add src/components/customer/steps/Step5Confirm.tsx
git commit -m "feat: strip services/catering from confirm step — event-only summary"
```

---

### Task 3: Simplify POST /api/events

**Files:**
- Modify: `src/app/api/events/route.ts`

Remove `selected_services` and `catering_prefs` from the Zod schema. Remove the fire-and-forget block that creates EventRequests and runs matching. Event creation now only creates the Event record and checklist.

- [ ] **Step 1: Rewrite the POST handler in route.ts**

Open `src/app/api/events/route.ts`. Replace everything from `const createSchema` to the end of the file with:

```ts
const createSchema = z.object({
  event_name: z.string().min(2),
  event_type: z.string().min(2),
  event_date: z.string().datetime(),
  city: z.string().min(2),
  venue: z.string().optional(),
  guest_count: z.number().int().positive(),
  total_budget: z.number().positive(),
  currency: z.string().length(3).default('USD'),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const events = await prisma.event.findMany({
    where: { customer_id: (session.user!.id as string) },
    include: {
      checklist_items: true,
      _count: { select: { requests: true } },
    },
    orderBy: { event_date: 'asc' },
  })

  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const { event_date, ...rest } = parsed.data
  const customerId = session.user!.id as string
  const template = getChecklistTemplate(parsed.data.event_type)

  const event = await prisma.event.create({
    data: {
      ...rest,
      event_date: new Date(event_date),
      customer_id: customerId,
      checklist_items: {
        create: template.map(item => ({
          category: item.category,
          item_name: item.item_name,
          status: 'PENDING',
        })),
      },
    },
    include: { checklist_items: true },
  })

  return NextResponse.json(event, { status: 201 })
}
```

Also remove the unused `VendorType`, `MenuMode`, and `runMatchJob` imports at the top of the file. Keep `NextRequest`, `NextResponse`, `auth`, `prisma`, `z`, `getChecklistTemplate`.

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/events/route.ts
git commit -m "feat: remove selected_services and catering_prefs from event creation API"
```

---

### Task 4: Replace vendor match preview with Services grid on event dashboard

**Files:**
- Modify: `src/app/(customer)/events/[id]/page.tsx`

Replace the "Vendor Matches" section (lines ~51–73 in the data-fetching block, and lines ~242–291 in the JSX) with a Services grid. The grid reads `ServiceConfig` rows (enabled only) and `EventRequest` records to determine card state.

**Service card states:**
- No `EventRequest` for this type → grey, "Add" button → `/events/[id]/services/[type-lowercase]`
- Has `EventRequest` (requirements saved) → coloured icon, green dot, "View" button
- Has `EventRequest` + at least one `Match` → same + vendor count badge

- [ ] **Step 1: Update data fetching (remove match queries, add ServiceConfig + requests)**

Replace the data-fetching section (after `const event = ...` block, before `const totalBudget`). Remove the `quoteCount`, `topMatches`, `topByType`, `matchedCategories` queries. Replace with:

```ts
  // Quote count (received)
  const quoteCount = await prisma.quote.count({
    where: {
      status: { in: ['SENT', 'ACCEPTED'] },
      match: { event_request: { event_id: id } },
    },
  })

  // Unread messages
  const unreadCount = await prisma.message.count({
    where: {
      is_read: false,
      sender_type: 'VENDOR',
      conversation: { customer_id: customerId, match: { event_request: { event_id: id } } },
    },
  })

  const guestHouseholdCount = await prisma.guestHousehold.count({ where: { event_id: id } })

  // Services grid data
  const [enabledServices, eventRequests] = await Promise.all([
    prisma.serviceConfig.findMany({
      where: { is_enabled: true },
      orderBy: { sort_order: 'asc' },
    }),
    prisma.eventRequest.findMany({
      where: { event_id: id },
      include: { _count: { select: { matches: true } } },
    }),
  ])
  const requestByType: Record<string, { id: string; service_notes: string | null; matchCount: number }> = {}
  for (const r of eventRequests) {
    requestByType[r.vendor_type] = {
      id: r.id,
      service_notes: r.service_notes,
      matchCount: r._count.matches,
    }
  }
```

Also remove the `EMOJI` and `LABEL` record objects — those were only used for the old match preview.

- [ ] **Step 2: Replace vendor match preview JSX with Services grid**

Find and replace the entire `{/* Vendor match preview */}` block and the empty-state block that follows it (currently ending at the `{/* Sub-events */}` comment). Replace with:

```tsx
      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-text-1">Services</h2>
          <span className="text-xs text-text-4">{enabledServices.length} available</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {enabledServices.map(svc => {
            const req = requestByType[svc.vendor_type]
            const hasReq = !!req
            const hasVendors = hasReq && req.matchCount > 0
            return (
              <Link
                key={svc.vendor_type}
                href={`/events/${id}/services/${svc.vendor_type.toLowerCase().replace(/_/g, '-')}`}
                className={`relative flex flex-col gap-2 rounded-2xl border p-4 transition-colors ${
                  hasReq
                    ? 'bg-white border-brand hover:bg-cream'
                    : 'bg-white border-brand-border hover:bg-cream'
                }`}
              >
                {hasReq && (
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-green-500" />
                )}
                {hasVendors && (
                  <span className="absolute top-2 right-6 bg-brand text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {req.matchCount}
                  </span>
                )}
                <span className="text-2xl">{svc.icon}</span>
                <div>
                  <div className="text-sm font-bold text-text-1">{svc.label}</div>
                  {hasReq && req.service_notes && (
                    <div className="text-xs text-text-4 mt-0.5 line-clamp-1">{req.service_notes}</div>
                  )}
                  {!hasReq && (
                    <div className="text-xs text-text-4 mt-0.5">Tap to add</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
```

- [ ] **Step 3: Remove unused imports**

Remove `Sparkles`, `ArrowRight`, `Star` from the lucide-react import (they were only used in the match preview).

- [ ] **Step 4: Run TypeScript check**

```bash
cd /home/hareesh/projects/bhoj && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/(customer)/events/[id]/page.tsx
git commit -m "feat: replace vendor match preview with services grid on event dashboard"
```
