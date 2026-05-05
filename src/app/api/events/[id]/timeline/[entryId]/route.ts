import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string; entryId: string }>

/**
 * PATCH /api/events/[id]/timeline/[entryId]
 * Update timeline entry. Customer only.
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

  const { id, entryId } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const existing = await prisma.eventTimelineEntry.findFirst({
    where: { id: entryId, event_id: id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Timeline entry not found' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    title,
    description,
    start_time,
    end_time,
    category,
    sub_event_id,
    vendor_id,
    vendor_name,
    location,
    is_public,
    color,
  } = body as {
    title?: string
    description?: string
    start_time?: string
    end_time?: string | null
    category?: string | null
    sub_event_id?: string | null
    vendor_id?: string | null
    vendor_name?: string | null
    location?: string | null
    is_public?: boolean
    color?: string | null
  }

  const entry = await prisma.eventTimelineEntry.update({
    where: { id: entryId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(start_time !== undefined && { start_time: new Date(start_time) }),
      ...(end_time !== undefined && { end_time: end_time ? new Date(end_time) : null }),
      ...(category !== undefined && { category }),
      ...(sub_event_id !== undefined && { sub_event_id }),
      ...(vendor_id !== undefined && { vendor_id }),
      ...(vendor_name !== undefined && { vendor_name }),
      ...(location !== undefined && { location }),
      ...(is_public !== undefined && { is_public }),
      ...(color !== undefined && { color }),
    },
  })

  return NextResponse.json(entry)
}

/**
 * DELETE /api/events/[id]/timeline/[entryId]
 * Remove timeline entry. Customer only.
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

  const { id, entryId } = await params

  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const existing = await prisma.eventTimelineEntry.findFirst({
    where: { id: entryId, event_id: id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Timeline entry not found' }, { status: 404 })
  }

  await prisma.eventTimelineEntry.delete({ where: { id: entryId } })

  return NextResponse.json({ success: true })
}
