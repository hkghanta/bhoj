import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string; vendorId: string }>

/**
 * PATCH /api/events/[id]/vendors/[vendorId]
 * Update vendor timeline/role/notes for an event.
 */
export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, vendorId } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user!.id as string },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { role, setup_time, service_start, service_end, notes } = body

  const updated = await prisma.eventVendor.update({
    where: { event_id_vendor_id: { event_id: id, vendor_id: vendorId } },
    data: {
      role: role ?? undefined,
      setup_time: setup_time ? new Date(setup_time) : undefined,
      service_start: service_start ? new Date(service_start) : undefined,
      service_end: service_end ? new Date(service_end) : undefined,
      notes: notes ?? undefined,
    },
  })

  return NextResponse.json(updated)
}

/**
 * DELETE /api/events/[id]/vendors/[vendorId]
 * Remove a vendor from an event.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'customer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, vendorId } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: session.user!.id as string },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.eventVendor.delete({
    where: { event_id_vendor_id: { event_id: id, vendor_id: vendorId } },
  })

  return NextResponse.json({ ok: true })
}
