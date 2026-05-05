'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AcceptResult = {
  event_id: string
  event_name: string
} | null

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AcceptResult>(null)

  useEffect(() => {
    async function acceptInvite() {
      try {
        const res = await fetch('/api/collaborators/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to accept invitation')
        }
        const data = await res.json()
        setResult({ event_id: data.event_id, event_name: data.event_name })
      } catch (err: any) {
        setError(err.message ?? 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    acceptInvite()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-3" />
          <p className="text-text-4">Accepting your invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-1 mb-2">Invitation Error</h1>
          <p className="text-text-4 mb-6">{error}</p>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md w-full text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-text-1 mb-2">You're In!</h1>
        <p className="text-text-4 mb-1">
          You have been added as a collaborator for:
        </p>
        <p className="text-lg font-semibold text-text-1 mb-6">
          {result?.event_name}
        </p>
        <Link href={`/events/${result?.event_id}`}>
          <Button className="bg-brand hover:bg-brand-hover">
            <PartyPopper className="h-4 w-4 mr-1" /> View Event
          </Button>
        </Link>
      </div>
    </div>
  )
}
