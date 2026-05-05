import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/dishes/[id] — update a GlobalDish
// PUT with action=approve|reject — for pending MenuItem suggestions
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, ...updates } = body

  if (action === 'approve') {
    const item = await prisma.menuItem.update({
      where: { id },
      data: { ...updates, is_global: true, pending_review: false },
    })
    return NextResponse.json(item)
  }

  if (action === 'reject') {
    const item = await prisma.menuItem.update({
      where: { id },
      data: { pending_review: false, is_global: false },
    })
    return NextResponse.json(item)
  }

  // Default: update GlobalDish
  const item = await prisma.globalDish.update({ where: { id }, data: updates })
  return NextResponse.json(item)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const item = await prisma.globalDish.update({ where: { id }, data: body })
  return NextResponse.json(item)
}

// DELETE /api/admin/dishes/[id] — soft-delete (set active=false)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req as any)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  // Try GlobalDish first, fall back to MenuItem delete
  try {
    await prisma.globalDish.update({ where: { id }, data: { active: false } })
  } catch {
    await prisma.menuItem.delete({ where: { id } })
  }
  return new NextResponse(null, { status: 204 })
}
