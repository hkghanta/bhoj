import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const upsertSchema = z.object({
  template: z.string().optional(),
  design_data: z.record(z.string(), z.unknown()).optional(),
  is_digital: z.boolean().optional(),
  is_physical: z.boolean().optional(),
})

/**
 * GET /api/events/[id]/invitation
 * Get the invitation design for an event. Customer only.
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

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
    select: { id: true },
  })
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const design = await prisma.eventInvitationDesign.findUnique({
    where: { event_id: id },
  })

  if (!design) {
    return NextResponse.json({ error: 'No invitation design found' }, { status: 404 })
  }

  return NextResponse.json(design)
}

/**
 * POST /api/events/[id]/invitation
 * Create or update invitation design (upsert). Customer only.
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

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const design = await prisma.eventInvitationDesign.upsert({
    where: { event_id: id },
    create: {
      event_id: id,
      template: data.template ?? 'traditional',
      design_data: (data.design_data ?? null) as any,
      is_digital: data.is_digital ?? true,
      is_physical: data.is_physical ?? false,
    },
    update: {
      ...(data.template !== undefined && { template: data.template }),
      ...(data.design_data !== undefined && { design_data: data.design_data as any }),
      ...(data.is_digital !== undefined && { is_digital: data.is_digital }),
      ...(data.is_physical !== undefined && { is_physical: data.is_physical }),
    },
  })

  return NextResponse.json(design)
}
