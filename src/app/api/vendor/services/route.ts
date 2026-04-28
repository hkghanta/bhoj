import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  services: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'vendor') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  await prisma.vendorService.deleteMany({ where: { vendor_id: (session.user!.id as string) } })
  await prisma.vendorService.createMany({
    data: parsed.data.services.map(s => ({ ...s, vendor_id: (session.user!.id as string) })),
  })

  return NextResponse.json({ ok: true })
}
