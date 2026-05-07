'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  Users,
  Calculator,
  BarChart3,
  Loader2,
  Wallet,
  CheckCircle2,
} from 'lucide-react'

type VendorEntry = {
  vendor_id: string
  vendor_name: string
  vendor_type: string
  total: number
  count: number
}

type VendorTypeEntry = {
  vendor_type: string
  total: number
  count: number
  percentage: number
}

type EventTypeEntry = {
  event_type: string
  total: number
  count: number
}

type SpendData = {
  total_budget: number
  total_spend: number
  total_spent_tracked: number
  remaining: number
  utilization_pct: number
  last_30_days: number
  last_90_days: number
  order_count: number
  average_order_value: number
  vendor_count: number
  by_vendor: VendorEntry[]
  by_vendor_type: VendorTypeEntry[]
  by_event_type: EventTypeEntry[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

const fmtPrecise = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

/** Readable label from VENDOR_TYPE enum */
function vendorTypeLabel(vt: string): string {
  return vt
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

/** Color palette for vendor type bars */
const VENDOR_TYPE_COLORS = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
]

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

  // Budget utilization color
  const pct = data.utilization_pct
  const utilizationColor =
    pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
  const utilizationTextColor =
    pct >= 95 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-emerald-600'
  const utilizationBg =
    pct >= 95 ? 'bg-red-50' : pct >= 80 ? 'bg-amber-50' : 'bg-emerald-50'

  const statCards = [
    {
      label: 'Total Budget',
      value: fmt(data.total_budget),
      icon: Wallet,
      color: 'text-brand bg-cream',
    },
    {
      label: 'Total Committed',
      value: fmt(data.total_spend),
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Remaining',
      value: fmt(data.remaining),
      icon: TrendingUp,
      color: data.remaining >= 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50',
    },
    {
      label: 'Vendors Booked',
      value: data.vendor_count.toString(),
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
  ]

  return (
    <div className="space-y-8">
      {/* ── Stats Row ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-text-4 truncate">{card.label}</p>
                  <p className="text-xl font-bold text-text-1 tracking-tight">{card.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Budget Utilization Bar ────────────────────────────────── */}
      {data.total_budget > 0 && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-text-4" />
              <h2 className="font-bold text-text-1">Budget Utilization</h2>
            </div>
            <span
              className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${utilizationBg} ${utilizationTextColor}`}
            >
              {pct}% used
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${utilizationColor}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>

          {/* Labels below bar */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-text-3">
              Spent: <span className="font-semibold text-text-1">{fmtPrecise(data.total_spend)}</span>
            </span>
            <span className="text-text-3">
              Remaining:{' '}
              <span className={`font-semibold ${data.remaining >= 0 ? 'text-text-1' : 'text-red-600'}`}>
                {fmtPrecise(Math.abs(data.remaining))}
                {data.remaining < 0 ? ' over budget' : ''}
              </span>
            </span>
            <span className="text-text-3">
              Budget: <span className="font-semibold text-text-1">{fmtPrecise(data.total_budget)}</span>
            </span>
          </div>
        </div>
      )}

      {/* ── Breakdown by Vendor Type ────────────────────────────── */}
      {data.by_vendor_type.length > 0 && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-4 w-4 text-text-4" />
            <h2 className="font-bold text-text-1">Spend by Category</h2>
          </div>

          <div className="space-y-4">
            {data.by_vendor_type.map((vt, idx) => {
              const barColor = VENDOR_TYPE_COLORS[idx % VENDOR_TYPE_COLORS.length]
              const maxTotal = data.by_vendor_type[0].total
              const barWidth = maxTotal > 0 ? (vt.total / maxTotal) * 100 : 0

              return (
                <div key={vt.vendor_type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-text-2">
                      {vendorTypeLabel(vt.vendor_type)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-4">{vt.percentage}%</span>
                      <span className="text-sm font-semibold text-text-1 tabular-nums w-24 text-right">
                        {fmtPrecise(vt.total)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Per-Vendor Spend Cards ──────────────────────────────── */}
      {data.by_vendor.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-text-4" />
            <h2 className="font-bold text-text-1">Booked Vendors</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.by_vendor.map(v => (
              <div
                key={v.vendor_id}
                className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text-1 truncate">{v.vendor_name}</h3>
                    <span className="inline-block mt-1 text-xs font-medium text-text-4 bg-cream rounded-md px-2 py-0.5">
                      {vendorTypeLabel(v.vendor_type)}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-text-1 tabular-nums shrink-0">
                    {fmtPrecise(v.total)}
                  </p>
                </div>
                {v.count > 1 && (
                  <p className="text-xs text-text-4">
                    {v.count} accepted {v.count === 1 ? 'quote' : 'quotes'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── By Event Type ──────────────────────────────────────── */}
      {data.by_event_type.length > 0 && (
        <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border">
            <BarChart3 className="h-4 w-4 text-text-4" />
            <h2 className="font-bold text-text-1">By Event Type</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-sm text-text-4 border-b border-brand-border">
                  <th className="px-5 py-3 font-medium">Event Type</th>
                  <th className="px-5 py-3 font-medium text-right">Total Spend</th>
                  <th className="px-5 py-3 font-medium text-right">Quotes</th>
                </tr>
              </thead>
              <tbody>
                {data.by_event_type.map(et => (
                  <tr key={et.event_type} className="border-b border-brand-border last:border-0 hover:bg-cream">
                    <td className="px-5 py-3 text-text-2 capitalize">
                      {et.event_type.replace(/_/g, ' ').toLowerCase()}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-text-1 tabular-nums">
                      {fmtPrecise(et.total)}
                    </td>
                    <td className="px-5 py-3 text-right text-text-4">{et.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────── */}
      {data.order_count === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-brand-border rounded-2xl">
          <DollarSign className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-3 font-medium">No accepted quotes yet</p>
          <p className="text-text-4 text-sm mt-1">
            Once you accept vendor quotes, your spend analytics will appear here.
          </p>
        </div>
      )}

      {/* ── Footer summary row ────────────────────────────────── */}
      {data.order_count > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-cream rounded-2xl p-4 text-center">
            <p className="text-xs text-text-4 mb-1">Last 30 Days</p>
            <p className="text-lg font-bold text-text-1">{fmt(data.last_30_days)}</p>
          </div>
          <div className="bg-cream rounded-2xl p-4 text-center">
            <p className="text-xs text-text-4 mb-1">Last 90 Days</p>
            <p className="text-lg font-bold text-text-1">{fmt(data.last_90_days)}</p>
          </div>
          <div className="bg-cream rounded-2xl p-4 text-center">
            <p className="text-xs text-text-4 mb-1">Avg. per Vendor</p>
            <p className="text-lg font-bold text-text-1">{fmt(data.average_order_value)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
