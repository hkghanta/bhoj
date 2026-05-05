'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type Installment = {
  id: string
  amount: number
  due_date: string
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  paid_at: string | null
}

type PaymentSchedule = {
  id: string
  total_amount: number
  installments: Installment[]
}

type ManualRow = { amount: string; due_date: string }

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)

const statusConfig = {
  PENDING: { label: 'Pending', icon: Clock, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  PAID: { label: 'Paid', icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  OVERDUE: { label: 'Overdue', icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

export function PaymentScheduleManager({ eventId }: { eventId: string }) {
  const [schedule, setSchedule] = useState<PaymentSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  // Create form state
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [numInstallments, setNumInstallments] = useState(3)
  const [manualRows, setManualRows] = useState<ManualRow[]>([
    { amount: '', due_date: '' },
    { amount: '', due_date: '' },
  ])

  async function fetchSchedule() {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/payment-schedule`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.id) {
          setSchedule(data)
        }
      }
    } catch {
      // no schedule
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body =
        mode === 'auto'
          ? { mode: 'auto', num_installments: numInstallments }
          : {
              mode: 'manual',
              installments: manualRows
                .filter(r => r.amount && r.due_date)
                .map(r => ({ amount: Number(r.amount), due_date: r.due_date })),
            }

      const res = await fetch(`/api/events/${eventId}/payment-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create')
      setCreating(false)
      fetchSchedule()
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkPaid(installmentId: string) {
    setMarkingPaid(installmentId)
    try {
      const res = await fetch(`/api/events/${eventId}/payment-schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installment_id: installmentId, status: 'PAID' }),
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchSchedule()
    } catch {
      // silently fail
    } finally {
      setMarkingPaid(null)
    }
  }

  function addManualRow() {
    setManualRows(prev => [...prev, { amount: '', due_date: '' }])
  }

  function removeManualRow(idx: number) {
    setManualRows(prev => prev.filter((_, i) => i !== idx))
  }

  function updateManualRow(idx: number, field: keyof ManualRow, value: string) {
    setManualRows(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-text-4" />
      </div>
    )
  }

  // No schedule -- show create UI
  if (!schedule) {
    if (!creating) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <CreditCard className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-base text-text-4 mb-6">No payment plan set up for this event yet.</p>
          <Button
            className="bg-brand hover:bg-brand-hover"
            onClick={() => setCreating(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Create Payment Plan
          </Button>
        </div>
      )
    }

    return (
      <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm p-6">
        <h2 className="font-bold text-text-1 mb-6">Create Payment Plan</h2>

        {/* Mode toggle */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setMode('auto')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === 'auto'
                ? 'bg-brand text-white'
                : 'bg-cream text-text-3 hover:bg-cream-2'
            }`}
          >
            Auto-Split
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-brand text-white'
                : 'bg-cream text-text-3 hover:bg-cream-2'
            }`}
          >
            Manual
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {mode === 'auto' ? (
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1">
                Number of Installments
              </label>
              <select
                value={numInstallments}
                onChange={e => setNumInstallments(Number(e.target.value))}
                className="rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              >
                <option value={2}>2 installments</option>
                <option value={3}>3 installments</option>
                <option value={4}>4 installments</option>
              </select>
              <p className="text-xs text-text-4 mt-1">
                The total will be split evenly with due dates spread before the event.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-text-2">Installments</label>
              {manualRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Amount"
                      required
                      className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      value={row.amount}
                      onChange={e => updateManualRow(idx, 'amount', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="date"
                      required
                      className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                      value={row.due_date}
                      onChange={e => updateManualRow(idx, 'due_date', e.target.value)}
                    />
                  </div>
                  {manualRows.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeManualRow(idx)}
                      className="p-2 text-text-4 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addManualRow}
                className="text-sm text-brand hover:text-brand font-medium"
              >
                + Add installment
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-brand hover:bg-brand-hover"
            >
              {saving ? 'Creating...' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    )
  }

  // Schedule exists -- show timeline
  const paidTotal = schedule.installments
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + i.amount, 0)
  const progressPct = schedule.total_amount > 0 ? (paidTotal / schedule.total_amount) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-text-1">Payment Progress</h2>
          <span className="text-sm text-text-4">
            {fmt(paidTotal)} of {fmt(schedule.total_amount)}
          </span>
        </div>
        <div className="w-full bg-cream rounded-full h-3">
          <div
            className="bg-brand h-3 rounded-full transition-all"
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-text-4 mt-1">{Math.round(progressPct)}% paid</p>
      </div>

      {/* Installment timeline */}
      <div className="space-y-4">
        {schedule.installments.map((inst, idx) => {
          const config = statusConfig[inst.status]
          const StatusIcon = config.icon
          return (
            <div
              key={inst.id}
              className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 shadow-sm flex items-center gap-5"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cream flex items-center justify-center text-sm font-semibold text-text-4">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-text-1">{fmt(inst.amount)}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-4 mt-1">
                  <Calendar className="h-3 w-3" />
                  Due {new Date(inst.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {inst.paid_at && (
                    <span className="ml-2 text-green-600">
                      Paid {new Date(inst.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              {inst.status === 'PENDING' && (
                <Button
                  size="sm"
                  className="bg-brand hover:bg-brand-hover flex-shrink-0"
                  disabled={markingPaid === inst.id}
                  onClick={() => handleMarkPaid(inst.id)}
                >
                  {markingPaid === inst.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark Paid
                    </>
                  )}
                </Button>
              )}
              {inst.status === 'OVERDUE' && (
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 flex-shrink-0"
                  disabled={markingPaid === inst.id}
                  onClick={() => handleMarkPaid(inst.id)}
                >
                  {markingPaid === inst.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay Now
                    </>
                  )}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
