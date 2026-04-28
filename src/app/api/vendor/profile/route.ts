import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { VendorType } from '@prisma/client'

const updateSchema = z.object({
  business_name: z.string().min(2).optional(),
  vendor_type: z.nativeEnum(VendorType).optional(),
  description: z.string().optional(),
  phone_business: z.string().optional(),
  phone_cell: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  instagram: z.string().optional(),
  license_number: z.string().optional(),
  insurance_number: z.string().optional(),
  health_inspection_date: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: (session.user!.id as string) },
    include: {
      services: true,
      documents: true,
      photos: true,
      availability: { orderBy: { date: 'asc' }, take: 90 },
      subscriptions: { orderBy: { created_at: 'desc' }, take: 1 },
    },
  })

  if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  return NextResponse.json(vendor)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 })
  }

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.health_inspection_date) {
    data.health_inspection_date = new Date(parsed.data.health_inspection_date)
  }

  const vendor = await prisma.vendor.update({
    where: { id: (session.user!.id as string) },
    data,
  })

  return NextResponse.json(vendor)
}
