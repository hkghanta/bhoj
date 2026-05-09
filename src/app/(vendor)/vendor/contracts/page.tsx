'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ScrollText, Clock, CheckCircle2, XCircle, FileText, PenLine } from 'lucide-react'
import { ContractTemplatesManager } from '@/components/vendor/ContractTemplatesManager'

type ContractSummary = {
  id: string
  contract_number: string
  status: string
  created_at: string
  expires_at: string | null
  customer: { id: string; name: string } | null
  event: { id: string; event_name: string; event_date: string } | null
  quote: { id: string; total_estimate: number; status: string } | null
  signatures: { signer_role: string; signed_at: string }[]
}

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:     { bg: 'bg-gray-50',   text: 'text-gray-600',  label: 'Draft' },
  SENT:      { bg: 'bg-blue-50/60',  text: 'text-blue-600', label: 'Sent' },
  SIGNED:    { bg: 'bg-green-50/60', text: 'text-green-600', label: 'Signed' },
  CANCELLED: { bg: 'bg-red-50/60',  text: 'text-red-500',  label: 'Cancelled' },
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'contracts' | 'templates'>('contracts')

  useEffect(() => {
    fetch('/api/contracts')
      .then(r => r.json())
      .then(data => setContracts(data.contracts ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-1">Contracts</h1>
        <p className="text-text-4 mt-1">Manage contracts with your customers.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-brand-border">
        <button
          onClick={() => setTab('contracts')}
          className={`px-4 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px ${
            tab === 'contracts' ? 'border-brand text-brand' : 'border-transparent text-text-4 hover:text-text-2'
          }`}
        >
          Active Contracts {contracts.length > 0 && `(${contracts.length})`}
        </button>
        <button
          onClick={() => setTab('templates')}
          className={`px-4 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px ${
            tab === 'templates' ? 'border-brand text-brand' : 'border-transparent text-text-4 hover:text-text-2'
          }`}
        >
          Templates
        </button>
      </div>

      {tab === 'contracts' && (
        <>
          {loading ? (
            <div className="text-text-4 text-sm py-8 text-center">Loading contracts...</div>
          ) : contracts.length === 0 ? (
            <div className="border border-dashed border-brand-border rounded-xl py-16 text-center">
              <ScrollText className="h-10 w-10 text-text-4 mx-auto mb-3" />
              <p className="text-text-4 mb-1">No contracts yet.</p>
              <p className="text-xs text-text-4">
                When a customer accepts a quote, you can create a contract from the quote page.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map(c => {
                const style = STATUS_STYLE[c.status] ?? STATUS_STYLE.DRAFT
                const customerSigned = c.signatures.some(s => s.signer_role === 'CUSTOMER')
                const vendorSigned = c.signatures.some(s => s.signer_role === 'VENDOR')

                return (
                  <Link
                    key={c.id}
                    href={`/vendor/contracts/${c.id}`}
                    className="block bg-white dark:bg-cream-2 rounded-xl border border-brand-border p-5 hover:bg-cream/50 hover:border-brand transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-text-4 shrink-0" />
                          <span className="font-bold text-text-1 text-sm truncate">
                            {c.customer?.name ?? 'Customer'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </div>
                        {c.event && (
                          <p className="text-xs text-text-3 mb-1">
                            {c.event.event_name} &middot; {format(new Date(c.event.event_date), 'd MMM yyyy')}
                          </p>
                        )}
                        <p className="text-xs text-text-4">
                          #{c.contract_number.slice(0, 8)} &middot; Created {format(new Date(c.created_at), 'd MMM yyyy')}
                          {c.expires_at && (
                            <> &middot; Expires {format(new Date(c.expires_at), 'd MMM yyyy')}</>
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-4">
                          <span className="flex items-center gap-1">
                            {vendorSigned ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
                            Your signature
                          </span>
                          <span className="flex items-center gap-1">
                            {customerSigned ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3" />}
                            Customer signature
                          </span>
                        </div>
                      </div>

                      {c.status === 'DRAFT' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-brand bg-cream border border-brand-border px-2.5 py-1 rounded-full shrink-0">
                          <PenLine className="h-3 w-3" /> Edit & Send
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'templates' && <ContractTemplatesManager />}
    </div>
  )
}
