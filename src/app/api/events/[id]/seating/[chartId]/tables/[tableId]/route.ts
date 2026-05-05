import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string; chartId: string; tableId: string }>

/**
 * PATCH /api/events/[id]/seating/[chartId]/tables/[tableId]
 * Update table position/name/shape/capacity.
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

  const { id, chartId, tableId } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const table = await prisma.seatingTable.findFirst({
    where: { id: tableId, chart_id: chartId, chart: { event_id: id } },
  })

  if (!table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, shape, capacity, x_position, y_position, rotation } = body as {
    name?: string
    shape?: string
    capacity?: number
    x_position?: number
    y_position?: number
    rotation?: number
  }

  const updated = await prisma.seatingTable.update({
    where: { id: tableId },
    data: {
      ...(name !== undefined && { name }),
      ...(shape !== undefined && { shape }),
      ...(capacity !== undefined && { capacity }),
      ...(x_position !== undefined && { x_position }),
      ...(y_position !== undefined && { y_position }),
      ...(rotation !== undefined && { rotation }),
    },
    include: { seats: true },
  })

  return NextResponse.json({ table: updated })
}

/**
 * DELETE /api/events/[id]/seating/[chartId]/tables/[tableId]
 * Remove table.
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

  const { id, chartId, tableId } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const table = await prisma.seatingTable.findFirst({
    where: { id: tableId, chart_id: chartId, chart: { event_id: id } },
  })

  if (!table) {
    return NextResponse.json({ error: 'Table not found' }, { status: 404 })
  }

  await prisma.seatingTable.delete({ where: { id: tableId } })

  return NextResponse.json({ success: true })
}
