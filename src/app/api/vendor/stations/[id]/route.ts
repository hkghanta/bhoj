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

  const existing = await prisma.vendorStation.findUnique({ where: { id } })
  if (!existing || existing.vendor_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const {
    pricing_model,
    base_price,
    price_per_person,
    hourly_rate,
    min_guests,
    max_guests,
    includes_chef,
    includes_equipment,
    description,
    is_active,
  } = body

  const updated = await prisma.vendorStation.update({
    where: { id },
    data: {
      ...(pricing_model !== undefined && { pricing_model }),
      ...(base_price !== undefined && { base_price }),
      ...(price_per_person !== undefined && { price_per_person }),
      ...(hourly_rate !== undefined && { hourly_rate }),
      ...(min_guests !== undefined && { min_guests }),
      ...(max_guests !== undefined && { max_guests }),
      ...(includes_chef !== undefined && { includes_chef }),
      ...(includes_equipment !== undefined && { includes_equipment }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active }),
    },
    include: { station_template: true },
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

  const existing = await prisma.vendorStation.findUnique({ where: { id } })
  if (!existing || existing.vendor_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.vendorStation.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
