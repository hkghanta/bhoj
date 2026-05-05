import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
  event_types: z.array(z.string()).min(1).optional(),
  guest_count_min: z.number().int().positive().nullish(),
  guest_count_max: z.number().int().positive().nullish(),
  cuisine_match: z.array(z.string()).optional(),
  menu_package_id: z.string().nullish(),
  markup_percent: z.number().min(0).max(100).optional(),
  include_delivery: z.boolean().optional(),
  auto_message: z.string().nullish(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.autoQuoteRule.findFirst({
    where: { id, vendor_id: userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data

  // Validate guest count range using merged values
  const minVal = data.guest_count_min !== undefined ? data.guest_count_min : existing.guest_count_min
  const maxVal = data.guest_count_max !== undefined ? data.guest_count_max : existing.guest_count_max
  if (minVal != null && maxVal != null && minVal > maxVal) {
    return NextResponse.json(
      { error: 'guest_count_min cannot exceed guest_count_max' },
      { status: 400 },
    )
  }

  // Validate menu_package_id belongs to this vendor
  if (data.menu_package_id) {
    const pkg = await prisma.menuPackage.findFirst({
      where: { id: data.menu_package_id, vendor_id: userId, is_active: true },
    })
    if (!pkg) {
      return NextResponse.json(
        { error: 'Menu package not found or does not belong to you' },
        { status: 400 },
      )
    }
  }

  const rule = await prisma.autoQuoteRule.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
      ...(data.event_types !== undefined && { event_types: data.event_types }),
      ...(data.guest_count_min !== undefined && { guest_count_min: data.guest_count_min }),
      ...(data.guest_count_max !== undefined && { guest_count_max: data.guest_count_max }),
      ...(data.cuisine_match !== undefined && { cuisine_match: data.cuisine_match }),
      ...(data.menu_package_id !== undefined && { menu_package_id: data.menu_package_id }),
      ...(data.markup_percent !== undefined && { markup_percent: data.markup_percent }),
      ...(data.include_delivery !== undefined && { include_delivery: data.include_delivery }),
      ...(data.auto_message !== undefined && { auto_message: data.auto_message }),
    },
    include: {
      menu_package: {
        select: { id: true, name: true, price_per_head: true },
      },
    },
  })

  return NextResponse.json(rule)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.autoQuoteRule.findFirst({
    where: { id, vendor_id: userId },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.autoQuoteRule.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
