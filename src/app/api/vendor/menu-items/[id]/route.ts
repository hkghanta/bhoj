import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { MenuCategory, SpiceLevel } from '@prisma/client'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(MenuCategory).optional(),
  is_vegetarian: z.boolean().optional(),
  is_vegan: z.boolean().optional(),
  is_jain: z.boolean().optional(),
  is_halal: z.boolean().optional(),
  contains_nuts: z.boolean().optional(),
  contains_gluten: z.boolean().optional(),
  contains_dairy: z.boolean().optional(),
  spice_level: z.nativeEnum(SpiceLevel).optional(),
  is_active: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const existing = await prisma.menuItem.findFirst({
    where: { id, vendor_id: (session.user!.id as string) },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = await prisma.menuItem.update({ where: { id }, data: parsed.data })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.menuItem.findFirst({
    where: { id, vendor_id: (session.user!.id as string) },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.menuItem.update({ where: { id }, data: { is_active: false } })
  return NextResponse.json({ ok: true })
}
