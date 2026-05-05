import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string; chartId: string }>

/**
 * POST /api/events/[id]/seating/[chartId]/tables
 * Add table. Body: { name, shape?, capacity?, x_position?, y_position?, rotation? }.
 */
export async function POST(
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

  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const chart = await prisma.seatingChart.findFirst({
    where: { id: chartId, event_id: id },
  })

  if (!chart) {
    return NextResponse.json({ error: 'Seating chart not found' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, shape, capacity, x_position, y_position, rotation } = body as {
    name: string
    shape?: string
    capacity?: number
    x_position?: number
    y_position?: number
    rotation?: number
  }

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const table = await prisma.seatingTable.create({
    data: {
      chart_id: chartId,
      name,
      shape: shape ?? 'round',
      capacity: capacity ?? 8,
      x_position: x_position ?? 0,
      y_position: y_position ?? 0,
      rotation: rotation ?? 0,
    },
    include: { seats: true },
  })

  return NextResponse.json({ table }, { status: 201 })
}
