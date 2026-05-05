import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  stage: z.enum([
    'INQUIRY', 'PROPOSAL_SENT', 'TASTING_SCHEDULED', 'NEGOTIATING',
    'CONTRACT_SENT', 'BOOKED', 'IN_PROGRESS', 'COMPLETED', 'LOST',
  ]).optional(),
  notes: z.string().optional(),
  follow_up_date: z.string().datetime().nullable().optional(),
})

/**
 * PATCH /api/vendor/pipeline/[id]
 * Update a pipeline entry's stage, notes, or follow_up_date.
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

  const existing = await prisma.vendorPipelineEntry.findFirst({
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

  const updated = await prisma.vendorPipelineEntry.update({
    where: { id },
    data: {
      ...(data.stage !== undefined && { stage: data.stage }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.follow_up_date !== undefined && {
        follow_up_date: data.follow_up_date ? new Date(data.follow_up_date) : null,
      }),
    },
  })

  return NextResponse.json(updated)
}

/**
 * DELETE /api/vendor/pipeline/[id]
 * Remove a pipeline entry.
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

  const existing = await prisma.vendorPipelineEntry.findFirst({
    where: { id, vendor_id: userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.vendorPipelineEntry.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
