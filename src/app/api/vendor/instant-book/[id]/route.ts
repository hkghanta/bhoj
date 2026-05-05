import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price_type: z.enum(['FLAT', 'PER_PERSON', 'HOURLY']).optional(),
  price: z.number().positive().optional(),
  min_guests: z.number().int().positive().nullable().optional(),
  max_guests: z.number().int().positive().nullable().optional(),
  min_hours: z.number().int().positive().nullable().optional(),
  includes: z.array(z.string()).nullable().optional(),
  photos: z.array(z.string()).optional(),

  is_active: z.boolean().optional(),
  advance_notice_hours: z.number().int().min(0).optional(),
})

/**
 * PATCH /api/vendor/instant-book/[id]
 * Update an instant book package.
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

  const existing = await prisma.instantBookPackage.findFirst({
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
  const updated = await prisma.instantBookPackage.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price_type !== undefined && { price_type: data.price_type }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.min_guests !== undefined && { min_guests: data.min_guests }),
      ...(data.max_guests !== undefined && { max_guests: data.max_guests }),
      ...(data.min_hours !== undefined && { min_hours: data.min_hours }),
      ...(data.includes !== undefined && { includes: (data.includes ?? null) as any }),
      ...(data.photos !== undefined && { photos: data.photos }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      ...(data.advance_notice_hours !== undefined && { advance_notice_hours: data.advance_notice_hours }),
    },
  })

  return NextResponse.json(updated)
}

/**
 * DELETE /api/vendor/instant-book/[id]
 * Remove an instant book package.
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

  const existing = await prisma.instantBookPackage.findFirst({
    where: { id, vendor_id: userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.instantBookPackage.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
