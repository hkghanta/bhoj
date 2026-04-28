import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscriptions = await prisma.subscription.findMany({
    include: {
      vendor: { select: { id: true, business_name: true, email: true, vendor_type: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 200,
  })

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    by_tier: {
      FREE: subscriptions.filter(s => s.tier === 'FREE').length,
      PRO: subscriptions.filter(s => s.tier === 'PRO').length,
      PREMIUM: subscriptions.filter(s => s.tier === 'PREMIUM').length,
    },
  }

  return NextResponse.json({ subscriptions, stats })
}
