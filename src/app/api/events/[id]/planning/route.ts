import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/events/[id]/planning
 * Unified planning board: platform vendors + external vendors + personal items + timeline entries.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
    select: {
      id: true,
      event_name: true,
      event_date: true,
      city: true,
      venue: true,
      guest_count: true,
      currency: true,
    },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Platform vendors (booked via quote acceptance)
  const eventVendors = await prisma.eventVendor.findMany({
    where: { event_id: id },
    include: {
      vendor: {
        select: {
          id: true,
          business_name: true,
          vendor_type: true,
          city: true,
          phone_business: true,
          phone_cell: true,
          email: true,
          profile_photo_url: true,
        },
      },
      quote: {
        select: {
          id: true,
          total_estimate: true,
          price_per_head: true,
          currency: true,
          notes: true,
        },
      },
    },
    orderBy: { created_at: 'asc' },
  })

  // External vendors + personal helpers
  const planItems = await prisma.eventPlanItem.findMany({
    where: { event_id: id },
    orderBy: [{ sort_order: 'asc' }, { start_time: 'asc' }, { created_at: 'asc' }],
  })

  // Timeline entries
  const timelineEntries = await prisma.eventTimelineEntry.findMany({
    where: { event_id: id },
    orderBy: { start_time: 'asc' },
  })

  // Checklist items
  const checklistItems = await prisma.eventChecklistItem.findMany({
    where: { event_id: id },
    include: { linked_plan_item: { select: { id: true, title: true } } },
    orderBy: [{ category: 'asc' }, { created_at: 'asc' }],
  })

  // Readiness: for each plan item that has linked checklist items, compute done vs total
  const readiness: Record<string, { done: number; total: number }> = {}
  for (const ci of checklistItems) {
    if (!ci.linked_plan_item_id) continue
    if (!readiness[ci.linked_plan_item_id]) {
      readiness[ci.linked_plan_item_id] = { done: 0, total: 0 }
    }
    readiness[ci.linked_plan_item_id].total++
    if (ci.status === 'FINALIZED') {
      readiness[ci.linked_plan_item_id].done++
    }
  }

  return NextResponse.json({
    event,
    platform_vendors: eventVendors,
    plan_items: planItems,
    timeline_entries: timelineEntries,
    checklist_items: checklistItems,
    readiness,
  })
}
