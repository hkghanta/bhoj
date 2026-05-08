'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Loader2, CheckCircle2, XCircle, PenLine,
  Shield, Clock, AlertTriangle, Plus, Check, X, Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type Signature = {
  id: string
  signer_id: string
  signer_role: 'CUSTOMER' | 'VENDOR'
  signer_name: string
  signature_type: 'TYPED' | 'DRAWN'
  signed_at: string
}

type Amendment = {
  id: string
  proposed_by: string
  proposed_by_role: 'CUSTOMER' | 'VENDOR'
  description: string
  new_total: number | null
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED'
  created_at: string
  responded_at: string | null
}

type Contract = {
  id: string
  contract_number: string
  vendor_address: string | null
  customer_address: string | null
  content: string
  terms_and_conditions: string | null
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'CANCELLED'
  expires_at: string | null
  created_at: string
  vendor: { id: string; business_name: string }
  customer: { id: string; name: string }
  quote: { id: string; total_estimate: number; status: string } | null
  event: { id: string; event_name: string; event_date: string } | null
  template: { id: string; name: string } | null
  signatures: Signature[]
  amendments: Amendment[]
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-cream text-text-3' },
  SENT: { label: 'Sent', cls: 'bg-blue-50 text-blue-700' },
  SIGNED: { label: 'Signed', cls: 'bg-green-50 text-green-700' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50 text-red-500' },
}

const AMENDMENT_STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PROPOSED: { label: 'Proposed', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ACCEPTED: { label: 'Accepted', cls: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-500 border-red-200' },
}

type Props = { contractId: string; role?: 'customer' | 'vendor' }

export default function ContractViewer({ contractId, role = 'customer' }: Props) {
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sign form
  const [showSignForm, setShowSignForm] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signatureType, setSignatureType] = useState<'TYPED' | 'DRAWN'>('TYPED')
  const [signatureData, setSignatureData] = useState('')
  const [signing, setSigning] = useState(false)

  // Amendment form
  const [showAmendForm, setShowAmendForm] = useState(false)
  const [amendDescription, setAmendDescription] = useState('')
  const [amendNewTotal, setAmendNewTotal] = useState('')
  const [submittingAmend, setSubmittingAmend] = useState(false)

  const [actingOnAmendment, setActingOnAmendment] = useState<string | null>(null)

  // Edit mode (vendor only)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTerms, setEditTerms] = useState('')
  const [editVendorAddress, setEditVendorAddress] = useState('')
  const [editCustomerAddress, setEditCustomerAddress] = useState('')
  const [savingContent, setSavingContent] = useState(false)
  const [sendingContract, setSendingContract] = useState(false)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)

  const fetchContract = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${contractId}`)
      if (!res.ok) throw new Error('Failed to load contract')
      const data = await res.json()
      setContract(data.contract)
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [contractId])

  useEffect(() => { fetchContract() }, [fetchContract])

  async function handleSign(e: React.FormEvent) {
    e.preventDefault()
    if (!signerName.trim() || !signatureData.trim()) return
    setSigning(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_name: signerName.trim(),
          signature_data: signatureData.trim(),
          signature_type: signatureType,
        }),
      })
      if (res.ok) {
        setShowSignForm(false)
        setSignerName('')
        setSignatureData('')
        await fetchContract()
      }
    } catch { /* ignore */ }
    setSigning(false)
  }

  async function handleProposeAmendment(e: React.FormEvent) {
    e.preventDefault()
    if (!amendDescription.trim()) return
    setSubmittingAmend(true)
    try {
      const body: Record<string, unknown> = { description: amendDescription.trim() }
      const totalNum = parseFloat(amendNewTotal)
      if (!isNaN(totalNum) && totalNum > 0) body.new_total = totalNum

      const res = await fetch(`/api/contracts/${contractId}/amendments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowAmendForm(false)
        setAmendDescription('')
        setAmendNewTotal('')
        await fetchContract()
      }
    } catch { /* ignore */ }
    setSubmittingAmend(false)
  }

  async function handleAmendmentAction(amendmentId: string, status: 'ACCEPTED' | 'REJECTED') {
    setActingOnAmendment(amendmentId)
    try {
      const res = await fetch(`/api/contracts/${contractId}/amendments/${amendmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) await fetchContract()
    } catch { /* ignore */ }
    setActingOnAmendment(null)
  }

  async function handleSaveContent() {
    setSavingContent(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          terms_and_conditions: editTerms || null,
          vendor_address: editVendorAddress || null,
          customer_address: editCustomerAddress || null,
        }),
      })
      if (res.ok) {
        setEditMode(false)
        await fetchContract()
      }
    } catch { /* ignore */ }
    setSavingContent(false)
  }

  async function handleSendContract() {
    if (!contract?.vendor_address || !contract?.customer_address) {
      alert('Both vendor and customer addresses are required before sending. Please edit the contract to add addresses.')
      return
    }
    if (!confirm('Send this contract to the customer? They will be notified.')) return
    setSendingContract(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' }),
      })
      if (res.ok) await fetchContract()
    } catch { /* ignore */ }
    setSendingContract(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-4 py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading contract...
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-100 p-5 text-sm text-red-600">
        <AlertTriangle className="h-4 w-4 inline mr-1" />
        {error ?? 'Contract not found.'}
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.DRAFT
  const customerSigned = contract.signatures.some(s => s.signer_role === 'CUSTOMER')
  const vendorSigned = contract.signatures.some(s => s.signer_role === 'VENDOR')
  const myRole = role.toUpperCase() as 'CUSTOMER' | 'VENDOR'
  const mySigned = myRole === 'CUSTOMER' ? customerSigned : vendorSigned
  const canSign = (contract.status === 'SENT' || contract.status === 'SIGNED') && !mySigned
  const canEdit = role === 'vendor' && contract.status === 'DRAFT'
  const canSend = role === 'vendor' && contract.status === 'DRAFT'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="h-5 w-5 text-text-4" />
              <h2 className="font-semibold text-text-1">Contract</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-text-4 mt-1">#{contract.contract_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/contracts/${contractId}`, '_blank')}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </Button>
          </div>
          {contract.expires_at && (
            <div className="text-right">
              <p className="text-xs text-text-4">Expires</p>
              <p className="text-sm text-text-3">
                {new Date(contract.expires_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-cream rounded-lg p-3">
            <p className="text-xs text-text-4 mb-1">Vendor</p>
            <p className="text-sm font-medium text-text-1">{contract.vendor.business_name}</p>
            {contract.vendor_address ? (
              <p className="text-xs text-text-3 mt-1 whitespace-pre-line">{contract.vendor_address}</p>
            ) : (
              <p className="text-xs text-amber-500 mt-1 italic">Address required</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              {vendorSigned ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Signed
                </span>
              ) : (
                <span className="text-xs text-text-4">Not signed</span>
              )}
            </div>
          </div>
          <div className="bg-cream rounded-lg p-3">
            <p className="text-xs text-text-4 mb-1">Customer</p>
            <p className="text-sm font-medium text-text-1">{contract.customer.name}</p>
            {contract.customer_address ? (
              <p className="text-xs text-text-3 mt-1 whitespace-pre-line">{contract.customer_address}</p>
            ) : (
              <p className="text-xs text-amber-500 mt-1 italic">Address required</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              {customerSigned ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> Signed
                </span>
              ) : (
                <span className="text-xs text-text-4">Not signed</span>
              )}
            </div>
          </div>
        </div>

        {/* Event + quote info */}
        {(contract.event || contract.quote) && (
          <div className="flex items-center gap-4 mt-3 text-xs text-text-4 flex-wrap">
            {contract.event && (
              <span>{contract.event.event_name} - {new Date(contract.event.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
            {contract.quote && (
              <span>Quote total: {fmt(Number(contract.quote.total_estimate))}</span>
            )}
          </div>
        )}
      </div>

      {/* Vendor: Edit & Send actions */}
      {canSend && !editMode && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 flex items-center gap-3">
          <FileText className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">This contract is in draft.</p>
            <p className="text-sm text-amber-600 mt-0.5">Edit the content, then send it to the customer for signing.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setEditMode(true); setEditContent(contract.content); setEditTerms(contract.terms_and_conditions ?? ''); setEditVendorAddress(contract.vendor_address ?? ''); setEditCustomerAddress(contract.customer_address ?? '') }} className="gap-1.5">
              <PenLine className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button size="sm" onClick={handleSendContract} disabled={sendingContract || !contract.content} className="bg-brand hover:bg-brand/90 gap-1.5">
              {sendingContract ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {sendingContract ? 'Sending...' : 'Send to Customer'}
            </Button>
          </div>
        </div>
      )}

      {/* Contract content */}
      {editMode ? (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold text-text-1">Party Addresses</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-2 block mb-1">Vendor Address <span className="text-red-500">*</span></label>
              <textarea
                value={editVendorAddress}
                onChange={e => setEditVendorAddress(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-y"
                placeholder="123 Business St, Suite 100&#10;City, State ZIP"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-2 block mb-1">Customer Address <span className="text-red-500">*</span></label>
              <textarea
                value={editCustomerAddress}
                onChange={e => setEditCustomerAddress(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-y"
                placeholder="456 Home Ave&#10;City, State ZIP"
              />
            </div>
          </div>
          <h3 className="font-semibold text-text-1">Contract Content</h3>
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-y"
            placeholder="Enter the contract details, scope of work, deliverables..."
          />
          <h3 className="font-semibold text-text-1">Terms & Conditions</h3>
          <textarea
            value={editTerms}
            onChange={e => setEditTerms(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-y"
            placeholder="Payment terms, cancellation policy, liability..."
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveContent} disabled={savingContent} className="bg-brand hover:bg-brand/90 gap-1.5">
              {savingContent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {savingContent ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-1">Contract Details</h3>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => { setEditMode(true); setEditContent(contract.content); setEditTerms(contract.terms_and_conditions ?? ''); setEditVendorAddress(contract.vendor_address ?? ''); setEditCustomerAddress(contract.customer_address ?? '') }} className="gap-1.5">
                <PenLine className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
          {contract.content ? (
            <div className="prose prose-sm max-w-none text-text-2 whitespace-pre-wrap">
              {contract.content}
            </div>
          ) : (
            <p className="text-sm text-text-4 italic">No contract content yet. Click Edit to add details.</p>
          )}
        </div>
      )}

      {/* Terms and conditions */}
      {!editMode && contract.terms_and_conditions && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-text-1 mb-3">Terms & Conditions</h3>
          <div className="prose prose-sm max-w-none text-text-3 whitespace-pre-wrap">
            {contract.terms_and_conditions}
          </div>
        </div>
      )}

      {/* Signatures */}
      {contract.signatures.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-text-1 mb-3">Signatures</h3>
          <div className="space-y-3">
            {contract.signatures.map(sig => (
              <div key={sig.id} className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-1">{sig.signer_name}</p>
                  <p className="text-xs text-text-4">
                    {sig.signer_role === 'CUSTOMER' ? 'Customer' : 'Vendor'} - Signed{' '}
                    {new Date(sig.signed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                {sig.signature_type === 'TYPED' && (
                  <span className="font-script text-lg text-text-2 italic">{sig.signer_name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign button / form */}
      {canSign && !showSignForm && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 flex items-center gap-3">
          <PenLine className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-blue-800">This contract is awaiting your signature.</p>
            <p className="text-sm text-blue-600 mt-0.5">Review the details above before signing.</p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowSignForm(true)}
            className="bg-blue-600 hover:bg-blue-700 gap-1.5"
          >
            <PenLine className="h-3.5 w-3.5" /> Sign Contract
          </Button>
        </div>
      )}

      {showSignForm && (
        <form onSubmit={handleSign} className="bg-white rounded-xl border p-5 space-y-4">
          <h3 className="font-semibold text-text-1 flex items-center gap-2">
            <PenLine className="h-4 w-4" /> Sign Contract
          </h3>

          <div>
            <label className="text-sm font-medium text-text-2 block mb-1">Your Full Name</label>
            <input
              type="text"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Enter your full legal name"
              required
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text-2 block mb-2">Signature Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setSignatureType('TYPED'); setSignatureData('') }}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  signatureType === 'TYPED'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-brand-border text-text-3 hover:bg-cream'
                }`}
              >
                Typed Signature
              </button>
              <button
                type="button"
                onClick={() => { setSignatureType('DRAWN'); setSignatureData('') }}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  signatureType === 'DRAWN'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-brand-border text-text-3 hover:bg-cream'
                }`}
              >
                Drawn Signature
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-2 block mb-1">
              {signatureType === 'TYPED' ? 'Type your signature' : 'Type your signature (drawing not yet supported)'}
            </label>
            <input
              type="text"
              value={signatureData}
              onChange={e => setSignatureData(e.target.value)}
              placeholder={signatureType === 'TYPED' ? 'Type your name as signature' : 'Type your name as signature'}
              required
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-serif italic text-lg"
            />
            {signatureData && (
              <div className="mt-2 bg-cream rounded-lg p-3 border border-dashed text-center">
                <p className="text-xs text-text-4 mb-1">Preview</p>
                <p className="text-xl italic font-serif text-text-1">{signatureData}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={signing} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
              {signing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
              {signing ? 'Signing...' : 'Confirm & Sign'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowSignForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Amendments */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-1">Amendments</h3>
          {!showAmendForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAmendForm(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Propose Amendment
            </Button>
          )}
        </div>

        {/* Propose amendment form */}
        {showAmendForm && (
          <form onSubmit={handleProposeAmendment} className="bg-cream rounded-lg border p-4 space-y-3 mb-4">
            <div>
              <label className="text-sm font-medium text-text-2 block mb-1">Description</label>
              <textarea
                value={amendDescription}
                onChange={e => setAmendDescription(e.target.value)}
                rows={3}
                required
                placeholder="Describe the proposed change..."
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-2 block mb-1">
                New Total <span className="text-text-4 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amendNewTotal}
                onChange={e => setAmendNewTotal(e.target.value)}
                placeholder="Leave empty if no price change"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submittingAmend} size="sm" className="bg-brand hover:bg-brand-hover gap-1.5">
                {submittingAmend ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {submittingAmend ? 'Submitting...' : 'Propose Amendment'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAmendForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Amendments list */}
        {contract.amendments.length === 0 ? (
          <p className="text-sm text-text-4">No amendments yet.</p>
        ) : (
          <div className="space-y-3">
            {contract.amendments.map(a => {
              const badge = AMENDMENT_STATUS_CONFIG[a.status] ?? AMENDMENT_STATUS_CONFIG.PROPOSED
              const isFromOtherParty = a.proposed_by_role !== myRole
              const canRespond = a.status === 'PROPOSED' && isFromOtherParty

              return (
                <div key={a.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium text-text-4">
                      {isFromOtherParty
                        ? (a.proposed_by_role === 'VENDOR' ? contract.vendor.business_name : contract.customer.name)
                        : 'You'}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-text-4 ml-auto flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(a.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-text-2">{a.description}</p>
                  {a.new_total && (
                    <p className="text-sm font-semibold text-brand mt-1">
                      New total: {fmt(Number(a.new_total))}
                    </p>
                  )}
                  {canRespond && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        disabled={actingOnAmendment === a.id}
                        onClick={() => handleAmendmentAction(a.id, 'ACCEPTED')}
                        className="bg-green-600 hover:bg-green-700 gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {actingOnAmendment === a.id ? 'Processing...' : 'Accept'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actingOnAmendment === a.id}
                        onClick={() => handleAmendmentAction(a.id, 'REJECTED')}
                        className="gap-1 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
