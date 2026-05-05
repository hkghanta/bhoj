'use client'
import { useState, useEffect } from 'react'

type Profile = { name: string; email: string; phone: string | null; location: string | null }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', phone: '', location: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/customer/profile')
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/customer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: profile.name, phone: profile.phone, location: profile.location }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="text-text-4 py-16 text-center">Loading…</div>

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-black tracking-tight text-text-1 mb-8">My Profile</h1>
      <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Full name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              required
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm bg-cream text-text-4 cursor-not-allowed"
            />
            <p className="text-xs text-text-4 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">Phone</label>
            <input
              type="tel"
              value={profile.phone ?? ''}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1">City / Location</label>
            <input
              type="text"
              value={profile.location ?? ''}
              onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. London, UK"
              className="w-full border border-brand-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
