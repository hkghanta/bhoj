import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { QuoteStatus } from '@prisma/client'
import { enqueueNotification } from '@/lib/notifications/enqueue'
import { NOTIFICATION_EVENTS } from '@/lib/notifications/types'

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

// Workflow templates — auto-created as checklist items when a vendor is booked
const SERVICE_WORKFLOW_TEMPLATES: Record<string, string[]> = {
  CATERER: ['Sign contract', 'Pay deposit', 'Confirm final menu & headcount', 'Final payment'],
  DECORATOR: ['Share theme & mood board', 'Confirm setup plan', 'Pay deposit', 'Final walkthrough'],
  PHOTOGRAPHER: ['Sign contract', 'Share shot list', 'Pay deposit', 'Pre-event meeting'],
  VIDEOGRAPHER: ['Sign contract', 'Share shot list', 'Pay deposit', 'Pre-event meeting'],
  DJ: ['Share song preferences', 'Confirm equipment needs', 'Pay deposit'],
  LIVE_BAND: ['Share song preferences', 'Confirm equipment needs', 'Pay deposit'],
  MEHENDI_ARTIST: ['Confirm designs', 'Pay deposit'],
  MAKEUP_HAIR: ['Book trial', 'Share outfit photos', 'Confirm schedule', 'Pay deposit'],
  FLORIST: ['Confirm arrangements', 'Pay deposit'],
  PANDIT_OFFICIANT: ['Discuss ceremony details', 'Share rituals list'],
  MC_HOST: ['Share event flow & script', 'Pre-event rehearsal'],
  TRANSPORT: ['Confirm routes & timing', 'Pay deposit'],
  VENUE: ['Sign contract', 'Pay deposit', 'Final walkthrough', 'Confirm layout & setup'],
  TENT_MARQUEE: ['Confirm layout', 'Pay deposit', 'Setup walkthrough'],
  LIGHTING: ['Confirm lighting plan', 'Pay deposit'],
  CAKE_VENDOR: ['Confirm design & flavors', 'Pay deposit'],
  DESSERT_VENDOR: ['Confirm menu', 'Pay deposit'],
  BARTENDER: ['Confirm drink menu', 'Pay deposit'],
  CHOREOGRAPHER: ['Confirm dance selection', 'Schedule rehearsals'],
  INVITATION_DESIGNER: ['Approve design proof', 'Confirm print quantity', 'Pay balance'],
  EVENT_MANAGER: ['Share event plan', 'Pre-event walkthrough'],
}
const DEFAULT_WORKFLOW = ['Sign contract', 'Pay deposit', 'Confirm details']

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = (session.user as { role?: string }).role

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      ...(role === 'vendor' ? { vendor_id: (session.user!.id as string) } : {
        match: { event_request: { event: { customer_id: (session.user!.id as string) } } },
      }),
    },
    include: {
      vendor: true,
      menu_items: { orderBy: [{ category: 'asc' }, { sort_order: 'asc' }] },
      tray_lines: { orderBy: { sort_order: 'asc' } },
      contract: { select: { id: true, status: true, contract_number: true } },
      match: {
        include: {
          event_request: {
            include: {
              event: true,
              menu_preference: true,
            },
          },
        },
      },
    },
  })

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (role === 'customer' && quote.status === 'SENT') {
    await prisma.quote.update({ where: { id }, data: { status: 'VIEWED' } })
  }

  return NextResponse.json(quote)
}

