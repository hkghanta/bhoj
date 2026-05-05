import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  category: z.string().optional(),
  target_amount: z.number().positive().optional(),
  external_url: z.string().url().optional(),
  is_cash_fund: z.boolean().optional(),
  priority: z.number().int().optional(),
})

/**
 * GET /api/events/[id]/registry/items
 * List registry items with contribution totals. Public if registry published.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()

  const registry = await prisma.giftRegistry.findUnique({
    where: { event_id: id },
    select: { id: true, is_published: true, event: { select: { customer_id: true } } },
  })

  if (!registry) {
    return NextResponse.json({ error: 'Registry not found' }, { status: 404 })
  }

  if (!registry.is_published) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user!.id as string
    if (registry.event.customer_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const items = await prisma.giftRegistryItem.findMany({
    where: { registry_id: registry.id },
    orderBy: [{ priority: 'desc' }, { created_at: 'asc' }],
    include: {
      contributions: {
        select: { amount: true, guest_name: true, message: true, is_anonymous: true, created_at: true },
        orderBy: { created_at: 'desc' },
      },
    },
  })

  return NextResponse.json({ items })
}

/**
 * POST /api/events/[id]/registry/items
 * Add item to registry. Customer (event owner) only.
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

  // Verify registry exists
  const registry = await prisma.giftRegistry.findUnique({
    where: { event_id: id },
    select: { id: true },
  })
  if (!registry) {
    return NextResponse.json({ error: 'Registry not found. Create a registry first.' }, { status: 404 })
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

  const item = await prisma.giftRegistryItem.create({
    data: {
      registry_id: registry.id,
      name: parsed.data.name,
      description: parsed.data.description,
      image_url: parsed.data.image_url,
      category: parsed.data.category,
      target_amount: parsed.data.target_amount ? new Decimal(parsed.data.target_amount) : undefined,
      external_url: parsed.data.external_url,
      is_cash_fund: parsed.data.is_cash_fund,
      priority: parsed.data.priority,
    },
  })

  return NextResponse.json(item, { status: 201 })
}
