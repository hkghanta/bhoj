'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Send, Mail, MailOpen, UserCheck, UtensilsCrossed,
  Bell, RefreshCw, ChevronDown, ChevronUp, Users,
} from 'lucide-react'

type Stats = {
  total: number
  invited: number
  opened: number
  responded: number
  attending: number
  declined: number
  pending: number
  missing_meal: number
  total_guests: number
}

type ReminderTarget = 'not_sent' | 'not_opened' | 'not_responded' | 'missing_meal'

export function RsvpDashboard({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<ReminderTarget | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/guests/stats`)
      if (res.ok) setStats(await res.json())
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchStats() }, [fetchStats])

  async function sendReminder(target: ReminderTarget) {
    setSending(target)
    setLastResult(null)
    try {
      const res = await fetch(`/api/events/${eventId}/guests/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      })
      if (res.ok) {
        const data = await res.json()
        setLastResult(`Sent ${data.reminded} reminder${data.reminded !== 1 ? 's' : ''}`)
        await fetchStats()
      }
    } finally {
      setSending(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-cream rounded w-48 mb-4" />
        <div className="h-20 bg-cream rounded" />
      </div>
    )
  }

  if (!stats || stats.total === 0) return null

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 100) : 0

  const funnelSteps = [
    { label: 'Invited', value: stats.invited, total: stats.total, icon: Send, color: 'bg-blue-500' },
    { label: 'Opened', value: stats.opened, total: stats.invited, icon: MailOpen, color: 'bg-indigo-500' },
    { label: 'Responded', value: stats.responded, total: stats.invited, icon: UserCheck, color: 'bg-purple-500' },
    { label: 'Attending', value: stats.attending, total: stats.responded, icon: Users, color: 'bg-green-500' },
  ]

  const actions: { target: ReminderTarget; label: string; count: number; icon: typeof Send; desc: string }[] = [
    { target: 'not_sent', label: 'Send to uninvited', count: stats.total - stats.invited, icon: Send, desc: 'Send invites to guests not yet invited' },
    { target: 'not_opened', label: 'Remind unopened', count: stats.invited - stats.opened, icon: Mail, desc: 'Nudge guests who haven\'t opened their invite' },
    { target: 'not_responded', label: 'Nudge no-response', count: stats.invited - stats.responded - stats.declined, icon: Bell, desc: 'Remind guests who haven\'t responded yet' },
    { target: 'missing_meal', label: 'Request meal choice', count: stats.missing_meal, icon: UtensilsCrossed, desc: 'Ask attending guests to pick a meal' },
  ]

  return (
    <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-cream/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-black text-text-1">RSVP Tracker</h2>
            <p className="text-xs text-text-4 mt-0.5">
              {stats.attending} attending &middot; {stats.total_guests} total guests &middot; {stats.pending} pending
            </p>
          </div>
        </div>
        {collapsed ? (
          <ChevronDown className="h-5 w-5 text-text-4" />
        ) : (
          <ChevronUp className="h-5 w-5 text-text-4" />
        )}
      </button>

      {!collapsed && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-5">
          {/* Funnel */}
          <div className="space-y-3">
            {funnelSteps.map((step) => {
              const percentage = pct(step.value, step.total)
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
                    <step.icon className="h-4 w-4 text-text-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-text-2">{step.label}</span>
                      <span className="text-sm text-text-3">
                        <span className="font-bold text-text-1">{step.value}</span>
                        <span className="text-text-4">/{step.total}</span>
                        <span className="text-text-4 ml-1.5">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-cream-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${step.color}`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Declined + Total guests row */}
          <div className="flex gap-3">
            <div className="flex-1 bg-cream rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-black text-text-1">{stats.declined}</div>
              <div className="text-xs text-text-4 font-medium">Declined</div>
            </div>
            <div className="flex-1 bg-cream rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-black text-text-1">{stats.total_guests}</div>
              <div className="text-xs text-text-4 font-medium">Total guests</div>
            </div>
            <div className="flex-1 bg-cream rounded-xl px-4 py-3 text-center">
              <div className="text-xl font-black text-text-1">{stats.missing_meal}</div>
              <div className="text-xs text-text-4 font-medium">Missing meal</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {actions.map(action => {
              const isActive = sending === action.target
              const disabled = action.count === 0 || sending !== null
              return (
                <button
                  key={action.target}
                  onClick={() => sendReminder(action.target)}
                  disabled={disabled}
                  title={action.desc}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left
                    ${disabled
                      ? 'bg-cream text-text-4 cursor-not-allowed opacity-60'
                      : 'bg-cream hover:bg-brand/10 hover:text-brand text-text-2 cursor-pointer'
                    }`}
                >
                  {isActive ? (
                    <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
                  ) : (
                    <action.icon className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="flex-1">{action.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    action.count > 0 ? 'bg-brand/10 text-brand' : 'bg-cream-2 text-text-4'
                  }`}>
                    {action.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Last result banner */}
          {lastResult && (
            <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-xl px-4 py-2.5 font-medium">
              {lastResult}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
