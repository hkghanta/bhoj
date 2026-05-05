import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  declined: z.boolean().optional(),
})

async function getAuthedHousehold(householdId: string, eventId: string, customerId: string) {
  return prisma.guestHousehold.findFirst({
    where: { id: householdId, event_id: eventId, event: { customer_id: customerId } },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; householdId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, householdId } = await params
  const existing = await getAuthedHousehold(householdId, id, session.user!.id as string)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.guestHousehold.update({ where: { id: householdId }, data: parsed.data })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; householdId: string }> }
) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, householdId } = await params
  const existing = await getAuthedHousehold(householdId, id, session.user!.id as string)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.guestHousehold.delete({ where: { id: householdId } })
  return new NextResponse(null, { status: 204 })
}
