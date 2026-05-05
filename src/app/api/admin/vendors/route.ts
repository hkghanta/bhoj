import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // 'pending' | 'approved' | 'all' | 'active'
  const q = searchParams.get('q')

  const vendors = await prisma.vendor.findMany({
    where: {
      ...(status === 'pending' ? { is_active: false } : status === 'approved' || status === 'active' ? { is_active: true } : {}),
      ...(q ? { business_name: { contains: q, mode: 'insensitive' } } : {}),
    },
    select: { id: true, business_name: true, email: true, vendor_type: true, city: true, is_active: true, created_at: true, subscriptions: { orderBy: { created_at: 'desc' }, take: 1 } },
    orderBy: { created_at: 'desc' },
    take: 50,
  })

  return NextResponse.json(vendors)
}
