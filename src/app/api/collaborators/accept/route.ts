import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token } = body

  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const collaborator = await prisma.eventCollaborator.findUnique({
    where: { invite_token: token },
  })

  if (!collaborator) {
    return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 404 })
  }

  if (collaborator.accepted_at) {
    return NextResponse.json({ error: 'Invite already accepted' }, { status: 409 })
  }

  // Link customer_id if the user is logged in and email matches
  const data: Record<string, unknown> = { accepted_at: new Date() }

  const session = await auth()
  if (session?.user) {
    const userId = session.user.id as string
    const userEmail = session.user.email as string
    if (userEmail === collaborator.email) {
      data.customer_id = userId
    }
  }

  const updated = await prisma.eventCollaborator.update({
    where: { invite_token: token },
    data,
  })

  return NextResponse.json(updated)
}
