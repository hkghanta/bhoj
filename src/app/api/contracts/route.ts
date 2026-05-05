import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  quote_id: z.string().min(1),
  event_id: z.string().optional(),
  template_id: z.string().optional(),
  content: z.string().optional(),
  terms_and_conditions: z.string().optional(),
})

function generateContractNumber(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CTR-${dateStr}-${rand}`
}

/**
 * GET /api/contracts
 * List contracts for the authenticated user (customer or vendor).
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'customer' && role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const where = role === 'vendor' ? { vendor_id: userId } : { customer_id: userId }

  const contracts = await prisma.contract.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      vendor: { select: { id: true, business_name: true } },
      customer: { select: { id: true, name: true } },
      quote: { select: { id: true, total_estimate: true, status: true } },
      event: { select: { id: true, event_name: true, event_date: true } },
      signatures: { select: { id: true, signer_role: true, signed_at: true } },
    },
  })

  return NextResponse.json({ contracts })
}

/**
 * POST /api/contracts
 * Create a contract from a quote (auth: vendor).
 */
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  const userId = session.user!.id as string

  if (role !== 'vendor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { quote_id, event_id, template_id, content, terms_and_conditions } = parsed.data

  // Validate quote belongs to this vendor
  const quote = await prisma.quote.findUnique({
    where: { id: quote_id },
    include: {
      match: {
        include: {
          event_request: { select: { customer_id: true, event_id: true } },
        },
      },
      contract: { select: { id: true } },
    },
  })

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }
  if (quote.vendor_id !== userId) {
    return NextResponse.json({ error: 'Forbidden: quote does not belong to you' }, { status: 403 })
  }
  if (quote.contract) {
    return NextResponse.json({ error: 'A contract already exists for this quote' }, { status: 409 })
  }

  const customerId = quote.match.event_request.customer_id
  const resolvedEventId = event_id ?? quote.match.event_request.event_id

  // Optionally prefill from template
  let templateContent = content ?? ''
  let templateTerms = terms_and_conditions ?? null

  if (template_id) {
    const template = await prisma.contractTemplate.findUnique({
      where: { id: template_id },
      select: { vendor_id: true, content: true, terms_and_conditions: true },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    if (template.vendor_id !== userId) {
      return NextResponse.json({ error: 'Forbidden: template does not belong to you' }, { status: 403 })
    }

    // Template content used as fallback if no explicit content provided
    if (!content) templateContent = template.content
    if (!terms_and_conditions && template.terms_and_conditions) {
      templateTerms = template.terms_and_conditions
    }
  }

  if (!templateContent) {
    return NextResponse.json({ error: 'Contract content is required (provide content or template_id)' }, { status: 400 })
  }

  const contract = await prisma.contract.create({
    data: {
      contract_number: generateContractNumber(),
      vendor_id: userId,
      customer_id: customerId,
      quote_id: quote_id,
      event_id: resolvedEventId,
      template_id: template_id ?? null,
      content: templateContent,
      terms_and_conditions: templateTerms,
      status: 'DRAFT',
    },
    include: {
      vendor: { select: { id: true, business_name: true } },
      customer: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ contract }, { status: 201 })
}
