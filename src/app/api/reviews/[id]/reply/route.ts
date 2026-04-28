import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const replySchema = z.object({
  vendor_reply: z.string().min(1).max(1000),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const review = await prisma.review.findFirst({
    where: { id, vendor_id: (session.user!.id as string) },
  })
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  if (review.vendor_reply) {
    return NextResponse.json({ error: 'A reply has already been submitted' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = replySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const updated = await prisma.review.update({
    where: { id },
    data: { vendor_reply: parsed.data.vendor_reply },
  })

  return NextResponse.json(updated)
}
