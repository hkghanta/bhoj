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

  const listings = await prisma.vendorStaffListing.findMany({
    where: { vendor_id: userId },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(listings)
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
    staff_role_key,
    name,
    description,
    hourly_rate,
    min_hours,
    max_staff_available,
    includes_uniform,
    background_checked,
  } = body

  if (!staff_role_key || !name || hourly_rate === undefined) {
    return NextResponse.json(
      { error: 'staff_role_key, name, and hourly_rate are required' },
      { status: 400 },
    )
  }

  // Enforce unique vendor + staff_role_key
  const existing = await prisma.vendorStaffListing.findUnique({
    where: {
      vendor_id_staff_role_key: {
        vendor_id: userId,
        staff_role_key,
      },
    },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'You already have a listing for this staff role' },
      { status: 409 },
    )
  }

  const listing = await prisma.vendorStaffListing.create({
    data: {
      vendor_id: userId,
      staff_role_key,
      name,
      description: description ?? null,
      hourly_rate,
      min_hours: min_hours ?? 4,
      max_staff_available: max_staff_available ?? 1,
      includes_uniform: includes_uniform ?? false,
      background_checked: background_checked ?? false,
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
