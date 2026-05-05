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

const createSchema = z.object({
  name: z.string().min(1),
  trigger: z.enum([
    'NEW_LEAD', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'CONTRACT_SIGNED',
    'EVENT_UPCOMING_7D', 'EVENT_UPCOMING_1D', 'EVENT_COMPLETED', 'NO_RESPONSE_48H',
  ]),
  conditions: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().default(true),
  actions: z.array(actionSchema).min(1),
})

/**
 * GET /api/vendor/workflows
 * List workflows with their actions.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const workflows = await prisma.vendorWorkflow.findMany({
    where: { vendor_id: userId },
    include: { actions: { orderBy: { sort_order: 'asc' } } },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(workflows)
}

/**
 * POST /api/vendor/workflows
 * Create a workflow with actions in a transaction.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const workflow = await prisma.$transaction(async (tx) => {
    const wf = await tx.vendorWorkflow.create({
      data: {
        vendor_id: userId,
        name: data.name,
        trigger: data.trigger,
        conditions: (data.conditions ?? null) as any,
        is_active: data.is_active,
      },
    })

    await tx.workflowAction.createMany({
      data: data.actions.map((a, i) => ({
        workflow_id: wf.id,
        action_type: a.action_type,
        delay_hours: a.delay_hours,
        config: a.config as any,
        sort_order: a.sort_order ?? i,
      })),
    })

    return tx.vendorWorkflow.findUnique({
      where: { id: wf.id },
      include: { actions: { orderBy: { sort_order: 'asc' } } },
    })
  })

  return NextResponse.json(workflow, { status: 201 })
}
