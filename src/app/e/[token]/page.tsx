'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, Clock } from 'lucide-react'

type RSVPData = {
  household: { id: string; label: string; declined: boolean }
  event: { event_name: string; event_date: string; city: string; venue: string | null; invite_image_url: string | null; invite_message: string | null; invite_theme: string | null; dietary_options: string[]; collect_allergens: boolean }
}

const THEMES: Record<string, { bg: string }> = {
  orange:  { bg: 'from-orange-950 via-orange-900 to-rose-900' },
  royal:   { bg: 'from-violet-950 via-purple-900 to-indigo-900' },
  emerald: { bg: 'from-emerald-950 via-teal-900 to-cyan-900' },
  rose:    { bg: 'from-rose-950 via-pink-900 to-fuchsia-900' },
  navy:    { bg: 'from-slate-950 via-blue-950 to-indigo-950' },
  maroon:  { bg: 'from-red-950 via-rose-950 to-orange-950' },
  slate:   { bg: 'from-slate-900 via-zinc-900 to-gray-900' },
  stone:   { bg: 'from-stone-900 via-stone-800 to-neutral-900' },
  gold:    { bg: 'from-yellow-950 via-amber-900 to-stone-900' },
}

function Countdown({ date }: { date: string }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  if (isPast(new Date(date))) return null
  return (
    <span className="text-xs text-brand font-medium bg-cream border border-brand px-2 py-0.5 rounded-full">
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  )
}

export default function RSVPPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<RSVPData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/rsvp/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-cream flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-cream flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">💌</div>
        <p className="text-lg font-semibold text-text-1 mb-1">Invitation not found</p>
        <p className="text-sm text-text-4">This link is invalid or has expired.</p>
      </div>
    </div>
  )

  const { household, event } = data!

  if (household.declined) return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-cream flex items-center justify-center px-4">
      <div className="text-center max-w-xs">
        <div className="text-5xl mb-4">🙏</div>
        <p className="text-lg font-semibold text-text-1 mb-1">You&apos;re marked as unable to attend</p>
        <p className="text-sm text-text-4">If this is a mistake, please contact the host to update your invitation.</p>
      </div>
    </div>
  )

  const eventPast = isPast(new Date(event.event_date))

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-cream py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Hero card */}
        <div className="bg-white rounded-3xl shadow-sm border border-brand-border overflow-hidden">
          {event.invite_image_url ? (
            <div className="relative w-full h-64">
              <Image src={event.invite_image_url} alt="Invitation" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h1 className="text-3xl font-black tracking-tight text-white">{event.event_name}</h1>
                <p className="text-white/80 text-sm mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.city}{event.venue ? ` · ${event.venue}` : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className={`bg-gradient-to-br ${(THEMES[event.invite_theme ?? 'orange'] ?? THEMES.orange).bg} px-6 py-8 text-white`}>
              <div className="text-3xl mb-2">🪷</div>
              <h1 className="text-2xl font-bold">{event.event_name}</h1>
              <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.city}{event.venue ? ` · ${event.venue}` : ''}
              </p>
            </div>
          )}

          <div className="px-6 py-5">
            <p className="text-sm font-semibold text-text-1 mb-0.5">
              You&apos;re invited, <span className="text-brand">{household.label}</span>! 🎉
            </p>
            {!eventPast && (
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs text-text-4">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                </span>
                <Countdown date={event.event_date} />
              </div>
            )}
            {event.invite_message && (
              <p className="text-sm text-text-3 mt-3 italic leading-relaxed border-l-3 border-brand pl-3">
                &ldquo;{event.invite_message}&rdquo;
              </p>
            )}
          </div>
        </div>

        {eventPast && (
          <div className="bg-white rounded-3xl shadow-sm border border-brand-border px-6 py-4 text-sm text-text-4">
            This event has already taken place.
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-text-4">
            Powered by{' '}
            <Link href="/" className="text-brand hover:underline font-medium">OneSeva</Link>
            {' '}· Planning your own event?{' '}
            <Link href="/" className="text-brand hover:underline">Get started →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
