import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  category: z.string().nullable().optional(),
  target_amount: z.number().positive().nullable().optional(),
  external_url: z.string().url().nullable().optional(),
  is_cash_fund: z.boolean().optional(),
  is_fulfilled: z.boolean().optional(),
  priority: z.number().int().optional(),
})

/**
 * PATCH /api/events/[id]/registry/items/[itemId]
 * Update registry item. Customer (event owner) only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, itemId } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Verify item belongs to this event's registry
  const item = await prisma.giftRegistryItem.findFirst({
    where: {
      id: itemId,
      registry: { event_id: id },
    },
    select: { id: true },
  })
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.target_amount !== undefined) {
    data.target_amount = parsed.data.target_amount !== null ? new Decimal(parsed.data.target_amount) : null
  }

  const updated = await prisma.giftRegistryItem.update({
    where: { id: itemId },
    data,
  })

  return NextResponse.json(updated)
}

/**
 * DELETE /api/events/[id]/registry/items/[itemId]
 * Remove registry item. Customer (event owner) only.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, itemId } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Verify item belongs to this event's registry
  const item = await prisma.giftRegistryItem.findFirst({
    where: {
      id: itemId,
      registry: { event_id: id },
    },
    select: { id: true },
  })
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  await prisma.giftRegistryItem.delete({ where: { id: itemId } })

  return NextResponse.json({ deleted: true })
}
