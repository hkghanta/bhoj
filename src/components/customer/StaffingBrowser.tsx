'use client'

import { useState, useEffect } from 'react'
import {
  Search, Loader2, UserCheck, DollarSign, Shield, Clock,
  ShieldCheck, Shirt,
} from 'lucide-react'

type StaffResult = {
  id: string
  vendor_id: string
  staff_role_key: string
  name: string
  description: string | null
  hourly_rate: number
  min_hours: number
  max_staff_available: number
  includes_uniform: boolean
  background_checked: boolean
  vendor: {
    id: string
    business_name: string
    city: string
    profile_photo_url: string | null
    is_verified: boolean
  }
}

const STAFF_ROLES = [
  { key: '', label: 'All Roles' },
  { key: 'SERVER', label: 'Server' },
  { key: 'BARTENDER', label: 'Bartender' },
  { key: 'CHEF', label: 'Chef' },
  { key: 'HOST', label: 'Host' },
  { key: 'BUSSER', label: 'Busser' },
  { key: 'BARISTA', label: 'Barista' },
  { key: 'KITCHEN_HELPER', label: 'Kitchen Helper' },
  { key: 'EVENT_COORDINATOR', label: 'Event Coordinator' },
  { key: 'OTHER', label: 'Other' },
]

type Props = { eventId: string; city?: string }

export default function StaffingBrowser({ eventId, city: initialCity }: Props) {
  const [results, setResults] = useState<StaffResult[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [city, setCity] = useState(initialCity ?? '')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  useEffect(() => {
    if (!initialCity) {
      fetch(`/api/events/${eventId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.city) setCity(d.city) })
        .catch(() => {})
    }
  }, [eventId, initialCity])

  useEffect(() => {
    if (!city) return
    searchStaff()
  }, [selectedRole, city]) // eslint-disable-line react-hooks/exhaustive-deps

  async function searchStaff() {
    if (!city) return
    setLoading(true)
    const params = new URLSearchParams({ city })
    if (selectedRole) params.set('role', selectedRole)
    try {
      const res = await fetch(`/api/staffing/search?${params}`)
      if (res.ok) setResults(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
    setSearched(true)
  }

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="text-xs font-medium text-text-4 block mb-1">Staff Role</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="rounded-xl border border-brand-border px-3 py-2 text-sm bg-white dark:bg-cream-2 focus:outline-none focus:ring-2 focus:ring-brand min-w-[180px]"
          >
            {STAFF_ROLES.map(r => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center gap-2 text-text-4 py-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching...
        </div>
      ) : !searched ? (
        <div className="bg-cream rounded-xl border border-dashed p-6 text-center">
          <UserCheck className="h-6 w-6 text-text-4 mx-auto mb-2" />
          <p className="text-sm text-text-4">Select a role to browse available staff.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-cream rounded-xl border border-dashed p-6 text-center">
          <Search className="h-6 w-6 text-text-4 mx-auto mb-2" />
          <p className="text-sm text-text-4">No staff listings found in {city}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-text-4">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(s => (
            <div key={s.id} className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-text-1 text-sm">{s.name}</span>
                    <span className="text-xs text-text-4 bg-cream px-2 py-0.5 rounded-full">
                      {s.staff_role_key.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-text-4">{s.vendor.business_name}</span>
                    {s.vendor.is_verified && (
                      <span className="flex items-center gap-0.5 text-xs text-blue-600">
                        <Shield className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-sm text-text-3 mt-2 line-clamp-2">{s.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand bg-cream px-2.5 py-1 rounded-xl">
                      <DollarSign className="h-3.5 w-3.5" /> {fmt(Number(s.hourly_rate))}/hr
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-text-4">
                      <Clock className="h-3 w-3" /> Min {s.min_hours}h
                    </span>
                    <span className="text-xs text-text-4">
                      Up to {s.max_staff_available} staff
                    </span>
                    {s.includes_uniform && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                        <Shirt className="h-3 w-3" /> Uniform included
                      </span>
                    )}
                    {s.background_checked && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="h-3 w-3" /> Background checked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
