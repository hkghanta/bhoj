import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import Link from 'next/link'
import { ChevronRight, FileText, Clock, CheckCircle2, AlertCircle, PenLine } from 'lucide-react'

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:             { bg: 'bg-cream-2',    text: 'text-text-2',     label: 'Draft' },
  SENT:              { bg: 'bg-blue-50',    text: 'text-blue-700',   label: 'Sent' },
  CUSTOMER_SIGNED:   { bg: 'bg-amber-50',   text: 'text-amber-700',  label: 'You signed' },
  VENDOR_SIGNED:     { bg: 'bg-amber-50',   text: 'text-amber-700',  label: 'Vendor signed' },
  FULLY_EXECUTED:    { bg: 'bg-green-50',   text: 'text-green-700',  label: 'Executed' },
  EXPIRED:           { bg: 'bg-red-50',     text: 'text-red-600',    label: 'Expired' },
  CANCELLED:         { bg: 'bg-red-50',     text: 'text-red-600',    label: 'Cancelled' },
}

export default async function ContractsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const customerId = session.user!.id as string

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
    select: { id: true, event_name: true },
  })

  if (!event) notFound()

  const contracts = await prisma.contract.findMany({
    where: { event_id: id, customer_id: customerId },
    include: {
      vendor: { select: { business_name: true } },
      signatures: { select: { signer_role: true, signed_at: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href="/dashboard" className="hover:text-brand transition-colors">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${id}`} className="hover:text-brand transition-colors">{event.event_name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-2 font-medium">Contracts</span>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight tracking-tight text-text-1">Contracts</h1>
        <p className="text-text-4 text-sm mt-1">Review and sign contracts from your vendors.</p>
      </div>

      {contracts.length === 0 ? (
        <div className="border-2 border-dashed border-brand-border rounded-2xl py-16 text-center">
          <FileText className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4 mb-1">No contracts yet.</p>
          <p className="text-xs text-text-4">When a vendor sends you a contract, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map(contract => {
            const style = STATUS_STYLE[contract.status] ?? STATUS_STYLE.DRAFT
            const customerSigned = contract.signatures.some(s => s.signer_role === 'CUSTOMER')
            const vendorSigned = contract.signatures.some(s => s.signer_role === 'VENDOR')

            return (
              <Link
                key={contract.id}
                href={`/events/${id}/contracts/${contract.id}`}
                className="block bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 hover:bg-cream hover:border-brand transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-text-4 shrink-0" />
                      <span className="font-bold text-text-1 text-sm truncate">
                        {contract.vendor?.business_name ?? 'Vendor'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-text-4">
                      #{contract.contract_number.slice(0, 8)} &middot; Created {format(contract.created_at, 'd MMM yyyy')}
                      {contract.expires_at && (
                        <> &middot; Expires {format(contract.expires_at, 'd MMM yyyy')}</>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-4">
                      <span className="flex items-center gap-1">
                        {customerSigned ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
                        Your signature
                      </span>
                      <span className="flex items-center gap-1">
                        {vendorSigned ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
                        Vendor signature
                      </span>
                    </div>
                  </div>

                  {contract.status === 'SENT' && !customerSigned && (
                    <span className="flex items-center gap-1 text-xs font-bold text-brand bg-cream border border-brand-border px-2.5 py-1 rounded-full shrink-0">
                      <PenLine className="h-3 w-3" /> Sign now
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
