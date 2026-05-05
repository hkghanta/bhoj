'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'

type Sub = {
  id: string
  tier: string
  status: string
  leads_this_month: number
  leads_limit: number
  current_period_end: string | null
  created_at: string
  vendor: { id: string; business_name: string; email: string; vendor_type: string }
}

type Stats = {
  total: number
  active: number
  by_tier: { FREE: number; PRO: number; PREMIUM: number }
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then(r => {
        if (r.status === 401) { router.push('/admin/login'); return null }
        return r.json()
      })
      .then(data => {
        if (data) {
          setSubs(data.subscriptions)
          setStats(data.stats)
          setLoading(false)
        }
      })
  }, [router])

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight text-text-1">Subscriptions</h1>
        </div>

        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Active', value: stats.active },
              { label: 'Free', value: stats.by_tier.FREE },
              { label: 'Pro', value: stats.by_tier.PRO },
              { label: 'Premium', value: stats.by_tier.PREMIUM },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border p-4 text-center">
                <p className="text-3xl font-black tracking-tight text-text-1">{s.value}</p>
                <p className="text-xs text-text-4 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-text-4 text-center py-12">Loading…</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-text-4 font-medium">Vendor</th>
                  <th className="px-4 py-3 text-left text-text-4 font-medium">Plan</th>
                  <th className="px-4 py-3 text-left text-text-4 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-text-4 font-medium">Leads</th>
                  <th className="px-4 py-3 text-left text-text-4 font-medium">Period Ends</th>
                  <th className="px-4 py-3 text-left text-text-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {subs.map(sub => (
                  <tr key={sub.id} className="hover:bg-cream">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-1">{sub.vendor.business_name}</p>
                      <p className="text-text-4 text-xs">{sub.vendor.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${sub.tier === 'PREMIUM' ? 'bg-cream text-brand' : sub.tier === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-cream text-text-3'}`}>
                        {sub.tier}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-cream text-text-3'}`}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-3">
                      {sub.leads_this_month}/{sub.leads_limit >= 999 ? '∞' : sub.leads_limit}
                    </td>
                    <td className="px-4 py-3 text-text-4 text-xs">
                      {sub.current_period_end ? format(new Date(sub.current_period_end), 'd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-4 text-xs">
                      {format(new Date(sub.created_at), 'd MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
