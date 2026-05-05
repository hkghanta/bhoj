import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  terms_and_conditions: z.string().nullable().optional(),
  is_default: z.boolean().optional(),
})

/**
 * PATCH /api/vendor/contract-templates/[id]
 * Update a contract template (auth: vendor, verify ownership).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: templateId } = await params

  const existing = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, vendor_id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }
  if (existing.vendor_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, content, terms_and_conditions, is_default } = parsed.data

  const template = await prisma.$transaction(async (tx) => {
    if (is_default) {
      await tx.contractTemplate.updateMany({
        where: { vendor_id: userId, is_default: true, id: { not: templateId } },
        data: { is_default: false },
      })
    }

    return tx.contractTemplate.update({
      where: { id: templateId },
      data: {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(terms_and_conditions !== undefined && { terms_and_conditions }),
        ...(is_default !== undefined && { is_default }),
      },
    })
  })

  return NextResponse.json({ template })
}

/**
 * DELETE /api/vendor/contract-templates/[id]
 * Delete a contract template (auth: vendor, verify ownership).
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: templateId } = await params

  const existing = await prisma.contractTemplate.findUnique({
    where: { id: templateId },
    select: { id: true, vendor_id: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }
  if (existing.vendor_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.contractTemplate.delete({ where: { id: templateId } })

  return NextResponse.json({ success: true })
}
