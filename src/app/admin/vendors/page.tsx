'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { Mail, X, Send, ExternalLink, MapPin, Phone, Globe, ShieldCheck, ShieldOff, Sparkles, MessageSquare } from 'lucide-react'

type Vendor = {
  id: string
  business_name: string
  email: string
  vendor_type: string
  city: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  subscriptions: { tier: string; status: string }[]
}

type Invite = {
  id: string
  business_name: string
  address: string | null
  phone: string | null
  website: string | null
  rating: number | null
  vendor_type: string
  city: string
  created_at: string
  customer: { name: string | null; email: string }
  event: { event_name: string; city: string }
}

type ConciergeReq = {
  id: string
  status: string
  city: string
  event_type: string | null
  event_date: string | null
  guest_count: number | null
  budget: string | null
  vendor_types: string[]
  notes: string | null
  admin_notes: string | null
  created_at: string
  customer: { name: string; email: string; phone: string | null }
}

type EmailModal = { vendor: Vendor; subject: string; body: string; replyTo: string } | null
type Tab = 'vendors' | 'invites' | 'concierge'

const STATUS_COLORS: Record<string, string> = {
  NEW:         'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
  COMPLETED:   'bg-green-50 text-green-700',
  CANCELLED:   'bg-cream text-text-4',
}

