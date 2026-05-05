import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

type Params = Promise<{ id: string; chartId: string }>

async function verifyEventOwner(eventId: string, userId: string) {
  return prisma.event.findFirst({
    where: { id: eventId, customer_id: userId },
    select: { id: true },
  })
}

/**
 * GET /api/events/[id]/seating/[chartId]
 * Get chart with tables and seat assignments.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, chartId } = await params

  const event = await verifyEventOwner(id, userId)
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const chart = await prisma.seatingChart.findFirst({
    where: { id: chartId, event_id: id },
    include: {
      tables: {
        include: { seats: true },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!chart) {
    return NextResponse.json({ error: 'Seating chart not found' }, { status: 404 })
  }

  return NextResponse.json({ chart })
}

/**
 * PATCH /api/events/[id]/seating/[chartId]
 * Update chart name/layout.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, chartId } = await params

  const event = await verifyEventOwner(id, userId)
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const existing = await prisma.seatingChart.findFirst({
    where: { id: chartId, event_id: id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Seating chart not found' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, layout, layout_type } = body as {
    name?: string
    layout?: Record<string, unknown>
    layout_type?: string
  }

  const chart = await prisma.seatingChart.update({
    where: { id: chartId },
    data: {
      ...(name !== undefined && { name }),
      ...(layout_type !== undefined && { layout_type }),
      ...(layout !== undefined && { layout: layout ? (layout as Prisma.InputJsonValue) : Prisma.JsonNull }),
    },
    include: {
      tables: {
        include: { seats: true },
        orderBy: { name: 'asc' },
      },
      rows: {
        include: { seats: true },
        orderBy: { row_number: 'asc' },
      },
    },
  })

  return NextResponse.json({ chart })
}

/**
 * DELETE /api/events/[id]/seating/[chartId]
 * Delete chart.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Params }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, chartId } = await params

  const event = await verifyEventOwner(id, userId)
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const existing = await prisma.seatingChart.findFirst({
    where: { id: chartId, event_id: id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Seating chart not found' }, { status: 404 })
  }

  await prisma.seatingChart.delete({ where: { id: chartId } })

  return NextResponse.json({ success: true })
}
