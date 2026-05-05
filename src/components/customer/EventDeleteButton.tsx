'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, X, AlertTriangle } from 'lucide-react'

export function EventDeleteButton({
  eventId,
  eventName,
  hasActivity,
}: {
  eventId: string
  eventName: string
  hasActivity: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) { setError('Something went wrong. Please try again.'); setLoading(false); return }
      const data = await res.json()
      if (data.deleted) {
        router.push('/dashboard')
        router.refresh()
      } else {
        // Cancelled — reload current page
        router.refresh()
        setOpen(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const action = hasActivity ? 'Cancel event' : 'Delete event'
  const destructiveClass = hasActivity
    ? 'bg-amber-600 hover:bg-amber-700'
    : 'bg-red-600 hover:bg-red-700'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-text-4 hover:text-red-600 transition-colors px-2 py-1 rounded-xl hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {action}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                className="text-text-4 hover:text-text-2 transition-colors mt-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h2 className="text-base font-black text-text-1 mb-1">{action}?</h2>
              {hasActivity ? (
                <p className="text-sm text-text-3 leading-relaxed">
                  <span className="font-semibold text-text-2">"{eventName}"</span> has vendor quotes or matches.
                  It will be marked as <span className="font-semibold text-amber-600">Cancelled</span> — vendors will be notified and all open requests will close.
                  The event record is kept for your reference.
                </p>
              ) : (
                <p className="text-sm text-text-3 leading-relaxed">
                  <span className="font-semibold text-text-2">"{eventName}"</span> has no vendor activity.
                  It will be <span className="font-semibold text-red-600">permanently deleted</span> and cannot be recovered.
                </p>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 border border-brand-border text-text-2 text-sm font-semibold py-2.5 rounded-xl hover:bg-cream transition-colors disabled:opacity-50"
              >
                Keep event
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 text-white text-sm font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60 ${destructiveClass}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    {hasActivity ? 'Cancelling…' : 'Deleting…'}
                  </span>
                ) : action}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
