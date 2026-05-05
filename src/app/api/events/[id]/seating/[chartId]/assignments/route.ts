import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string; chartId: string }>

/**
 * POST /api/events/[id]/seating/[chartId]/assignments
 * Assign guest to seat. Body: { table_id, household_id?, attendee_id?, seat_number? }.
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

  const { table_id, household_id, attendee_id, seat_number } = body as {
    table_id: string
    household_id?: string
    attendee_id?: string
    seat_number?: number
  }

  if (!table_id) {
    return NextResponse.json({ error: 'table_id is required' }, { status: 400 })
  }

  // Verify table belongs to this chart
  const table = await prisma.seatingTable.findFirst({
    where: { id: table_id, chart_id: chartId },
  })

  if (!table) {
    return NextResponse.json({ error: 'Table not found in this chart' }, { status: 404 })
  }

  const assignment = await prisma.seatAssignment.create({
    data: {
      table_id,
      household_id: household_id ?? null,
      attendee_id: attendee_id ?? null,
      seat_number: seat_number ?? null,
    },
  })

  return NextResponse.json({ assignment }, { status: 201 })
}

/**
 * DELETE /api/events/[id]/seating/[chartId]/assignments
 * Remove assignment. Body: { assignment_id }.
 */
export async function DELETE(
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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { assignment_id } = body as { assignment_id: string }

  if (!assignment_id) {
    return NextResponse.json({ error: 'assignment_id is required' }, { status: 400 })
  }

  // Verify assignment belongs to this chart
  const assignment = await prisma.seatAssignment.findFirst({
    where: {
      id: assignment_id,
      table: { chart_id: chartId, chart: { event_id: id } },
    },
  })

  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  }

  await prisma.seatAssignment.delete({ where: { id: assignment_id } })

  return NextResponse.json({ success: true })
}
