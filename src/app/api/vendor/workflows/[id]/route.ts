import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const actionSchema = z.object({
  action_type: z.string().min(1),
  delay_hours: z.number().int().min(0).default(0),
  config: z.record(z.string(), z.unknown()),
  sort_order: z.number().int().default(0),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  trigger: z.enum([
    'NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'CONTRACT_SIGNED',
    'EVENT_UPCOMING_7D', 'EVENT_UPCOMING_1D', 'EVENT_COMPLETED', 'NO_RESPONSE_48H',
  ]).optional(),
  conditions: z.record(z.string(), z.unknown()).nullable().optional(),
  is_active: z.boolean().optional(),
  actions: z.array(actionSchema).optional(),
})

/**
 * GET /api/vendor/workflows/[id]
 * Get a single workflow with its actions.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const workflow = await prisma.vendorWorkflow.findFirst({
    where: { id, vendor_id: userId },
    include: { actions: { orderBy: { sort_order: 'asc' } } },
  })

  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(workflow)
}

/**
 * PATCH /api/vendor/workflows/[id]
 * Update workflow. If actions array is provided, replaces all actions.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.vendorWorkflow.findFirst({
    where: { id, vendor_id: userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const workflow = await prisma.$transaction(async (tx) => {
    await tx.vendorWorkflow.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.trigger !== undefined && { trigger: data.trigger }),
        ...(data.conditions !== undefined && { conditions: data.conditions as any }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    })

    // If actions provided, replace all
    if (data.actions) {
      await tx.workflowAction.deleteMany({ where: { workflow_id: id } })
      await tx.workflowAction.createMany({
        data: data.actions.map((a, i) => ({
          workflow_id: id,
          action_type: a.action_type,
          delay_hours: a.delay_hours,
          config: a.config as any,
          sort_order: a.sort_order ?? i,
        })),
      })
    }

    return tx.vendorWorkflow.findUnique({
      where: { id },
      include: { actions: { orderBy: { sort_order: 'asc' } } },
    })
  })

  return NextResponse.json(workflow)
}

/**
 * DELETE /api/vendor/workflows/[id]
 * Delete workflow (cascades to actions).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.vendorWorkflow.findFirst({
    where: { id, vendor_id: userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.vendorWorkflow.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
