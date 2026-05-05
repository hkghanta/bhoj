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

  const stations = await prisma.vendorStation.findMany({
    where: { vendor_id: userId },
    include: { station_template: true },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(stations)
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
    station_template_id,
    custom_template, // { name, description, icon }
    pricing_model,
    base_price,
    price_per_person,
    hourly_rate,
    min_guests,
    max_guests,
    includes_chef,
    includes_equipment,
    description,
  } = body

  if (!pricing_model) {
    return NextResponse.json(
      { error: 'pricing_model is required' },
      { status: 400 },
    )
  }

  // Either use existing template or create a custom one
  let templateId = station_template_id
  if (!templateId && custom_template?.name) {
    const key = custom_template.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    const template = await prisma.stationTemplate.create({
      data: {
        station_key: `custom_${userId}_${key}`,
        name: custom_template.name,
        description: custom_template.description ?? null,
        icon: custom_template.icon ?? 'utensils',
        is_custom: true,
        vendor_id: userId,
      },
    })
    templateId = template.id
  }

  if (!templateId) {
    return NextResponse.json(
      { error: 'station_template_id or custom_template is required' },
      { status: 400 },
    )
  }

  // Check for duplicate vendor + template
  const existing = await prisma.vendorStation.findUnique({
    where: {
      vendor_id_station_template_id: {
        vendor_id: userId,
        station_template_id: templateId,
      },
    },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'You already offer this station type' },
      { status: 409 },
    )
  }

  const station = await prisma.vendorStation.create({
    data: {
      vendor_id: userId,
      station_template_id: templateId,
      pricing_model,
      base_price: base_price ?? null,
      price_per_person: price_per_person ?? null,
      hourly_rate: hourly_rate ?? null,
      min_guests: min_guests ?? null,
      max_guests: max_guests ?? null,
      includes_chef: includes_chef ?? true,
      includes_equipment: includes_equipment ?? true,
      description: description ?? null,
    },
    include: { station_template: true },
  })

  return NextResponse.json(station, { status: 201 })
}
