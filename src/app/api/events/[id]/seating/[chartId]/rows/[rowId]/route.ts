import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type Params = Promise<{ id: string; chartId: string; rowId: string }>

/** DELETE /api/events/[id]/seating/[chartId]/rows/[rowId] — Remove a row */
export async function DELETE(_req: Request, { params }: { params: Params }) {
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

  await prisma.seatingRow.delete({ where: { id: rowId } })

  return NextResponse.json({ success: true })
}
