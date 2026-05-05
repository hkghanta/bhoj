import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/quotes/[id]/menu
// Customer updates menu: toggle removed items, save notes, optionally finalize
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const customerId = session.user!.id as string

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      match: { event_request: { event: { customer_id: customerId } } },
    },
    include: { menu_items: true },
  })
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const {
    removed_item_ids,   // string[] — QuoteMenuItem IDs to mark as removed
    added_items,        // { item_name: string; category: string }[] — customer-added items
    customer_menu_notes, // string | null
    finalize,           // boolean — mark menu as finalized
  } = body

  // Update removals: un-remove all first, then apply new set
  if (Array.isArray(removed_item_ids)) {
    // Reset all existing items for this quote
    await prisma.quoteMenuItem.updateMany({
      where: { quote_id: id },
      data: { is_removed_by_customer: false },
    })
    // Mark the new set as removed
    if (removed_item_ids.length > 0) {
      await prisma.quoteMenuItem.updateMany({
        where: { quote_id: id, id: { in: removed_item_ids } },
        data: { is_removed_by_customer: true },
      })
    }
  }

  // Remove any previously customer-added items and re-add fresh list
  if (Array.isArray(added_items)) {
    await prisma.quoteMenuItem.deleteMany({
      where: { quote_id: id, added_by_customer: true },
    })
    if (added_items.length > 0) {
      await prisma.quoteMenuItem.createMany({
        data: added_items.map((item: { item_name: string; category: string }, i: number) => ({
          quote_id: id,
          item_name: item.item_name,
          category: item.category as any,
          is_optional: false,
          added_by_customer: true,
          sort_order: 1000 + i,
        })),
      })
    }
  }

  // Update notes + finalize flag on quote
  const updateData: Record<string, unknown> = {}
  if (customer_menu_notes !== undefined) updateData.customer_menu_notes = customer_menu_notes
  if (finalize === true) updateData.is_menu_finalized = true
  if (finalize === false) updateData.is_menu_finalized = false

  const updatedQuote = await prisma.quote.update({
    where: { id },
    data: updateData,
    include: {
      menu_items: { orderBy: [{ category: 'asc' }, { sort_order: 'asc' }] },
    },
  })

  return NextResponse.json(updatedQuote)
}
