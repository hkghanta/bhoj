'use client'
import { useState, useEffect } from 'react'
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react'

type ServiceConfig = {
  id: string
  vendor_type: string
  label: string
  icon: string
  service_class: string
  is_enabled: boolean
  sort_order: number
}

export default function AdminServicesPage() {
  const [configs, setConfigs] = useState<ServiceConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/services')
      .then(r => r.json())
      .then(data => { setConfigs(data); setLoading(false) })
  }, [])

  async function toggle(type: string, current: boolean) {
    setToggling(type)
    const res = await fetch(`/api/admin/services/${type}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_enabled: !current }),
    })
    if (res.ok) {
      const updated = await res.json()
      setConfigs(prev => prev.map(c => c.vendor_type === type ? { ...c, is_enabled: updated.is_enabled } : c))
    }
    setToggling(null)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-cream rounded w-48" />
          <div className="h-4 bg-cream rounded w-64" />
          <div className="h-64 bg-cream rounded-xl" />
        </div>
      </div>
    )
  }

  const enabled = configs.filter(c => c.is_enabled)
  const disabled = configs.filter(c => !c.is_enabled)

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="h-5 w-5 text-brand" />
          <h1 className="text-3xl font-bold tracking-tight text-text-1">Service Catalogue</h1>
        </div>
        <p className="text-sm text-text-4 ml-8">
          {enabled.length} of {configs.length} service types visible to customers.
          Enabled services appear on every event dashboard.
        </p>
      </div>

      <div className="space-y-8">
        {[
          { title: 'Enabled', subtitle: 'Visible to customers', items: enabled, emptyMsg: 'No services enabled.' },
          { title: 'Disabled', subtitle: 'Hidden from customers', items: disabled, emptyMsg: 'All services are enabled.' },
        ].map(({ title, subtitle, items, emptyMsg }) => (
          <div key={title}>
            <div className="mb-3">
              <h2 className="text-xs font-bold text-text-4 uppercase tracking-widest">{title}</h2>
              <p className="text-xs text-text-4 mt-0.5">{subtitle}</p>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-text-4 italic pl-1">{emptyMsg}</p>
            ) : (
              <div className="bg-white rounded-xl border border-brand-border divide-y divide-brand-border overflow-hidden">
                {items.map(c => (
                  <div key={c.vendor_type} className="flex items-center gap-4 px-5 py-3.5 hover:bg-cream transition-colors">
                    <span className="text-2xl w-8 text-center flex-shrink-0">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-1">{c.label}</p>
                      <p className="text-xs text-text-4 mt-0.5">
                        {c.vendor_type}
                        <span className="mx-1.5">·</span>
                        <span className={c.service_class === 'INDIVIDUAL' ? 'text-indigo-500' : 'text-emerald-500'}>
                          {c.service_class}
                        </span>
                        <span className="mx-1.5">·</span>
                        order {c.sort_order}
                      </p>
                    </div>
                    <button
                      onClick={() => toggle(c.vendor_type, c.is_enabled)}
                      disabled={toggling === c.vendor_type}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                        c.is_enabled ? 'bg-brand' : 'bg-cream-2'
                      } ${toggling === c.vendor_type ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      aria-label={`${c.is_enabled ? 'Disable' : 'Enable'} ${c.label}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        c.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats footer */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[
          { label: 'Business services', value: configs.filter(c => c.service_class === 'BUSINESS').length, color: 'text-emerald-600' },
          { label: 'Individual services', value: configs.filter(c => c.service_class === 'INDIVIDUAL').length, color: 'text-indigo-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-brand-border px-5 py-4">
            <p className={`text-2xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-text-4 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
