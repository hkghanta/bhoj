import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAdmin(req: NextRequest): boolean {
  return req.cookies.get('admin_token')?.value === process.env.ADMIN_SECRET
}

/**
 * GET /api/admin/concierge
 * List all concierge requests.
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requests = await prisma.conciergeRequest.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
    },
  })

  return NextResponse.json(requests)
}

/**
 * PATCH /api/admin/concierge
 * Update a request's status or add admin notes.
 * Body: { id, status?, admin_notes? }
 */
export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status, admin_notes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updated = await prisma.conciergeRequest.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(admin_notes !== undefined && { admin_notes }),
    },
  })

  return NextResponse.json(updated)
}
