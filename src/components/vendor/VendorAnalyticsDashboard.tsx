'use client'
import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, DollarSign, Clock, Star, Users, Loader2 } from 'lucide-react'

type Analytics = {
  total_leads: number
  total_quotes: number
  win_rate: number
  total_revenue: number
  avg_response_time_hours: number
  avg_rating: number
  revenue_by_month: { month: string; revenue: number }[]
  leads_by_status: { status: string; count: number }[]
}

export function VendorAnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/analytics')
      if (!res.ok) throw new Error('Failed to load')
      setData(await res.json())
    } catch {
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnalytics() }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-text-4" /></div>
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-xl">
        <BarChart3 className="h-10 w-10 text-text-4 mx-auto mb-3" />
        <p className="text-text-4">{error ?? 'No analytics data available.'}</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...data.revenue_by_month.map(m => m.revenue), 1)
  const maxLeads = Math.max(...data.leads_by_status.map(l => l.count), 1)

  const statCards = [
    { label: 'Total Leads', value: data.total_leads.toLocaleString(), icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Quotes', value: data.total_quotes.toLocaleString(), icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
    { label: 'Win Rate', value: `${data.win_rate.toFixed(1)}%`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Total Revenue', value: `$${data.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'text-brand bg-cream' },
    { label: 'Avg Response Time', value: `${data.avg_response_time_hours.toFixed(1)}h`, icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Avg Rating', value: data.avg_rating.toFixed(1), icon: Star, color: 'text-yellow-600 bg-yellow-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-brand-border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-4">{stat.label}</p>
                <p className="text-xl font-bold tracking-tight text-text-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
          <h3 className="font-bold text-text-1 mb-6 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-brand" /> Revenue by Month
          </h3>
          {data.revenue_by_month.length === 0 ? (
            <p className="text-sm text-text-4">No revenue data yet.</p>
          ) : (
            <div className="flex items-end gap-2 h-48">
              {data.revenue_by_month.map(m => (
                <div key={m.month} className="flex flex-col items-center flex-1">
                  <span className="text-xs text-text-4 mb-1">${(m.revenue / 1000).toFixed(0)}k</span>
                  <div
                    className="w-full bg-brand rounded-t-md min-h-[4px]"
                    style={{ height: `${(m.revenue / maxRevenue) * 160}px` }}
                  />
                  <span className="text-[10px] text-text-4 mt-1 truncate w-full text-center">{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-sm">
          <h3 className="font-bold text-text-1 mb-6 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" /> Leads by Status
          </h3>
          {data.leads_by_status.length === 0 ? (
            <p className="text-sm text-text-4">No lead data yet.</p>
          ) : (
            <div className="space-y-4">
              {data.leads_by_status.map(l => (
                <div key={l.status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-2 capitalize">{l.status.replace(/_/g, ' ')}</span>
                    <span className="text-text-4">{l.count}</span>
                  </div>
                  <div className="w-full bg-cream rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full"
                      style={{ width: `${(l.count / maxLeads) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
