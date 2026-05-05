import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VendorLeadStatus } from '@prisma/client'
import { isAdminRequest } from '@/lib/admin-auth'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.nativeEnum(VendorLeadStatus).optional(),
  notes: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  contacted_at: z.string().optional(),
  joined_vendor_id: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === 'CONTACTED' && !parsed.data.contacted_at) {
    data.contacted_at = new Date()
  }

  const lead = await prisma.vendorLead.update({
    where: { id },
    data,
    include: { joined_vendor: { select: { id: true, business_name: true } } },
  })
  return NextResponse.json(lead)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await prisma.vendorLead.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
