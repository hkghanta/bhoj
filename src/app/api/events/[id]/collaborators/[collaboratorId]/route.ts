import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string; collaboratorId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, collaboratorId } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { collaborator_role, permissions } = body

  const data: Record<string, unknown> = {}
  if (collaborator_role !== undefined) data.role = collaborator_role
  if (permissions !== undefined) data.permissions = permissions

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const collaborator = await prisma.eventCollaborator.findFirst({
    where: { id: collaboratorId, event_id: id },
  })
  if (!collaborator) {
    return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
  }

  const updated = await prisma.eventCollaborator.update({
    where: { id: collaboratorId },
    data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, collaboratorId } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const collaborator = await prisma.eventCollaborator.findFirst({
    where: { id: collaboratorId, event_id: id },
  })
  if (!collaborator) {
    return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 })
  }

  await prisma.eventCollaborator.delete({
    where: { id: collaboratorId },
  })

  return NextResponse.json({ success: true })
}
