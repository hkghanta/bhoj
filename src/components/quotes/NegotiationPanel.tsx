'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeftRight, Send, User, Store, Clock, Loader2,
  MessageSquare, DollarSign, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type NegotiationEntry = {
  id: string
  sender_id: string
  sender_type: 'CUSTOMER' | 'VENDOR'
  message: string | null
  suggested_total: number | null
  suggested_per_head: number | null
  action_type: 'COUNTER_OFFER' | 'MENU_CHANGE' | 'REVISION' | 'MESSAGE'
  created_at: string
}

type Props = {
  quoteId: string
  quoteStatus: string
  vendorName: string
  currentTotal: number
  currentPerHead: number | null
}

const ACTION_BADGE: Record<string, { label: string; cls: string }> = {
  COUNTER_OFFER: { label: 'Counter-Offer', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  MENU_CHANGE: { label: 'Menu Change', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  REVISION: { label: 'Revision', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  MESSAGE: { label: 'Message', cls: 'bg-cream text-text-3 border-brand-border' },
}

const NEGOTIABLE = ['SENT', 'VIEWED', 'NEGOTIATING']

export default function NegotiationPanel({
  quoteId, quoteStatus, vendorName, currentTotal, currentPerHead,
}: Props) {
  const [entries, setEntries] = useState<NegotiationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [suggestedTotal, setSuggestedTotal] = useState(String(currentTotal))
  const [suggestedPerHead, setSuggestedPerHead] = useState(currentPerHead ? String(currentPerHead) : '')
  const [message, setMessage] = useState('')
  const [timelineOpen, setTimelineOpen] = useState(true)

  const canNegotiate = NEGOTIABLE.includes(quoteStatus)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/negotiations`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [quoteId])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const body: Record<string, unknown> = {}
      const totalNum = parseFloat(suggestedTotal)
      if (!isNaN(totalNum) && totalNum > 0 && totalNum !== currentTotal) {
        body.suggested_total = totalNum
      }
      const pphNum = parseFloat(suggestedPerHead)
      if (!isNaN(pphNum) && pphNum > 0) {
        body.suggested_per_head = pphNum
      }
      if (message.trim()) {
        body.message = message.trim()
      }

      const res = await fetch(`/api/quotes/${quoteId}/counter-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setFormOpen(false)
        setMessage('')
        await fetchHistory()
      }
    } catch { /* ignore */ }
    setSending(false)
  }

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-amber-600" />
          <h2 className="font-semibold text-text-1">Negotiation</h2>
          {quoteStatus === 'NEGOTIATING' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
              Negotiating
            </span>
          )}
        </div>
        {canNegotiate && !formOpen && (
          <Button
            size="sm"
            onClick={() => setFormOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 gap-1.5"
          >
            <DollarSign className="h-3.5 w-3.5" />
            Negotiate Price
          </Button>
        )}
      </div>

      {/* Counter-offer form */}
      {formOpen && canNegotiate && (
        <form onSubmit={handleSubmit} className="bg-amber-50/50 rounded-lg border border-amber-100 p-4 space-y-3">
          <div className="text-sm text-text-2 font-medium">
            Current price: <span className="text-amber-700 font-bold">{fmt(currentTotal)}</span>
            {currentPerHead !== null && (
              <span className="text-text-4 ml-2">({fmt(currentPerHead)}/head)</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-3 block mb-1">Suggested Total</label>
              <input
                type="number"
                step="1"
                min="0"
                value={suggestedTotal}
                onChange={e => setSuggestedTotal(e.target.value)}
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-3 block mb-1">Suggested Per Head <span className="text-text-4">(optional)</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={suggestedPerHead}
                onChange={e => setSuggestedPerHead(e.target.value)}
                placeholder="—"
                className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-3 block mb-1">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Tell the vendor why you'd like a different price..."
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={sending} size="sm" className="bg-amber-600 hover:bg-amber-700 gap-1.5">
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? 'Sending...' : 'Send Counter-Offer'}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Negotiation timeline */}
      {loading ? (
        <div className="text-sm text-text-4 flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-text-4 py-2">No negotiation history yet.</p>
      ) : (
        <div>
          <button
            onClick={() => setTimelineOpen(o => !o)}
            className="flex items-center gap-1.5 text-sm font-medium text-text-3 hover:text-text-1 mb-3"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            History ({entries.length})
            {timelineOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {timelineOpen && (
            <div className="space-y-3">
              {entries.map(entry => {
                const isCustomer = entry.sender_type === 'CUSTOMER'
                const badge = ACTION_BADGE[entry.action_type] ?? ACTION_BADGE.MESSAGE

                return (
                  <div
                    key={entry.id}
                    className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-2.5 max-w-[85%] ${isCustomer ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCustomer ? 'bg-cream' : 'bg-cream'
                      }`}>
                        {isCustomer
                          ? <User className="h-3.5 w-3.5 text-brand" />
                          : <Store className="h-3.5 w-3.5 text-text-3" />
                        }
                      </div>
                      <div className={`rounded-xl px-3.5 py-2.5 ${
                        isCustomer ? 'bg-cream border border-brand' : 'bg-cream border border-brand-border'
                      }`}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium text-text-2">
                            {isCustomer ? 'You' : vendorName}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>

                        {(entry.suggested_total || entry.suggested_per_head) && (
                          <div className="flex items-center gap-3 text-sm mb-1">
                            {entry.suggested_total && (
                              <span className="font-semibold text-text-1">
                                {fmt(Number(entry.suggested_total))}
                              </span>
                            )}
                            {entry.suggested_per_head && (
                              <span className="text-text-4">
                                {fmt(Number(entry.suggested_per_head))}/head
                              </span>
                            )}
                          </div>
                        )}

                        {entry.message && (
                          <p className="text-sm text-text-3 leading-relaxed">{entry.message}</p>
                        )}

                        <div className="flex items-center gap-1 mt-1.5 text-xs text-text-4">
                          <Clock className="h-2.5 w-2.5" />
                          {relativeTime(entry.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
