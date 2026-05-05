import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VendorType, VendorLeadStatus } from '@prisma/client'
import { isAdminRequest } from '@/lib/admin-auth'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const city = searchParams.get('city')
  const vendorType = searchParams.get('vendorType')
  const q = searchParams.get('q')

  const leads = await prisma.vendorLead.findMany({
    where: {
      ...(status && status !== 'ALL' ? { status: status as VendorLeadStatus } : {}),
      ...(city && city !== 'ALL' ? { city } : {}),
      ...(vendorType && vendorType !== 'ALL' ? { vendor_type: vendorType as VendorType } : {}),
      ...(q ? {
        OR: [
          { business_name: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: { joined_vendor: { select: { id: true, business_name: true } } },
    orderBy: [{ status: 'asc' }, { rating: 'desc' }, { created_at: 'desc' }],
  })

  return NextResponse.json(leads)
}

const createSchema = z.object({
  business_name: z.string().min(1),
  vendor_type: z.nativeEnum(VendorType).optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  maps_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

  const d = parsed.data

  // Dedup: same business name (case-insensitive) in same city, OR same address
  const existing = await prisma.vendorLead.findFirst({
    where: {
      OR: [
        {
          business_name: { equals: d.business_name, mode: 'insensitive' },
          city: { equals: d.city, mode: 'insensitive' },
        },
        ...(d.address ? [{ address: { equals: d.address, mode: 'insensitive' as const } }] : []),
      ],
    },
    select: { id: true, business_name: true, city: true },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'duplicate', message: `Already exists: "${existing.business_name}" in ${existing.city}`, id: existing.id },
      { status: 409 }
    )
  }

  const lead = await prisma.vendorLead.create({
    data: {
      business_name: d.business_name,
      vendor_type: d.vendor_type ?? null,
      city: d.city,
      state: d.state ?? null,
      address: d.address ?? null,
      phone: d.phone ?? null,
      email: d.email || null,
      website: d.website || null,
      maps_url: d.maps_url || null,
      notes: d.notes ?? null,
      status: 'NEW',
    },
    include: { joined_vendor: { select: { id: true, business_name: true } } },
  })

  return NextResponse.json(lead, { status: 201 })
}
