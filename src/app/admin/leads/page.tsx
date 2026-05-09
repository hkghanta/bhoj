'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search, RefreshCw, MapPin, Phone, Globe,
  ExternalLink, Star, ChevronDown, ChevronUp, Plus, X, Link2,
} from 'lucide-react'

type Lead = {
  id: string
  place_id: string | null
  business_name: string
  vendor_type: string | null
  city: string
  state: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  maps_url: string | null
  rating: number | null
  total_ratings: number
  status: string
  notes: string | null
  contacted_at: string | null
  invited_at: string | null
  joined_vendor: { id: string; business_name: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  NEW:                'bg-cream text-text-2',
  CONTACTED:          'bg-blue-100 text-blue-700',
  INTERESTED:         'bg-green-100 text-green-700',
  NOT_INTERESTED:     'bg-red-100 text-red-600',
  JOINED:             'bg-cream text-brand',
  PERMANENTLY_CLOSED: 'bg-zinc-200 text-zinc-500 line-through',
}

const VENDOR_TYPE_LABELS: Record<string, string> = {
  CATERER: 'Caterer', PHOTOGRAPHER: 'Photographer', DECORATOR: 'Decorator',
  DJ: 'DJ', MEHENDI_ARTIST: 'Mehendi', MAKEUP_HAIR: 'Makeup & Hair',
  FLORIST: 'Florist', VIDEOGRAPHER: 'Videographer', DHOL_PLAYER: 'Dhol Player',
  LIVE_BAND: 'Live Band',
}

const ALL_CITIES = [
  'New York','Edison','Jersey City','Chicago','Houston','Dallas','Plano','Sugar Land',
  'Fremont','San Jose','Sunnyvale','Irvine','Los Angeles','Atlanta','Fairfax',
  'Herndon','Cary','Raleigh','Charlotte','Philadelphia','Seattle','Boston',
]

const BLANK_FORM = {
  business_name: '', vendor_type: '', city: '', state: '',
  address: '', phone: '', email: '', website: '', notes: '',
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [auditing, setAuditing] = useState(false)
  const [auditResult, setAuditResult] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [cityFilter, setCityFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [q, setQ] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [editContact, setEditContact] = useState<Record<string, { phone: string; email: string; website: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savingContactId, setSavingContactId] = useState<string | null>(null)
  const [fetchCity, setFetchCity] = useState('')
  const [fetchType, setFetchType] = useState('')
  const [fetchResult, setFetchResult] = useState<string | null>(null)

  // Add lead modal
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(BLANK_FORM)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSaving, setAddSaving] = useState(false)

  // Link vendor modal
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendorResults, setVendorResults] = useState<{ id: string; business_name: string }[]>([])
  const [vendorSearching, setVendorSearching] = useState(false)

  // Invite
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [bulkInviting, setBulkInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<string | null>(null)

  useEffect(() => { loadLeads() }, [statusFilter, cityFilter, typeFilter, q])

  async function loadLeads() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (cityFilter !== 'ALL') params.set('city', cityFilter)
    if (typeFilter !== 'ALL') params.set('vendorType', typeFilter)
    if (q) params.set('q', q)
    const res = await fetch(`/api/admin/leads?${params}`)
    if (res.status === 401) { router.push('/admin/login'); return }
    if (!res.ok) { setLoading(false); return }
    setLeads(await res.json())
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const updated = await res.json()
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l))
    }
  }

  async function saveContact(id: string) {
    setSavingContactId(id)
    const c = editContact[id]
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: c.phone || null, email: c.email || null, website: c.website || null }),
    })
    if (res.ok) {
      const updated = await res.json()
      setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l))
    }
    setSavingContactId(null)
  }

  async function sendInvite(id: string) {
    setInvitingId(id)
    setInviteResult(null)
    const res = await fetch(`/api/admin/leads/${id}/invite`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, invited_at: new Date().toISOString(), status: 'CONTACTED' } : l))
      setInviteResult(`Invite sent!`)
    } else {
      setInviteResult(`Error: ${data.error}`)
    }
    setInvitingId(null)
  }

  async function sendBulkInvite() {
    if (!selectedIds.size) return
    setBulkInviting(true)
    setInviteResult(null)
    const res = await fetch('/api/admin/leads/bulk-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    })
    const data = await res.json()
    setInviteResult(`Sent ${data.sent} invites, ${data.skipped} skipped (no email).`)
    setSelectedIds(new Set())
    setBulkInviting(false)
    loadLeads()
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)))
    }
  }

  async function saveNotes(id: string) {
    setSavingId(id)
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: editNotes[id] ?? '' }),
    })
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notes: editNotes[id] ?? null } : l))
    setSavingId(null)
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return
    await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
    setLeads(prev => prev.filter(l => l.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  async function runAudit() {
    if (!confirm(`This will re-check all active leads against Google Places API to detect closures and update contact info. Continue?`)) return
    setAuditing(true)
    setAuditResult(null)
    const res = await fetch('/api/admin/leads/audit', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setAuditResult(`✓ Checked ${data.checked} leads — ${data.closed} marked closed, ${data.updated} updated${data.errors ? `, ${data.errors} errors` : ''}`)
      loadLeads()
    } else {
      setAuditResult(`Error: ${data.error}`)
    }
    setAuditing(false)
  }

  async function fetchFromPlaces() {
    setFetching(true)
    setFetchResult(null)
    const res = await fetch('/api/admin/leads/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: fetchCity || undefined,
        vendorType: fetchType || undefined,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setFetchResult(`✓ Added ${data.added} leads, skipped ${data.skipped} duplicates${data.errors?.length ? ` · ${data.errors.length} errors` : ''}`)
      loadLeads()
    } else {
      setFetchResult(`Error: ${data.error}`)
    }
    setFetching(false)
  }

  async function addManualLead() {
    setAddError(null)
    if (!addForm.business_name.trim() || !addForm.city.trim()) {
      setAddError('Business name and city are required.')
      return
    }
    setAddSaving(true)
    const res = await fetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...addForm,
        vendor_type: addForm.vendor_type || undefined,
        state: addForm.state || undefined,
        address: addForm.address || undefined,
        phone: addForm.phone || undefined,
        email: addForm.email || undefined,
        website: addForm.website || undefined,
        notes: addForm.notes || undefined,
      }),
    })
    const data = await res.json()
    if (res.status === 409) {
      setAddError(data.message)
      setAddSaving(false)
      return
    }
    if (!res.ok) {
      setAddError('Failed to add lead.')
      setAddSaving(false)
      return
    }
    setLeads(prev => [data, ...prev])
    setShowAdd(false)
    setAddForm(BLANK_FORM)
    setAddSaving(false)
  }

  async function searchVendors(term: string) {
    setVendorSearch(term)
    if (term.length < 2) { setVendorResults([]); return }
    setVendorSearching(true)
    const res = await fetch(`/api/admin/vendors?q=${encodeURIComponent(term)}&status=active`)
    if (res.ok) {
      const data = await res.json()
      setVendorResults(data.slice(0, 8))
    }
    setVendorSearching(false)
  }

  async function linkVendor(leadId: string, vendorId: string, vendorName: string) {
    const res = await fetch(`/api/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joined_vendor_id: vendorId, status: 'JOINED' }),
    })
    if (res.ok) {
      const updated = await res.json()
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updated } : l))
    }
    setLinkingId(null)
    setVendorSearch('')
    setVendorResults([])
  }

  async function unlinkVendor(leadId: string) {
    const res = await fetch(`/api/admin/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ joined_vendor_id: null }),
    })
    if (res.ok) {
      const updated = await res.json()
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updated } : l))
    }
  }

  const ALL_STATUSES = ['ALL','NEW','CONTACTED','INTERESTED','JOINED','NOT_INTERESTED','PERMANENTLY_CLOSED'] as const
  const counts = Object.fromEntries(
    ALL_STATUSES.map(s => [s, s === 'ALL' ? leads.length : leads.filter(l => l.status === s).length])
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-1">Vendor Leads</h1>
          <p className="text-sm text-text-4 mt-0.5">Prospect database — South Asian vendor outreach</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-brand hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-1.5" /> Add Lead
        </Button>
      </div>

      {/* Add lead modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-text-1">Add Lead Manually</h2>
              <button onClick={() => { setShowAdd(false); setAddError(null) }} className="text-text-4 hover:text-text-3">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {addError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{addError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-text-3">Business Name *</label>
                  <Input value={addForm.business_name} onChange={e => setAddForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Spice Garden Catering" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-3">City *</label>
                  <Input value={addForm.city} onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))} placeholder="Chicago" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-3">State</label>
                  <Input value={addForm.state} onChange={e => setAddForm(f => ({ ...f, state: e.target.value }))} placeholder="IL" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-text-3">Address</label>
                  <Input value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St, Chicago, IL 60601" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-3">Vendor Type</label>
                  <select
                    value={addForm.vendor_type}
                    onChange={e => setAddForm(f => ({ ...f, vendor_type: e.target.value }))}
                    className="w-full text-sm border border-brand-border rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">— Select type —</option>
                    {Object.entries(VENDOR_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-3">Phone</label>
                  <Input value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (312) 555-0100" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-3">Email</label>
                  <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="info@example.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-3">Website</label>
                  <Input value={addForm.website} onChange={e => setAddForm(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-text-3">Notes</label>
                  <textarea
                    rows={2}
                    value={addForm.notes}
                    onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Referred by…, found at…"
                    className="w-full text-sm border border-brand-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => { setShowAdd(false); setAddError(null) }}>Cancel</Button>
              <Button onClick={addManualLead} disabled={addSaving} className="bg-brand hover:bg-brand-hover">
                {addSaving ? 'Adding…' : 'Add Lead'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Link vendor modal */}
      {linkingId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-text-1">Link to Platform Vendor</h2>
              <button onClick={() => { setLinkingId(null); setVendorSearch(''); setVendorResults([]) }} className="text-text-4 hover:text-text-3">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-text-4 mb-3">Search for the vendor who signed up on the platform after being contacted.</p>
              <Input
                value={vendorSearch}
                onChange={e => searchVendors(e.target.value)}
                placeholder="Type vendor name…"
                autoFocus
              />
              {vendorSearching && <p className="text-xs text-text-4 mt-2">Searching…</p>}
              {vendorResults.length > 0 && (
                <div className="mt-2 border rounded-lg overflow-hidden divide-y">
                  {vendorResults.map(v => (
                    <button
                      key={v.id}
                      onClick={() => linkVendor(linkingId, v.id, v.business_name)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-cream hover:text-brand transition-colors"
                    >
                      {v.business_name}
                    </button>
                  ))}
                </div>
              )}
              {vendorSearch.length >= 2 && !vendorSearching && vendorResults.length === 0 && (
                <p className="text-xs text-text-4 mt-2">No vendors found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fetch panel */}
      <div className="bg-white border rounded-xl p-4 mb-5">
        <p className="text-sm font-semibold text-text-2 mb-3">Import from Google Places</p>
        <div className="flex gap-2 flex-wrap items-end">
          <div>
            <label className="text-xs text-text-4 block mb-1">City (blank = all cities)</label>
            <select
              value={fetchCity}
              onChange={e => setFetchCity(e.target.value)}
              className="text-sm border border-brand-border rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="">All target cities</option>
              {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-4 block mb-1">Vendor type (blank = all types)</label>
            <select
              value={fetchType}
              onChange={e => setFetchType(e.target.value)}
              className="text-sm border border-brand-border rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="">All types</option>
              {Object.entries(VENDOR_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <Button onClick={fetchFromPlaces} disabled={fetching} className="bg-brand hover:bg-brand-hover text-sm">
            {fetching ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Fetching…</> : 'Fetch Leads'}
          </Button>
          {fetchResult && <p className="text-sm text-text-3">{fetchResult}</p>}
        </div>
        <div className="mt-3 pt-3 border-t border-brand-border flex items-center gap-3">
          <div>
            <p className="text-xs font-semibold text-text-3">Periodic Audit</p>
            <p className="text-xs text-text-4">Re-check all active leads for closures &amp; updated contact info. Run every 3–6 months.</p>
          </div>
          <Button
            variant="outline"
            onClick={runAudit}
            disabled={auditing}
            className="text-sm shrink-0"
          >
            {auditing ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Auditing…</> : 'Run Audit'}
          </Button>
          {auditResult && <p className="text-sm text-text-3">{auditResult}</p>}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-brand text-white'
                : 'bg-white border border-brand-border text-text-3 hover:border-brand'
            }`}
          >
            {s === 'ALL' ? `All (${counts.ALL})` : `${s.replace(/_/g, ' ')} (${counts[s] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-4" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search name, city, phone…"
            className="pl-8 text-sm"
          />
        </div>
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          className="text-sm border border-brand-border rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="ALL">All cities</option>
          {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-sm border border-brand-border rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="ALL">All types</option>
          {Object.entries(VENDOR_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-text-4">
          <p>No leads found. Use "Fetch Leads" above or "Add Lead" to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Bulk invite bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-cream border-b border-brand">
              <span className="text-sm text-brand font-medium">{selectedIds.size} selected</span>
              <Button
                size="sm"
                onClick={sendBulkInvite}
                disabled={bulkInviting}
                className="bg-brand hover:bg-brand-hover text-xs h-7"
              >
                {bulkInviting ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Sending…</> : `Send Invite to ${selectedIds.size}`}
              </Button>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-brand hover:underline">Clear</button>
              {inviteResult && <span className="text-xs text-brand ml-2">{inviteResult}</span>}
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-cream text-xs text-text-4 uppercase tracking-wide">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" className="rounded"
                    checked={selectedIds.size === leads.length && leads.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium">Business</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">City</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium">Rating</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {leads.map(lead => (
                <React.Fragment key={lead.id}>
                  <tr
                    className={`hover:bg-cream cursor-pointer ${lead.status === 'PERMANENTLY_CLOSED' ? 'opacity-50' : ''}`}
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                  >
                    <td className="px-4 py-3 w-8" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-text-1 truncate max-w-48">{lead.business_name}</p>
                          {lead.joined_vendor && (
                            <span className="text-xs text-brand">✓ {lead.joined_vendor.business_name}</span>
                          )}
                          {lead.place_id === null && (
                            <span className="text-xs text-text-4">manual</span>
                          )}
                        </div>
                        {expandedId === lead.id
                          ? <ChevronUp className="h-3.5 w-3.5 text-text-4 flex-shrink-0" />
                          : <ChevronDown className="h-3.5 w-3.5 text-text-4 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-cream text-text-3 px-2 py-0.5 rounded-full">
                        {VENDOR_TYPE_LABELS[lead.vendor_type ?? ''] ?? lead.vendor_type ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-text-4" />
                        {lead.city}{lead.state ? `, ${lead.state}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs text-text-3 hover:text-brand">
                            <Phone className="h-3 w-3" />{lead.phone}
                          </a>
                        )}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-text-4 hover:text-blue-600">
                            <Globe className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {lead.maps_url && (
                          <a href={lead.maps_url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-text-4 hover:text-brand">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.rating ? (
                        <span className="flex items-center gap-1 text-xs text-text-3">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {lead.rating} <span className="text-text-4">({lead.total_ratings})</span>
                        </span>
                      ) : <span className="text-text-4">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] ?? 'bg-cream text-text-3'}`}>
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <select
                          value={lead.status}
                          onChange={e => updateStatus(lead.id, e.target.value)}
                          className="text-xs border border-brand-border rounded px-2 py-1 bg-white"
                        >
                          <option value="NEW">New</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="INTERESTED">Interested</option>
                          <option value="NOT_INTERESTED">Not Interested</option>
                          <option value="JOINED">Joined</option>
                          <option value="PERMANENTLY_CLOSED">Permanently Closed</option>
                        </select>
                        {lead.email && lead.status !== 'JOINED' && (
                          <button
                            onClick={() => sendInvite(lead.id)}
                            disabled={invitingId === lead.id}
                            title={lead.invited_at ? `Re-send invite (last sent ${new Date(lead.invited_at).toLocaleDateString()})` : 'Send onboarding invite'}
                            className={`text-xs px-2 py-1 rounded border transition-colors ${lead.invited_at ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-brand text-brand hover:bg-cream'}`}
                          >
                            {invitingId === lead.id ? '…' : lead.invited_at ? '✓ Resend' : 'Invite'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === lead.id && (
                    <tr key={`${lead.id}-expanded`} className="bg-cream/40">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <p className="text-xs font-semibold text-text-4 uppercase mb-2">Details</p>
                            {lead.address && (
                              <p className="text-xs text-text-3 mb-2 flex items-start gap-1">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />{lead.address}
                              </p>
                            )}
                            <div className="space-y-1.5">
                              <input
                                type="tel"
                                placeholder="Phone"
                                value={editContact[lead.id]?.phone ?? lead.phone ?? ''}
                                onChange={e => setEditContact(prev => ({ ...prev, [lead.id]: { phone: e.target.value, email: prev[lead.id]?.email ?? lead.email ?? '', website: prev[lead.id]?.website ?? lead.website ?? '' } }))}
                                className="w-full text-xs border border-brand-border rounded px-2 py-1 focus:outline-none focus:border-brand"
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                value={editContact[lead.id]?.email ?? lead.email ?? ''}
                                onChange={e => setEditContact(prev => ({ ...prev, [lead.id]: { phone: prev[lead.id]?.phone ?? lead.phone ?? '', email: e.target.value, website: prev[lead.id]?.website ?? lead.website ?? '' } }))}
                                className="w-full text-xs border border-brand-border rounded px-2 py-1 focus:outline-none focus:border-brand"
                              />
                              <input
                                type="url"
                                placeholder="Website"
                                value={editContact[lead.id]?.website ?? lead.website ?? ''}
                                onChange={e => setEditContact(prev => ({ ...prev, [lead.id]: { phone: prev[lead.id]?.phone ?? lead.phone ?? '', email: prev[lead.id]?.email ?? lead.email ?? '', website: e.target.value } }))}
                                className="w-full text-xs border border-brand-border rounded px-2 py-1 focus:outline-none focus:border-brand"
                              />
                              <button
                                onClick={() => saveContact(lead.id)}
                                disabled={savingContactId === lead.id}
                                className="text-xs text-brand hover:underline disabled:opacity-50"
                              >
                                {savingContactId === lead.id ? 'Saving…' : 'Save contact info'}
                              </button>
                            </div>
                            {lead.contacted_at && (
                              <p className="text-xs text-text-4 mt-2">
                                Contacted: {new Date(lead.contacted_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-4 uppercase mb-2">Notes</p>
                            <textarea
                              rows={3}
                              value={editNotes[lead.id] ?? lead.notes ?? ''}
                              onChange={e => setEditNotes(prev => ({ ...prev, [lead.id]: e.target.value }))}
                              placeholder="Add outreach notes, responses, follow-up details…"
                              className="w-full text-xs border border-brand-border rounded-lg p-2 resize-none focus:outline-none focus:border-brand"
                            />
                            <button
                              onClick={() => saveNotes(lead.id)}
                              disabled={savingId === lead.id}
                              className="mt-1.5 text-xs text-brand hover:underline disabled:opacity-50"
                            >
                              {savingId === lead.id ? 'Saving…' : 'Save notes'}
                            </button>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-4 uppercase mb-2">Platform Link</p>
                            {lead.joined_vendor ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                  <span className="font-medium">✓ Joined:</span>
                                  <a
                                    href={`/admin/vendors`}
                                    className="hover:underline"
                                  >
                                    {lead.joined_vendor.business_name}
                                  </a>
                                </div>
                                <button
                                  onClick={() => unlinkVendor(lead.id)}
                                  className="text-xs text-text-4 hover:text-red-500"
                                >
                                  Unlink
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <p className="text-xs text-text-4">Not linked to a platform vendor yet.</p>
                                <button
                                  onClick={() => setLinkingId(lead.id)}
                                  className="flex items-center gap-1.5 text-xs text-brand hover:text-brand font-medium"
                                >
                                  <Link2 className="h-3.5 w-3.5" /> Link to vendor
                                </button>
                              </div>
                            )}
                            <div className="mt-3 pt-3 border-t border-brand">
                              <button
                                onClick={() => deleteLead(lead.id)}
                                className="text-xs text-text-4 hover:text-red-500"
                              >
                                Delete lead
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-text-4 mt-3 text-right">{leads.length} leads</p>
    </div>
  )
}
