import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price_per_head: z.number().positive().optional(),
  is_active: z.boolean().optional(),
  includes_service: z.boolean().optional(),
  includes_setup: z.boolean().optional(),
  item_ids: z.array(z.string()).optional(),
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

  const existing = await prisma.menuPackage.findFirst({
    where: { id, vendor_id: (session.user!.id as string) },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { item_ids, ...rest } = parsed.data

  if (item_ids !== undefined) {
    await prisma.menuPackageItem.deleteMany({ where: { package_id: id } })
    await prisma.menuPackageItem.createMany({
      data: item_ids.map((menu_item_id, i) => ({
        package_id: id,
        menu_item_id,
        sort_order: i,
      })),
    })
  }

  const pkg = await prisma.menuPackage.update({
    where: { id },
    data: rest,
    include: { items: { include: { menu_item: true } } },
  })

  return NextResponse.json(pkg)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.menuPackage.findFirst({
    where: { id, vendor_id: (session.user!.id as string) },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.menuPackage.update({ where: { id }, data: { is_active: false } })
  return NextResponse.json({ ok: true })
}