const updateSchema = z.object({
  price_per_head: z.number().positive().optional(),
  total_estimate: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().optional(),
  tasting_offered: z.boolean().optional(),
  tasting_cost: z.number().nonnegative().optional().nullable(),
  tasting_date: z.string().datetime().optional().nullable(),
  tasting_location: z.string().optional().nullable(),
  status: z.nativeEnum(QuoteStatus).optional(),
  expires_at: z.string().datetime().optional().nullable(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = (session.user as { role?: string }).role

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      ...(role === 'vendor' ? { vendor_id: (session.user!.id as string) } : {
        match: { event_request: { event: { customer_id: (session.user!.id as string) } } },
      }),
    },
  })
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  if (role === 'customer') {
    const allowedStatuses: QuoteStatus[] = ['ACCEPTED', 'DECLINED']
    if (parsed.data.status && !allowedStatuses.includes(parsed.data.status)) {
      return NextResponse.json({ error: 'Customers can only accept or decline quotes' }, { status: 403 })
    }
    const updated = await prisma.quote.update({
      where: { id },
      data: { status: parsed.data.status },
    })

    // Auto-create EventVendor + EventPlanItem when quote is accepted
    if (parsed.data.status === 'ACCEPTED') {
      const fullQuote = await prisma.quote.findUnique({
        where: { id },
        include: {
          vendor: { select: { id: true, business_name: true, vendor_type: true, phone_business: true, phone_cell: true, email: true, city: true } },
          match: { include: { event_request: { select: { event_id: true, vendor_type: true } } } },
        },
      })
      if (fullQuote) {
        const eventId = fullQuote.match.event_request.event_id
        const vendorId = fullQuote.vendor_id

        // Create EventVendor
        await prisma.eventVendor.upsert({
          where: { event_id_vendor_id: { event_id: eventId, vendor_id: vendorId } },
          update: { quote_id: id },
          create: { event_id: eventId, vendor_id: vendorId, quote_id: id },
        })

        // Auto-create EventPlanItem for the Event Day view
        const vendorType = fullQuote.match.event_request.vendor_type
        const roleLabel = vendorType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        await prisma.eventPlanItem.upsert({
          where: { event_id_vendor_id: { event_id: eventId, vendor_id: vendorId } },
          update: {
            title: fullQuote.vendor.business_name,
            role: roleLabel,
            contact_name: fullQuote.vendor.business_name,
            contact_phone: fullQuote.vendor.phone_business ?? fullQuote.vendor.phone_cell ?? null,
            contact_email: fullQuote.vendor.email,
          },
          create: {
            event_id: eventId,
            vendor_id: vendorId,
            source: 'PLATFORM',
            title: fullQuote.vendor.business_name,
            role: roleLabel,
            contact_name: fullQuote.vendor.business_name,
            contact_phone: fullQuote.vendor.phone_business ?? fullQuote.vendor.phone_cell ?? null,
            contact_email: fullQuote.vendor.email,
            notes: `Accepted quote — ${fmt(Number(fullQuote.total_estimate), fullQuote.currency)}`,
          },
        })

        // Auto-finalize any existing checklist item for this vendor type (e.g. "Book caterer")
        await prisma.eventChecklistItem.updateMany({
          where: { event_id: eventId, category: roleLabel, status: { in: ['PENDING', 'SEARCHING', 'SHORTLISTED'] } },
          data: { status: 'FINALIZED', finalized_price: fullQuote.total_estimate, completed_at: new Date() },
        })

        // Auto-create workflow checklist items for the booked vendor
        const planItem = await prisma.eventPlanItem.findUnique({
          where: { event_id_vendor_id: { event_id: eventId, vendor_id: vendorId } },
          select: { id: true },
        })
        if (planItem) {
          const steps = SERVICE_WORKFLOW_TEMPLATES[vendorType] ?? DEFAULT_WORKFLOW
          const existing = await prisma.eventChecklistItem.findMany({
            where: { event_id: eventId, linked_plan_item_id: planItem.id },
            select: { item_name: true },
          })
          const existingNames = new Set(existing.map(e => e.item_name))
          const newSteps = steps.filter(s => !existingNames.has(s))
          if (newSteps.length > 0) {
            await prisma.eventChecklistItem.createMany({
              data: newSteps.map(step => ({
                event_id: eventId,
                category: roleLabel,
                item_name: step,
                status: 'PENDING' as const,
                linked_plan_item_id: planItem.id,
                vendor_type: vendorType as any,
              })),
            })
          }
        }
      }
    }

    return NextResponse.json(updated)
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.tasting_date) data.tasting_date = new Date(parsed.data.tasting_date)
  if (parsed.data.expires_at) data.expires_at = new Date(parsed.data.expires_at)

  const updated = await prisma.quote.update({ where: { id }, data })

  // Notify customer when vendor sends the quote
  if (parsed.data.status === 'SENT' && quote.status === 'DRAFT') {
    const fullQuote = await prisma.quote.findUnique({
      where: { id },
      include: {
        vendor: { select: { business_name: true } },
        match: {
          include: {
            event_request: {
              include: { event: { select: { event_name: true, customer_id: true, id: true } } },
            },
          },
        },
      },
    })
    if (fullQuote) {
      enqueueNotification(
        NOTIFICATION_EVENTS.QUOTE_RECEIVED,
        fullQuote.match.event_request.event.customer_id,
        'customer',
        {
          vendorName: fullQuote.vendor.business_name,
          eventName: fullQuote.match.event_request.event.event_name,
          totalEstimate: Number(fullQuote.total_estimate ?? 0),
          currency: fullQuote.currency,
          eventId: fullQuote.match.event_request.event.id,
        }
      ).catch(err => console.error('[quotes] Failed to enqueue quote notification:', err.message))
    }
  }

  return NextResponse.json(updated)
}
