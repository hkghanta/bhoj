import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  const { id } = await params

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      ...(role === 'vendor'
        ? { vendor_id: userId }
        : { match: { event_request: { customer_id: userId } } }),
    },
  })

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const negotiations = await prisma.quoteNegotiation.findMany({
    where: { quote_id: id },
    orderBy: { created_at: 'asc' },
  })

  return NextResponse.json(negotiations)
}
