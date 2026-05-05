import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * GET /api/customer/spend
 * Account-level spend summary across all events.
 */
export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customerId = session.user!.id as string

  // Get all events for this customer
  const events = await prisma.event.findMany({
    where: { customer_id: customerId },
    select: { id: true, event_name: true, event_type: true, event_date: true, currency: true },
  })

  const eventIds = events.map(e => e.id)

  // Get all accepted quotes across all events
  const acceptedQuotes = await prisma.quote.findMany({
    where: {
      status: 'ACCEPTED',
      match: { event_request: { event_id: { in: eventIds } } },
    },
    select: {
      total_estimate: true,
      currency: true,
      vendor: { select: { id: true, business_name: true, vendor_type: true } },
      match: { select: { event_request: { select: { event_id: true } } } },
    },
  })

  const totalSpent = acceptedQuotes.reduce((sum, q) => sum + Number(q.total_estimate), 0)

  // By event
  const byEvent = events.map(event => {
    const eventQuotes = acceptedQuotes.filter(
      q => q.match.event_request.event_id === event.id
    )
    return {
      event_id: event.id,
      event_name: event.event_name,
      event_type: event.event_type,
      event_date: event.event_date,
      total: eventQuotes.reduce((sum, q) => sum + Number(q.total_estimate), 0),
    }
  }).filter(e => e.total > 0)

  // By vendor
  const vendorMap = new Map<string, { name: string; type: string; total: number }>()
  for (const q of acceptedQuotes) {
    const existing = vendorMap.get(q.vendor.id)
    if (existing) {
      existing.total += Number(q.total_estimate)
    } else {
      vendorMap.set(q.vendor.id, {
        name: q.vendor.business_name,
        type: q.vendor.vendor_type,
        total: Number(q.total_estimate),
      })
    }
  }

  return NextResponse.json({
    total_spent: totalSpent,
    currency: events[0]?.currency ?? 'USD',
    by_event: byEvent,
    by_vendor: [...vendorMap.entries()].map(([id, v]) => ({
      vendor_id: id,
      vendor_name: v.name,
      vendor_type: v.type,
      amount: v.total,
    })),
  })
}