export default function AdminVendorsPage() {
  const [vendors, setVendors]       = useState<Vendor[]>([])
  const [invites, setInvites]       = useState<Invite[]>([])
  const [concierge, setConcierge]   = useState<ConciergeReq[]>([])
  const [filter, setFilter]         = useState<'pending' | 'approved' | 'all'>('pending')
  const [tab, setTab]               = useState<Tab>('vendors')
  const [loading, setLoading]       = useState(true)
  const [emailModal, setEmailModal] = useState<EmailModal>(null)
  const [sending, setSending]       = useState(false)
  const [sentIds, setSentIds]       = useState<Set<string>>(new Set())
  const [verifying, setVerifying]   = useState<string | null>(null)
  const [notesId, setNotesId]       = useState<string | null>(null)
  const [notesText, setNotesText]   = useState('')
  const router = useRouter()
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLoading(true)
    if (tab === 'vendors') {
      fetch(`/api/admin/vendors?status=${filter}`)
        .then(r => { if (r.status === 401) { router.push('/admin/login'); return null } return r.json() })
        .then(data => { if (data) { setVendors(data); setLoading(false) } })
    } else if (tab === 'invites') {
      fetch('/api/local-vendors/invite')
        .then(r => r.ok ? r.json() : [])
        .then(data => { setInvites(Array.isArray(data) ? data : []); setLoading(false) })
    } else {
      fetch('/api/admin/concierge')
        .then(r => r.ok ? r.json() : [])
        .then(data => { setConcierge(Array.isArray(data) ? data : []); setLoading(false) })
    }
  }, [filter, tab, router])

  async function approve(id: string) {
    await fetch(`/api/admin/vendors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true, is_verified: true }),
    })
    setVendors(v => v.filter(vendor => vendor.id !== id))
  }

  async function reject(id: string) {
    await fetch(`/api/admin/vendors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    setVendors(v => v.filter(vendor => vendor.id !== id))
  }

  async function toggleVerify(vendor: Vendor) {
    setVerifying(vendor.id)
    const res = await fetch(`/api/admin/vendors/${vendor.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: !vendor.is_verified }),
    })
    if (res.ok) {
      setVendors(v => v.map(vv => vv.id === vendor.id ? { ...vv, is_verified: !vendor.is_verified } : vv))
    }
    setVerifying(null)
  }

  function openEmailModal(vendor: Vendor) {
    setEmailModal({
      vendor,
      subject: `Welcome to OneSeva — ${vendor.business_name}`,
      body: `Hi ${vendor.business_name},\n\nThank you for joining OneSeva! We're excited to have you on the platform.\n\nYour profile is now live and customers in ${vendor.city} can discover and contact you.\n\nIf you need any help setting up your profile or menu packages, feel free to reply to this email.\n\nBest regards,\nThe OneSeva Team`,
      replyTo: '',
    })
    setTimeout(() => bodyRef.current?.focus(), 100)
  }

  async function sendEmail() {
    if (!emailModal) return
    setSending(true)
    const res = await fetch(`/api/admin/vendors/${emailModal.vendor.id}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: emailModal.subject, body: emailModal.body, replyTo: emailModal.replyTo || undefined }),
    })
    if (res.ok) {
      setSentIds(prev => new Set([...prev, emailModal.vendor.id]))
      setEmailModal(null)
    } else {
      alert('Failed to send email. Check Resend API key configuration.')
    }
    setSending(false)
  }

  async function updateConciergeStatus(id: string, status: string) {
    const res = await fetch('/api/admin/concierge', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) setConcierge(c => c.map(r => r.id === id ? { ...r, status } : r))
  }

  async function saveNotes(id: string) {
    const res = await fetch('/api/admin/concierge', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, admin_notes: notesText }),
    })
    if (res.ok) {
      setConcierge(c => c.map(r => r.id === id ? { ...r, admin_notes: notesText } : r))
      setNotesId(null)
    }
  }

  const newConcierge = concierge.filter(r => r.status === 'NEW').length

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-text-1">Vendor Management</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b">
          {([
            { key: 'vendors',   label: 'Platform Vendors', badge: 0 },
            { key: 'invites',   label: 'Invite Requests',  badge: invites.length },
            { key: 'concierge', label: 'Concierge',        badge: newConcierge },
          ] as { key: Tab; label: string; badge: number }[]).map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? 'border-brand text-brand' : 'border-transparent text-text-4 hover:text-text-2'}`}
            >
              {label}
              {badge > 0 && tab !== key && (
                <span className="bg-brand text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── VENDORS TAB ── */}
        {tab === 'vendors' && (
          <>
            <div className="flex gap-2 mb-4">
              {(['pending', 'approved', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-brand text-white' : 'bg-white border text-text-3 hover:bg-cream'}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-text-4 text-center py-12">Loading…</p>
            ) : vendors.length === 0 ? (
              <p className="text-text-4 text-center py-12">No vendors in this category.</p>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-cream border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Vendor</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Type</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Location</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Status</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Joined</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {vendors.map(vendor => (
                      <tr key={vendor.id} className="hover:bg-cream">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-text-1">{vendor.business_name}</p>
                            {vendor.is_verified && (
                              <span title="OneSeva Verified"><ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" /></span>
                            )}
                          </div>
                          <p className="text-text-4 text-xs">{vendor.email}</p>
                        </td>
                        <td className="px-4 py-3 text-text-3">{vendor.vendor_type.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-text-3">{vendor.city}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <Badge className={`text-xs ${vendor.is_active ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {vendor.is_active ? 'Active' : 'Pending'}
                            </Badge>
                            {vendor.is_verified && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">Verified</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-4 text-xs">
                          {format(new Date(vendor.created_at), 'd MMM yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 items-center flex-wrap">
                            {!vendor.is_active ? (
                              <button onClick={() => approve(vendor.id)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">
                                Approve
                              </button>
                            ) : (
                              <button onClick={() => reject(vendor.id)} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded">
                                Deactivate
                              </button>
                            )}
                            <button
                              onClick={() => toggleVerify(vendor)}
                              disabled={verifying === vendor.id}
                              title={vendor.is_verified ? 'Remove verification' : 'Mark as verified'}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                                vendor.is_verified
                                  ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                  : 'border-brand-border text-text-4 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              {vendor.is_verified ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                              {vendor.is_verified ? 'Unverify' : 'Verify'}
                            </button>
                            <button
                              onClick={() => openEmailModal(vendor)}
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                                sentIds.has(vendor.id) ? 'bg-green-50 border-green-200 text-green-600' : 'border-brand-border text-text-4 hover:border-brand hover:text-brand hover:bg-cream'
                              }`}
                            >
                              <Mail className="h-3 w-3" />
                              {sentIds.has(vendor.id) ? 'Sent' : 'Email'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── INVITES TAB ── */}
        {tab === 'invites' && (
          <div>
            <p className="text-sm text-text-4 mb-4">Local businesses customers have shown interest in. Follow up to invite them to join OneSeva.</p>
            {loading ? (
              <p className="text-text-4 text-center py-12">Loading…</p>
            ) : invites.length === 0 ? (
              <p className="text-text-4 text-center py-12">No invite requests yet.</p>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-cream border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Business</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Type · City</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Requested by</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">For event</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Date</th>
                      <th className="px-4 py-3 text-left text-text-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {invites.map(invite => (
                      <tr key={invite.id} className="hover:bg-cream">
                        <td className="px-4 py-3">
                          <p className="font-medium text-text-1">{invite.business_name}</p>
                          {invite.address && <p className="text-text-4 text-xs flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{invite.address}</p>}
                          {invite.rating && <p className="text-xs text-amber-600 mt-0.5">⭐ {invite.rating}</p>}
                        </td>
                        <td className="px-4 py-3 text-text-3">
                          <p>{invite.vendor_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-text-4">{invite.city}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-text-1">{invite.customer.name ?? 'Unknown'}</p>
                          <p className="text-xs text-text-4">{invite.customer.email}</p>
                        </td>
                        <td className="px-4 py-3 text-text-3">{invite.event.event_name}</td>
                        <td className="px-4 py-3 text-text-4 text-xs">{format(new Date(invite.created_at), 'd MMM yyyy')}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {invite.phone && (
                              <a href={`tel:${invite.phone}`} className="flex items-center gap-1 text-xs text-text-4 hover:text-brand border border-brand-border hover:border-brand px-2 py-1 rounded transition-colors">
                                <Phone className="h-3 w-3" /> Call
                              </a>
                            )}
                            {invite.website && (
                              <a href={invite.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-text-4 hover:text-brand border border-brand-border hover:border-brand px-2 py-1 rounded transition-colors">
                                <Globe className="h-3 w-3" /> Website
                              </a>
                            )}
                            <button
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invite.business_name + ' ' + invite.city)}`, '_blank')}
                              className="flex items-center gap-1 text-xs text-text-4 hover:text-brand border border-brand-border hover:border-brand px-2 py-1 rounded transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" /> Find
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── CONCIERGE TAB ── */}
        {tab === 'concierge' && (
          <div>
            <p className="text-sm text-text-4 mb-4">
              Customers who requested personal vendor recommendations. Respond within 24 hours.
            </p>
            {loading ? (
              <p className="text-text-4 text-center py-12">Loading…</p>
            ) : concierge.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl">
                <Sparkles className="h-8 w-8 text-text-4 mx-auto mb-3" />
                <p className="text-text-4">No concierge requests yet.</p>
                <p className="text-text-4 text-sm mt-1">Share <strong>/concierge</strong> with customers to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {concierge.map(req => (
                  <div key={req.id} className="bg-white rounded-xl border p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-text-1">{req.customer.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status] ?? 'bg-cream text-text-3'}`}>
                            {req.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-text-4 mt-0.5">{req.customer.email}{req.customer.phone ? ` · ${req.customer.phone}` : ''}</p>
                      </div>
                      <p className="text-xs text-text-4">{format(new Date(req.created_at), 'd MMM yyyy')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3">
                      <div><span className="text-text-4">City: </span><span className="text-text-1">{req.city}</span></div>
                      {req.event_type && <div><span className="text-text-4">Event: </span><span className="text-text-1">{req.event_type}</span></div>}
                      {req.event_date && <div><span className="text-text-4">Date: </span><span className="text-text-1">{format(new Date(req.event_date), 'd MMM yyyy')}</span></div>}
                      {req.guest_count && <div><span className="text-text-4">Guests: </span><span className="text-text-1">{req.guest_count}</span></div>}
                      {req.budget && <div><span className="text-text-4">Budget: </span><span className="text-text-1">{req.budget}</span></div>}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {req.vendor_types.map(t => (
                        <span key={t} className="text-xs bg-cream text-brand px-2 py-0.5 rounded-full">
                          {t.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      ))}
                    </div>

                    {req.notes && (
                      <p className="text-sm text-text-3 bg-cream rounded-lg px-3 py-2 mb-3 italic">"{req.notes}"</p>
                    )}

                    {notesId === req.id ? (
                      <div className="mb-3">
                        <textarea
                          value={notesText}
                          onChange={e => setNotesText(e.target.value)}
                          rows={2}
                          placeholder="Internal notes (not visible to customer)…"
                          className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none"
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => saveNotes(req.id)} className="text-xs bg-brand text-white px-3 py-1 rounded hover:bg-brand-hover">Save</button>
                          <button onClick={() => setNotesId(null)} className="text-xs text-text-4 px-3 py-1 rounded hover:text-text-1">Cancel</button>
                        </div>
                      </div>
                    ) : req.admin_notes ? (
                      <p
                        onClick={() => { setNotesId(req.id); setNotesText(req.admin_notes ?? '') }}
                        className="text-xs text-text-4 bg-yellow-50 border border-yellow-100 rounded px-2 py-1 mb-3 cursor-pointer hover:bg-yellow-100"
                      >
                        📝 {req.admin_notes}
                      </p>
                    ) : null}

                    <div className="flex gap-2 flex-wrap">
                      {(['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => updateConciergeStatus(req.id, s)}
                          className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                            req.status === s
                              ? `${STATUS_COLORS[s]} border-current`
                              : 'border-brand-border text-text-4 hover:border-brand-border'
                          }`}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                      <button
                        onClick={() => { setNotesId(req.id); setNotesText(req.admin_notes ?? '') }}
                        className="flex items-center gap-1 text-xs border border-brand-border text-text-4 hover:border-brand hover:text-brand px-2.5 py-1 rounded"
                      >
                        <MessageSquare className="h-3 w-3" /> Notes
                      </button>
                      <a
                        href={`mailto:${req.customer.email}?subject=Your OneSeva concierge request&body=Hi ${req.customer.name},%0A%0A`}
                        className="flex items-center gap-1 text-xs border border-brand-border text-text-4 hover:border-brand hover:text-brand px-2.5 py-1 rounded"
                      >
                        <Mail className="h-3 w-3" /> Reply
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-base font-semibold text-text-1">Email Vendor</h2>
                <p className="text-xs text-text-4 mt-0.5">To: {emailModal.vendor.email}</p>
              </div>
              <button onClick={() => setEmailModal(null)} className="p-1.5 rounded-lg hover:bg-cream text-text-4"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-3 mb-1.5">Subject</label>
                <input type="text" value={emailModal.subject} onChange={e => setEmailModal(m => m ? { ...m, subject: e.target.value } : m)} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-3 mb-1.5">Reply-to (optional)</label>
                <input type="email" value={emailModal.replyTo} onChange={e => setEmailModal(m => m ? { ...m, replyTo: e.target.value } : m)} placeholder="your@email.com" className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-3 mb-1.5">Message</label>
                <textarea ref={bodyRef} value={emailModal.body} onChange={e => setEmailModal(m => m ? { ...m, body: e.target.value } : m)} rows={8} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none font-mono" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-cream rounded-b-2xl">
              <button onClick={() => setEmailModal(null)} className="px-4 py-2 text-sm text-text-3 hover:text-text-1">Cancel</button>
              <button onClick={sendEmail} disabled={sending || !emailModal.subject || !emailModal.body} className="flex items-center gap-2 px-4 py-2 text-sm bg-brand hover:bg-brand-hover text-white rounded-lg disabled:opacity-50 font-medium">
                <Send className="h-3.5 w-3.5" />
                {sending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
