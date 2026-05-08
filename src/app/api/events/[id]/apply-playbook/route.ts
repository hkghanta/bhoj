import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

type Params = { id: string }

export async function POST(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id: eventId, customer_id: customerId },
    select: { id: true, event_type: true, event_date: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Check for existing checklist items — avoid duplicates
  const existingCount = await prisma.eventChecklistItem.count({
    where: { event_id: eventId },
  })
  if (existingCount > 0) {
    return NextResponse.json(
      { error: 'Checklist items already exist. Clear them first to re-apply a playbook.' },
      { status: 409 },
    )
  }

  // Find matching playbook
  const playbook = await prisma.eventPlaybook.findUnique({
    where: { event_type: event.event_type },
  })
  if (!playbook) {
    return NextResponse.json(
      { error: `No playbook found for event type "${event.event_type}"` },
      { status: 404 },
    )
  }

  const eventDate = event.event_date

  // Create checklist items
  const checklistData = playbook.checklist as Array<{
    category: string
    items: Array<{ name: string; due_offset_days: number }>
  }>

  const checklistRecords = checklistData.flatMap(cat =>
    cat.items.map(item => ({
      event_id: eventId,
      category: cat.category,
      item_name: item.name,
      due_date: addDays(eventDate, item.due_offset_days),
    })),
  )

  const createdChecklist = await prisma.eventChecklistItem.createMany({
    data: checklistRecords,
  })

  // Create sub-events if defined
  let createdSubEvents = 0
  const subEventsData = playbook.sub_events as Array<{
    name: string
    type: string
    offset_days: number
  }> | null

  if (subEventsData && subEventsData.length > 0) {
    // Check for existing sub-events to avoid duplicates
    const existingSubEvents = await prisma.subEvent.count({
      where: { event_id: eventId },
    })

    if (existingSubEvents === 0) {
      const subEventRecords = subEventsData.map((se, idx) => ({
        event_id: eventId,
        name: se.name,
        event_type: se.type,
        event_date: addDays(eventDate, se.offset_days),
        sort_order: idx,
      }))

      const result = await prisma.subEvent.createMany({
        data: subEventRecords,
      })
      createdSubEvents = result.count
    }
  }

  return NextResponse.json({
    ok: true,
    checklist_items_created: createdChecklist.count,
    sub_events_created: createdSubEvents,
  })
}
