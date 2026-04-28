import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  documents: z.array(z.object({
    doc_type: z.string(),
    url: z.string().url(),
    expires_at: z.string().optional(),
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

  await prisma.vendorDocument.createMany({
    data: parsed.data.documents.map(d => ({
      ...d,
      vendor_id: (session.user!.id as string),
      expires_at: d.expires_at ? new Date(d.expires_at) : undefined,
    })),
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
