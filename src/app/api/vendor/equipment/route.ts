import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const equipment = await prisma.vendorEquipment.findMany({
    where: { vendor_id: userId },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(equipment)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    equipment_key,
    name,
    description,
    price_per_unit,
    price_per_event,
    quantity_available,
    min_rental_hours,
  } = body

  if (!equipment_key || !name) {
    return NextResponse.json(
      { error: 'equipment_key and name are required' },
      { status: 400 },
    )
  }

  // Enforce unique vendor + equipment_key
  const existing = await prisma.vendorEquipment.findUnique({
    where: {
      vendor_id_equipment_key: {
        vendor_id: userId,
        equipment_key,
      },
    },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'You already have a listing for this equipment type' },
      { status: 409 },
    )
  }

  const item = await prisma.vendorEquipment.create({
    data: {
      vendor_id: userId,
      equipment_key,
      name,
      description: description ?? null,
      price_per_unit: price_per_unit ?? null,
      price_per_event: price_per_event ?? null,
      quantity_available: quantity_available ?? 1,
      min_rental_hours: min_rental_hours ?? 4,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
