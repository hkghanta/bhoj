import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  const { id } = await params

  // Allow event owner or admin to view coordinator
  if (role === 'customer') {
    const event = await prisma.event.findFirst({
      where: { id, customer_id: userId },
    })
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } else if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const coordinator = await prisma.eventCoordinator.findUnique({
    where: { event_id: id },
  })

  if (!coordinator) {
    return NextResponse.json({ error: 'No coordinator assigned' }, { status: 404 })
  }

  return NextResponse.json(coordinator)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const { id } = await params

  // Verify event exists
  const event = await prisma.event.findUnique({ where: { id } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Check if coordinator already assigned
  const existing = await prisma.eventCoordinator.findUnique({
    where: { event_id: id },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'A coordinator is already assigned to this event' },
      { status: 409 },
    )
  }

  const body = await request.json()
  const { staff_name, staff_email, staff_phone, notes, priority } = body

  if (!staff_name || !staff_email) {
    return NextResponse.json(
      { error: 'staff_name and staff_email are required' },
      { status: 400 },
    )
  }

  const coordinator = await prisma.eventCoordinator.create({
    data: {
      event_id: id,
      staff_name,
      staff_email,
      staff_phone: staff_phone ?? null,
      notes: notes ?? null,
      priority: priority ?? 'STANDARD',
    },
  })

  return NextResponse.json(coordinator, { status: 201 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const { id } = await params

  const coordinator = await prisma.eventCoordinator.findUnique({
    where: { event_id: id },
  })
  if (!coordinator) {
    return NextResponse.json({ error: 'No coordinator assigned' }, { status: 404 })
  }

  const body = await request.json()
  const { status, notes, priority, staff_name, staff_email, staff_phone } = body

  const data: Record<string, unknown> = {}
  if (status !== undefined) data.status = status
  if (notes !== undefined) data.notes = notes
  if (priority !== undefined) data.priority = priority
  if (staff_name !== undefined) data.staff_name = staff_name
  if (staff_email !== undefined) data.staff_email = staff_email
  if (staff_phone !== undefined) data.staff_phone = staff_phone

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const updated = await prisma.eventCoordinator.update({
    where: { event_id: id },
    data,
  })

  return NextResponse.json(updated)
}
