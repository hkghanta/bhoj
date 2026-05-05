import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CollaboratorRole } from '@prisma/client'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const vendorEmail = session.user!.email as string

  // Find events where this vendor is a collaborator with COORDINATOR role
  const collaborations = await prisma.eventCollaborator.findMany({
    where: {
      email: vendorEmail,
      role: CollaboratorRole.COORDINATOR,
      accepted_at: { not: null },
    },
    include: {
      event: {
        include: {
          coordinator: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  })

  const events = collaborations.map((c) => ({
    collaborator_id: c.id,
    permissions: c.permissions,
    accepted_at: c.accepted_at,
    event: c.event,
  }))

  return NextResponse.json(events)
}
