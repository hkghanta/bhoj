import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/customer/spend-analytics
 * Customer spend analytics from accepted quotes on their events.
 */
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all accepted quotes for this customer's events
  const quotes = await prisma.quote.findMany({
    where: {
      status: 'ACCEPTED',
      match: {
        event_request: {
          event: { customer_id: userId },
        },
      },
    },
    select: {
      id: true,
      total_estimate: true,
      created_at: true,
      vendor_id: true,
      vendor: { select: { id: true, business_name: true } },
      match: {
        select: {
          event_request: {
            select: {
              event: { select: { id: true, event_type: true } },
            },
          },
        },
      },
    },
  })

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  let totalSpend = 0
  let last30Days = 0
  let last90Days = 0

  const vendorMap = new Map<string, { name: string; total: number; count: number }>()
  const eventTypeMap = new Map<string, { total: number; count: number }>()

  for (const q of quotes) {
    const amount = Number(q.total_estimate)
    totalSpend += amount

    if (q.created_at >= thirtyDaysAgo) {
      last30Days += amount
    }
    if (q.created_at >= ninetyDaysAgo) {
      last90Days += amount
    }

    // By vendor
    const vendorId = q.vendor_id
    const vendorEntry = vendorMap.get(vendorId) || { name: q.vendor.business_name, total: 0, count: 0 }
    vendorEntry.total += amount
    vendorEntry.count += 1
    vendorMap.set(vendorId, vendorEntry)

    // By event type
    const eventType = q.match.event_request.event.event_type
    const typeEntry = eventTypeMap.get(eventType) || { total: 0, count: 0 }
    typeEntry.total += amount
    typeEntry.count += 1
    eventTypeMap.set(eventType, typeEntry)
  }

  const orderCount = quotes.length
  const averageOrderValue = orderCount > 0 ? totalSpend / orderCount : 0

  const byVendor = Array.from(vendorMap.entries()).map(([vendorId, data]) => ({
    vendor_id: vendorId,
    vendor_name: data.name,
    total: Math.round(data.total * 100) / 100,
    count: data.count,
  }))

  const byEventType = Array.from(eventTypeMap.entries()).map(([type, data]) => ({
    event_type: type,
    total: Math.round(data.total * 100) / 100,
    count: data.count,
  }))

  return NextResponse.json({
    total_spend: Math.round(totalSpend * 100) / 100,
    last_30_days: Math.round(last30Days * 100) / 100,
    last_90_days: Math.round(last90Days * 100) / 100,
    average_order_value: Math.round(averageOrderValue * 100) / 100,
    order_count: orderCount,
    by_vendor: byVendor,
    by_event_type: byEventType,
  })
}
