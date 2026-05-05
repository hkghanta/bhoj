'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type LeadData = {
  business_name: string
  email: string
  phone: string | null
  address: string | null
  city: string
  state: string | null
  website: string | null
  vendor_type: string | null
}

export default function OnboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [lead, setLead] = useState<LeadData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    contact_name: '',
    password: '',
    confirm_password: '',
    business_name: '',
    description: '',
    phone: '',
    website: '',
  })

  useEffect(() => {
    if (!token) { setError('Missing invite token.'); setLoading(false); return }
    fetch(`/api/vendor/onboard?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setLead(data)
        setForm(f => ({
          ...f,
          business_name: data.business_name ?? '',
          phone: data.phone ?? '',
          website: data.website ?? '',
        }))
      })
      .catch(() => setError('Failed to load invite. Please try again.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/vendor/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        contact_name: form.contact_name,
        password: form.password,
        business_name: form.business_name,
        description: form.description,
        phone: form.phone,
        website: form.website,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setSubmitting(false)
      return
    }
    setDone(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <p className="text-text-4">Loading your invitation…</p>
    </div>
  )

  if (error && !lead) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-text-1 mb-2">Invalid Invite</h1>
        <p className="text-text-4">{error}</p>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-black tracking-tight text-text-1 mb-3">You're registered!</h1>
        <p className="text-text-3 mb-6">
          Your profile is under review. We'll send you an email once it's approved — usually within 24 hours.
        </p>
        <p className="text-sm text-text-4">You can close this window.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand mb-1">OneSeva</h1>
          <p className="text-text-4 text-sm">South Asian Event Marketplace</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-brand-border p-8">
          <h2 className="text-xl font-bold text-text-1 mb-1">Complete your vendor profile</h2>
          <p className="text-sm text-text-4 mb-6">
            You've been invited to join OneSeva. Fill in your details below to get started.
          </p>

          {/* Pre-filled info banner */}
          {lead && (
            <div className="bg-cream border border-brand-border rounded-lg px-4 py-3 mb-6 text-sm text-brand">
              <strong>{lead.business_name}</strong> · {lead.city}{lead.state ? `, ${lead.state}` : ''} · {lead.email}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Your name *</label>
              <input
                required
                value={form.contact_name}
                onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                placeholder="Your full name"
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Business name *</label>
              <input
                required
                value={form.business_name}
                onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">About your business</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tell event hosts about your specialties, experience, and what makes you unique…"
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://"
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>

            <div className="border-t border-brand-border pt-4">
              <label className="block text-sm font-medium text-text-2 mb-1">Password *</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="At least 8 characters"
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">Confirm password *</label>
              <input
                required
                type="password"
                value={form.confirm_password}
                onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting ? 'Creating your account…' : 'Create My Account'}
            </button>

            <p className="text-xs text-center text-text-4">
              By registering you agree to OneSeva's terms of service.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
