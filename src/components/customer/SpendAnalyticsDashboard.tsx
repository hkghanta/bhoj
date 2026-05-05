'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calculator,
  PieChart,
  BarChart3,
  Loader2,
} from 'lucide-react'

type SpendData = {
  total_spend: number
  last_30_days: number
  order_count: number
  average_order_value: number
  by_vendor: { vendor_id: string; vendor_name: string; total_spend: number; order_count: number }[]
  by_event_type: { event_type: string; total_spend: number; order_count: number }[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

export function SpendAnalyticsDashboard() {
  const [data, setData] = useState<SpendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/customer/spend-analytics')
      .then(r => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-4" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-xl">
        <DollarSign className="h-10 w-10 text-text-4 mx-auto mb-3" />
        <p className="text-text-4">Unable to load spending data.</p>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Spend', value: fmt(data.total_spend), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Last 30 Days', value: fmt(data.last_30_days), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Orders', value: data.order_count.toString(), icon: ShoppingCart, color: 'text-purple-600 bg-purple-50' },
    { label: 'Avg. Order Value', value: fmt(data.average_order_value), icon: Calculator, color: 'text-brand bg-cream' },
  ]

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-text-4">{card.label}</p>
                  <p className="text-lg font-bold text-text-1">{card.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* By Vendor */}
      <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <PieChart className="h-4 w-4 text-text-4" />
          <h2 className="font-bold text-text-1">By Vendor</h2>
        </div>
        {data.by_vendor.length === 0 ? (
          <p className="text-sm text-text-4 px-5 py-6 text-center">No vendor data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-sm text-text-4 border-b">
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium text-right">Total Spend</th>
                  <th className="px-5 py-3 font-medium text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.by_vendor.map(v => (
                  <tr key={v.vendor_id} className="border-b last:border-0 hover:bg-cream">
                    <td className="px-5 py-3 text-text-2">{v.vendor_name}</td>
                    <td className="px-5 py-3 text-right font-medium text-text-1">{fmt(v.total_spend)}</td>
                    <td className="px-5 py-3 text-right text-text-4">{v.order_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* By Event Type */}
      <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <BarChart3 className="h-4 w-4 text-text-4" />
          <h2 className="font-bold text-text-1">By Event Type</h2>
        </div>
        {data.by_event_type.length === 0 ? (
          <p className="text-sm text-text-4 px-5 py-6 text-center">No event type data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-sm text-text-4 border-b">
                  <th className="px-5 py-3 font-medium">Event Type</th>
                  <th className="px-5 py-3 font-medium text-right">Total Spend</th>
                  <th className="px-5 py-3 font-medium text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {data.by_event_type.map(et => (
                  <tr key={et.event_type} className="border-b last:border-0 hover:bg-cream">
                    <td className="px-5 py-3 text-text-2">{et.event_type.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3 text-right font-medium text-text-1">{fmt(et.total_spend)}</td>
                    <td className="px-5 py-3 text-right text-text-4">{et.order_count}</td>
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
