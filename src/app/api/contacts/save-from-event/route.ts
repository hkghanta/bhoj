import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const saveSchema = z.object({
  event_id: z.string(),
})

/**
 * POST /api/contacts/save-from-event
 * Save all event GuestHouseholds back to the customer's guest book
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const customerId = session.user!.id as string
  const body = await req.json()
  const parsed = saveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: parsed.data.event_id, customer_id: customerId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Get all households from this event
  const households = await prisma.guestHousehold.findMany({
    where: { event_id: parsed.data.event_id },
  })

  let saved = 0
  let skipped = 0
  for (const h of households) {
    try {
      await prisma.customerContact.create({
        data: {
          customer_id: customerId,
          label: h.label,
          email: h.email,
          phone: h.phone,
        },
      })
      saved++
    } catch {
      skipped++ // duplicate label
    }
  }

  return NextResponse.json({ saved, skipped }, { status: 201 })
}
