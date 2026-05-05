import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const collaborators = await prisma.eventCollaborator.findMany({
    where: { event_id: id },
    orderBy: { created_at: 'desc' },
  })

  return NextResponse.json(collaborators)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id, customer_id: userId },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { email, name, collaborator_role, permissions } = body

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  // Check for duplicate email on this event
  const existing = await prisma.eventCollaborator.findUnique({
    where: { event_id_email: { event_id: id, email } },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'A collaborator with this email already exists for this event' },
      { status: 409 },
    )
  }

  const collaborator = await prisma.eventCollaborator.create({
    data: {
      event_id: id,
      email,
      name: name ?? null,
      role: collaborator_role ?? 'PLANNER',
      permissions: permissions ?? 'EDIT',
    },
  })

  return NextResponse.json(
    { ...collaborator, invite_token: collaborator.invite_token },
    { status: 201 },
  )
}
