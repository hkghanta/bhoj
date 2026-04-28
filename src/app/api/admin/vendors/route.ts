import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // 'pending' | 'approved' | 'all'

  const vendors = await prisma.vendor.findMany({
    where: status === 'pending' ? { is_active: false } : status === 'approved' ? { is_active: true } : {},
    include: {
      subscriptions: { orderBy: { created_at: 'desc' }, take: 1 },
    },
    orderBy: { created_at: 'desc' },
    take: 100,
  })

  return NextResponse.json(vendors)
}
