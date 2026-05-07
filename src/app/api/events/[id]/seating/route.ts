import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

/**
 * GET /api/events/[id]/seating
 * List seating charts for event with tables and assignments. Customer only (event owner).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const charts = await prisma.seatingChart.findMany({
    where: { event_id: id },
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
    orderBy: { created_at: 'asc' },
  })

  return NextResponse.json({ charts })
}

/**
 * POST /api/events/[id]/seating
 * Create a seating chart. Body: { name?, layout?, layout_type? }. Customer only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

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

  const { name, layout, layout_type } = body as {
    name?: string
    layout?: Record<string, unknown>
    layout_type?: string
  }

  const chart = await prisma.seatingChart.create({
    data: {
      event_id: id,
      name: name ?? 'Main Seating',
      layout_type: layout_type ?? 'dining',
      layout: layout ? (layout as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
    include: {
      tables: true,
      rows: true,
    },
  })

  return NextResponse.json({ chart }, { status: 201 })
}
