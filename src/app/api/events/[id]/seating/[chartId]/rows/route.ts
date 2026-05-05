import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string; chartId: string }>

/** POST /api/events/[id]/seating/[chartId]/rows — Add a row */
export async function POST(req: NextRequest, { params }: { params: Params }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string
  if (role !== 'customer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, chartId } = await params

  const event = await prisma.event.findFirst({ where: { id, customer_id: userId }, select: { id: true } })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const chart = await prisma.seatingChart.findFirst({ where: { id: chartId, event_id: id } })
  if (!chart) return NextResponse.json({ error: 'Chart not found' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name, section, capacity, row_number } = body as {
    name: string; section?: string; capacity?: number; row_number?: number
  }
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const row = await prisma.seatingRow.create({
    data: {
      chart_id: chartId,
      name,
      section: section ?? null,
      capacity: capacity ?? 10,
      row_number: row_number ?? 0,
    },
    include: { seats: true },
  })

  return NextResponse.json({ row }, { status: 201 })
}
