import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configs = await prisma.serviceConfig.findMany({
    orderBy: { sort_order: 'asc' },
  })
  return NextResponse.json(configs)
}
