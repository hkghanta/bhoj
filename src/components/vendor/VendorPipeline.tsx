'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Kanban, MoveHorizontal, StickyNote, Calendar, DollarSign, Loader2, X } from 'lucide-react'

type PipelineCard = {
  id: string
  customer_name: string
  event_name: string | null
  stage: string
  quote_amount: number | null
  follow_up_date: string | null
  notes: string | null
}

const STAGES = [
  'Inquiry',
  'Proposal Sent',
  'Tasting Scheduled',
  'Negotiating',
  'Contract Sent',
  'Booked',
  'In Progress',
  'Completed',
  'Lost',
]

export function VendorPipeline() {
  const [cards, setCards] = useState<PipelineCard[]>([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [detailCard, setDetailCard] = useState<PipelineCard | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editFollowUp, setEditFollowUp] = useState('')
  const [saving, setSaving] = useState(false)
  const dragCardRef = useRef<string | null>(null)

  function showAlertMsg(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3000)
  }

  async function fetchCards() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/pipeline')
      if (!res.ok) throw new Error('Failed to load')
      setCards(await res.json())
    } catch {
      showAlertMsg('error', 'Failed to load pipeline')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCards() }, [])

  async function moveCard(cardId: string, newStage: string) {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, stage: newStage } : c))
    try {
      const res = await fetch(`/api/vendor/pipeline/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      if (!res.ok) throw new Error('Failed to move')
    } catch {
      showAlertMsg('error', 'Failed to move card')
      fetchCards()
    }
  }

  async function saveCardDetails() {
    if (!detailCard) return
    setSaving(true)
    try {
      const res = await fetch(`/api/vendor/pipeline/${detailCard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNotes || null, follow_up_date: editFollowUp || null }),
      })
      if (!res.ok) throw new Error('Failed to save')
      showAlertMsg('success', 'Updated')
      setCards(prev => prev.map(c => c.id === detailCard.id ? { ...c, notes: editNotes || null, follow_up_date: editFollowUp || null } : c))
      setDetailCard(null)
    } catch (err: any) {
      showAlertMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  function openDetail(card: PipelineCard) {
    setDetailCard(card)
    setEditNotes(card.notes ?? '')
    setEditFollowUp(card.follow_up_date ?? '')
  }

  const handleDragStart = useCallback((cardId: string) => {
    dragCardRef.current = cardId
  }, [])

  const handleDrop = useCallback((stage: string) => {
    if (dragCardRef.current) {
      moveCard(dragCardRef.current, stage)
      dragCardRef.current = null
    }
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-text-4" /></div>
  }

  const inputCls = 'w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none'

  return (
    <div>
      {alert && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Kanban className="h-10 w-10 text-text-4 mx-auto mb-3" />
          <p className="text-text-4">No pipeline cards yet. Leads will appear here as inquiries come in.</p>
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageCards = cards.filter(c => c.stage === stage)
            return (
              <div
                key={stage}
                className="min-w-[260px] flex-shrink-0"
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
              >
                <div className="bg-cream rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-bold text-text-2">{stage}</h3>
                    <span className="text-xs bg-white rounded-full px-2 py-0.5 text-text-4 border">{stageCards.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px]">
                    {stageCards.map(card => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => handleDragStart(card.id)}
                        onClick={() => openDetail(card)}
                        className="bg-white rounded-xl border border-brand-border p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm font-medium text-text-1">{card.customer_name}</p>
                        {card.event_name && <p className="text-xs text-text-4">{card.event_name}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-4">
                          {card.quote_amount != null && (
                            <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />{card.quote_amount.toLocaleString()}</span>
                          )}
                          {card.follow_up_date && (
                            <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{card.follow_up_date}</span>
                          )}
                        </div>
                        {card.notes && (
                          <div className="flex items-start gap-1 mt-1.5 text-xs text-text-4">
                            <StickyNote className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{card.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {detailCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md relative">
            <button onClick={() => setDetailCard(null)} className="absolute right-4 top-4 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
            <h3 className="text-xl font-black text-text-1 mb-1">{detailCard.customer_name}</h3>
            {detailCard.event_name && <p className="text-sm text-text-4 mb-4">{detailCard.event_name}</p>}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Notes</label>
                <textarea rows={3} className={inputCls} value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-2 mb-1">Follow-up Date</label>
                <input type="date" className={inputCls} value={editFollowUp} onChange={e => setEditFollowUp(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailCard(null)}>Cancel</Button>
                <Button onClick={saveCardDetails} disabled={saving} className="bg-brand hover:bg-brand-hover">{saving ? 'Saving...' : 'Save'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
