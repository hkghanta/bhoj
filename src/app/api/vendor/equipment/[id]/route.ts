import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.vendorEquipment.findUnique({ where: { id } })
  if (!existing || existing.vendor_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const {
    name,
    description,
    price_per_unit,
    price_per_event,
    quantity_available,
    min_rental_hours,
    is_active,
  } = body

  const updated = await prisma.vendorEquipment.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price_per_unit !== undefined && { price_per_unit }),
      ...(price_per_event !== undefined && { price_per_event }),
      ...(quantity_available !== undefined && { quantity_available }),
      ...(min_rental_hours !== undefined && { min_rental_hours }),
      ...(is_active !== undefined && { is_active }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.vendorEquipment.findUnique({ where: { id } })
  if (!existing || existing.vendor_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.vendorEquipment.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
