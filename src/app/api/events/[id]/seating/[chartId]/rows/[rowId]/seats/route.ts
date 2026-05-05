import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string; chartId: string; rowId: string }>

/** POST /api/events/[id]/seating/[chartId]/rows/[rowId]/seats — Assign a guest to a seat in this row */
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string
  if (role !== 'customer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, chartId, rowId } = await params

  const event = await prisma.event.findFirst({ where: { id, customer_id: userId }, select: { id: true } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const chart = await prisma.seatingChart.findFirst({ where: { id: chartId, event_id: id } })
  if (!chart) return NextResponse.json({ error: 'Chart not found' }, { status: 404 })

  const row = await prisma.seatingRow.findFirst({ where: { id: rowId, chart_id: chartId } })
  if (!row) return NextResponse.json({ error: 'Row not found' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { attendee_id, household_id, seat_number } = body as {
    attendee_id?: string; household_id?: string; seat_number: number
  }

  const seat = await prisma.rowSeatAssignment.create({
    data: {
      row_id: rowId,
      attendee_id: attendee_id ?? null,
      household_id: household_id ?? null,
      seat_number,
    },
  })

  return NextResponse.json({ seat }, { status: 201 })
}
