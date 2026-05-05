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

  const existing = await prisma.vendorStaffListing.findUnique({ where: { id } })
  if (!existing || existing.vendor_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const {
    name,
    description,
    hourly_rate,
    min_hours,
    max_staff_available,
    includes_uniform,
    background_checked,
    is_active,
  } = body

  const updated = await prisma.vendorStaffListing.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(hourly_rate !== undefined && { hourly_rate }),
      ...(min_hours !== undefined && { min_hours }),
      ...(max_staff_available !== undefined && { max_staff_available }),
      ...(includes_uniform !== undefined && { includes_uniform }),
      ...(background_checked !== undefined && { background_checked }),
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

  const existing = await prisma.vendorStaffListing.findUnique({ where: { id } })
  if (!existing || existing.vendor_id !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.vendorStaffListing.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
