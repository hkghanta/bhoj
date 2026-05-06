import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const importSchema = z.object({
  event_id: z.string(),
  contact_ids: z.array(z.string()).min(1),
})

/**
 * POST /api/contacts/import-to-event
 * Import contacts from guest book into an event as GuestHouseholds
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customerId = session.user!.id as string
  const body = await req.json()
  const parsed = importSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { event_id, contact_ids } = parsed.data

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: event_id, customer_id: customerId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Fetch selected contacts
  const contacts = await prisma.customerContact.findMany({
    where: { id: { in: contact_ids }, customer_id: customerId },
  })

  // Get existing household labels for this event to avoid duplicates
  const existingHouseholds = await prisma.guestHousehold.findMany({
    where: { event_id },
    select: { label: true },
  })
  const existingLabels = new Set(existingHouseholds.map(h => h.label.toLowerCase()))

  let imported = 0
  let skipped = 0
  for (const contact of contacts) {
    if (existingLabels.has(contact.label.toLowerCase())) {
      skipped++
      continue
    }
    await prisma.guestHousehold.create({
      data: {
        event_id,
        label: contact.label,
        email: contact.email,
        phone: contact.phone,
      },
    })
    imported++
  }

  return NextResponse.json({ imported, skipped }, { status: 201 })
}
