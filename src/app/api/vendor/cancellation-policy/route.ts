import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const tiersSchema = z.object({
  preset_id: z.string().optional(),
  tiers: z.array(
    z.object({
      hours_before_event: z.number().int().min(0),
      refund_percent: z.number().int().min(0).max(100),
      description: z.string().optional(),
    })
  ).optional(),
})

/**
 * GET /api/vendor/cancellation-policy
 * Get own cancellation policies (auth: vendor).
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [tiers, vendor, presets] = await Promise.all([
    prisma.cancellationPolicy.findMany({
      where: { vendor_id: userId },
      orderBy: { hours_before_event: 'desc' },
    }),
    prisma.vendor.findUnique({
      where: { id: userId },
      select: { cancellation_preset_id: true },
    }),
    prisma.cancellationPreset.findMany({ orderBy: { name: 'asc' } }),
  ])

  return NextResponse.json({
    tiers,
    preset_id: vendor?.cancellation_preset_id ?? null,
    presets,
  })
}

/**
 * PUT /api/vendor/cancellation-policy
 * Set/replace all cancellation tiers (auth: vendor).
 * Deletes all existing tiers and creates the new ones in a transaction.
 */
export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = tiersSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { tiers, preset_id } = parsed.data

  // Update vendor's preset selection
  await prisma.vendor.update({
    where: { id: userId },
    data: { cancellation_preset_id: preset_id ?? null },
  })

  // If using a preset (no custom tiers), clear custom tiers
  if (preset_id && (!tiers || tiers.length === 0)) {
    await prisma.cancellationPolicy.deleteMany({ where: { vendor_id: userId } })
    const preset = await prisma.cancellationPreset.findUnique({ where: { id: preset_id } })
    return NextResponse.json({ tiers: [], preset_id, preset })
  }

  // Custom tiers provided
  const customTiers = tiers ?? []

  // Check for duplicate hours_before_event values
  const hoursSet = new Set(customTiers.map((t) => t.hours_before_event))
  if (hoursSet.size !== customTiers.length) {
    return NextResponse.json({ error: 'Duplicate hours_before_event values' }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.cancellationPolicy.deleteMany({ where: { vendor_id: userId } })

    if (customTiers.length === 0) return []

    await tx.cancellationPolicy.createMany({
      data: customTiers.map((t) => ({
        vendor_id: userId,
        hours_before_event: t.hours_before_event,
        refund_percent: t.refund_percent,
        description: t.description ?? null,
      })),
    })

    return tx.cancellationPolicy.findMany({
      where: { vendor_id: userId },
      orderBy: { hours_before_event: 'desc' },
    })
  })

  return NextResponse.json({ tiers: result, preset_id: preset_id ?? null })
}
