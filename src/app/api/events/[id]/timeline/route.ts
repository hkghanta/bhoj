import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/events/[id]/timeline
 * Get timeline entries ordered by start_time. Customer only (or public entries if is_public).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  const { id } = await params

  // Check if user is event owner
  const event = await prisma.event.findFirst({
    where: { id },
    select: { id: true, customer_id: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const isOwner = role === 'customer' && event.customer_id === userId

  const entries = await prisma.eventTimelineEntry.findMany({
    where: {
      event_id: id,
      // Non-owners only see public entries
      ...(!isOwner && { is_public: true }),
    },
    orderBy: { start_time: 'asc' },
  })

  return NextResponse.json(entries)
}

/**
 * POST /api/events/[id]/timeline
 * Add timeline entry. Customer only.
 * Body: { title, description?, start_time, end_time?, category?, vendor_id?, vendor_name?, location?, is_public?, color? }
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

  const {
    title,
    description,
    start_time,
    end_time,
    category,
    vendor_id,
    vendor_name,
    location,
    is_public,
    color,
  } = body as {
    title: string
    description?: string
    start_time: string
    end_time?: string
    category?: string
    vendor_id?: string
    vendor_name?: string
    location?: string
    is_public?: boolean
    color?: string
  }

  if (!title || !start_time) {
    return NextResponse.json({ error: 'title and start_time are required' }, { status: 400 })
  }

  try {
    const entry = await prisma.eventTimelineEntry.create({
      data: {
        event_id: id,
        title,
        description: description ?? null,
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : null,
        category: category ?? null,
        vendor_id: vendor_id ?? null,
        vendor_name: vendor_name ?? null,
        location: location ?? null,
        is_public: is_public ?? true,
        color: color ?? null,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (err: unknown) {
    console.error('Timeline create error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
