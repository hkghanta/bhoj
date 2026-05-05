import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().optional(),
  message: z.string().optional(),
})

const updateSchema = z.object({
  title: z.string().optional(),
  message: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
})

/**
 * GET /api/events/[id]/registry
 * Get registry with items. Public if published, otherwise owner only.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  const registry = await prisma.giftRegistry.findUnique({
    where: { event_id: id },
    include: {
      items: {
        orderBy: [{ priority: 'desc' }, { created_at: 'asc' }],
        include: {
          _count: { select: { contributions: true } },
        },
      },
      event: {
        select: { customer_id: true },
      },
    },
  })

  if (!registry) {
    return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
  }

  // Public access if published, otherwise owner only
  if (!registry.is_published) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user!.id as string
    if (registry.event.customer_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  // Remove internal event relation from response
  const { event: _event, ...registryData } = registry
  return NextResponse.json(registryData)
}

/**
 * POST /api/events/[id]/registry
 * Create registry. Customer (event owner) only. Returns 409 if exists.
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

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Check if registry already exists
  const existing = await prisma.giftRegistry.findUnique({
    where: { event_id: id },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: 'Registry already exists for this event' }, { status: 409 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const registry = await prisma.giftRegistry.create({
    data: {
      event_id: id,
      title: parsed.data.title,
      message: parsed.data.message,
    },
  })

  return NextResponse.json(registry, { status: 201 })
}

/**
 * PATCH /api/events/[id]/registry
 * Update title, message, is_published. Customer (event owner) only.
 */
export async function PATCH(
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

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const registry = await prisma.giftRegistry.findUnique({
    where: { event_id: id },
    select: { id: true },
  })
  if (!registry) {
    return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.giftRegistry.update({
    where: { event_id: id },
    data: parsed.data,
  })

  return NextResponse.json(updated)
}
