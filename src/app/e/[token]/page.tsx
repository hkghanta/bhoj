'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

type Attendee = { name?: string; dietary_type: string; allergens: string[] }
type SubEvent = { id: string; name: string; event_date: string; venue: string | null }
type Invite = { id: string; sub_event: SubEvent; responded_at: string | null; attendees: Attendee[] }
type RSVPData = {
  household: { id: string; label: string; declined: boolean }
  event: { event_name: string; city: string; venue: string | null; invite_image_url: string | null; invite_message: string | null; invite_theme: string | null; dietary_options: string[]; collect_allergens: boolean }
  invites: Invite[]
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

const DIETARY_OPTIONS = [
  { value: 'NON_VEG',    label: 'Non-Veg',    emoji: '🍗', color: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'VEGETARIAN', label: 'Vegetarian', emoji: '🥦', color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'VEGAN',      label: 'Vegan',      emoji: '🌱', color: 'border-teal-400 bg-teal-50 text-teal-700' },
  { value: 'JAIN',       label: 'Jain',       emoji: '🪷', color: 'border-brand bg-cream text-brand' },
  { value: 'HALAL',      label: 'Halal',      emoji: '☪️', color: 'border-purple-400 bg-purple-50 text-purple-700' },
]

const ALLERGENS = [
  { key: 'nut_free',    label: 'Nut-free' },
  { key: 'gluten_free', label: 'Gluten-free' },
  { key: 'dairy_free',  label: 'Dairy-free' },
  { key: 'egg_free',    label: 'Egg-free' },
]

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

function AttendeeRow({ index, value, onChange, allowedDietary, collectAllergens }: {
  index: number; value: Attendee; onChange: (a: Attendee) => void; allowedDietary: string[]; collectAllergens: boolean
}) {
  const visibleOptions = DIETARY_OPTIONS.filter(o => allowedDietary.includes(o.value))
  return (
    <div className="bg-cream rounded-2xl p-4 space-y-3">
      <p className="text-xs font-semibold text-text-4 uppercase tracking-wide">Guest {index + 1}</p>
      <input
        type="text"
        placeholder="Name (optional)"
        value={value.name ?? ''}
        onChange={e => onChange({ ...value, name: e.target.value })}
        className="w-full text-sm border border-brand-border rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {visibleOptions.length > 0 && (
      <div>
        <p className="text-xs text-text-4 mb-1.5">Meal preference</p>
        <div className="flex flex-wrap gap-1.5">
          {visibleOptions.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => onChange({ ...value, dietary_type: opt.value })}
              className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all font-medium ${
                value.dietary_type === opt.value ? opt.color : 'border-brand-border text-text-4 bg-white'
              }`}>
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>
      )}
      {collectAllergens && (
      <div>
        <p className="text-xs text-text-4 mb-1.5">Any allergy or dietary needs?</p>
        <div className="flex flex-wrap gap-1.5">
          {ALLERGENS.map(a => (
            <button key={a.key} type="button"
              onClick={() => {
                const allergens = value.allergens.includes(a.key)
                  ? value.allergens.filter(x => x !== a.key)
                  : [...value.allergens, a.key]
                onChange({ ...value, allergens })
              }}
              className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all ${
                value.allergens.includes(a.key)
                  ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                  : 'border-brand-border text-text-4 bg-white'
              }`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}

function InviteSection({ invite, token, householdToken, allowedDietary, collectAllergens }: { invite: Invite; token: string; householdToken: string; allowedDietary: string[]; collectAllergens: boolean }) {
  const alreadyResponded = !!invite.responded_at
  const eventPast = isPast(new Date(invite.sub_event.event_date))
  const [count, setCount] = useState(alreadyResponded ? invite.attendees.length : 1)
  const [attendees, setAttendees] = useState<Attendee[]>(
    alreadyResponded ? invite.attendees : [{ dietary_type: 'NON_VEG', allergens: [] }]
  )
  const [submitting, setSubmitting] = useState(false)
  const [declined, setDeclined] = useState(false)
  const [submitted, setSubmitted] = useState(alreadyResponded)
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(!alreadyResponded)

  function updateCount(n: number) {
    const clamped = Math.max(1, Math.min(20, n))
    setCount(clamped)
    setAttendees(prev => {
      if (clamped > prev.length) return [...prev, ...Array(clamped - prev.length).fill({ dietary_type: 'NON_VEG', allergens: [] })]
      return prev.slice(0, clamped)
    })
  }

  async function submit() {
    setSubmitting(true)
    const res = await fetch(`/api/rsvp/${householdToken}/${invite.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendees }),
    })
    if (res.ok) { setSubmitted(true); setEditing(false); setExpanded(false) }
    setSubmitting(false)
  }

  async function decline() {
    setSubmitting(true)
    await fetch(`/api/rsvp/${householdToken}/${invite.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendees: [], declined: true }),
    })
    setDeclined(true)
    setSubmitting(false)
  }

  const mapsUrl = invite.sub_event.venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invite.sub_event.venue)}`
    : null

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-brand-border overflow-hidden">
      {/* Sub-event header */}
      <div
        className="px-6 py-4 flex items-start justify-between cursor-pointer"
        onClick={() => !eventPast && setExpanded(e => !e)}
      >
        <div className="flex-1">
          <h3 className="text-base font-bold text-text-1">{invite.sub_event.name}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-text-4">
              <Calendar className="h-3 w-3" />
              {format(new Date(invite.sub_event.event_date), 'EEEE, MMMM d, yyyy')}
            </span>
            <span className="flex items-center gap-1 text-xs text-text-4">
              <Clock className="h-3 w-3" />
              {format(new Date(invite.sub_event.event_date), 'h:mm a')}
            </span>
            {invite.sub_event.venue && (
              <span className="flex items-center gap-1 text-xs text-text-4">
                <MapPin className="h-3 w-3" />
                {invite.sub_event.venue}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Countdown date={invite.sub_event.event_date} />
            {declined ? (
              <span className="text-xs bg-cream text-text-4 px-2.5 py-0.5 rounded-full font-medium">Not attending</span>
            ) : submitted && !editing ? (
              <span className="text-xs bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-medium">
                ✓ {attendees.length} {attendees.length === 1 ? 'guest' : 'guests'} confirmed
              </span>
            ) : !eventPast ? (
              <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-medium">Awaiting RSVP</span>
            ) : null}
          </div>
        </div>
        {!eventPast && (
          <div className="ml-3 mt-1">
            {expanded ? <ChevronUp className="h-4 w-4 text-text-4" /> : <ChevronDown className="h-4 w-4 text-text-4" />}
          </div>
        )}
      </div>

      {/* Declined — allow changing mind */}
      {declined && !eventPast && (
        <div className="px-6 pb-5 border-t border-brand-border pt-4">
          <p className="text-sm text-text-4 mb-3">Changed your mind?</p>
          <button
            onClick={() => { setDeclined(false); setExpanded(true) }}
            className="text-sm font-semibold text-brand hover:underline">
            I can actually make it →
          </button>
        </div>
      )}

      {/* RSVP form */}
      {expanded && !eventPast && !declined && (
        <div className="px-6 pb-6 space-y-4 border-t border-brand-border pt-4">
          {submitted && !editing ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-sm text-green-800 font-medium">
                ✓ You're confirmed for {invite.sub_event.name}!
              </div>
              <div className="flex flex-wrap gap-1.5">
                {attendees.map((a, i) => (
                  <span key={i} className="text-xs bg-cream text-text-2 px-2.5 py-1 rounded-full">
                    {a.name || `Guest ${i + 1}`} · {DIETARY_OPTIONS.find(d => d.value === a.dietary_type)?.label}
                    {a.allergens.length > 0 && ` · ${a.allergens.join(', ')}`}
                  </span>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={() => { setEditing(true); setExpanded(true) }} className="text-sm text-brand hover:underline font-medium">
                  Edit response
                </button>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-text-4 hover:text-brand">
                    <ExternalLink className="h-3.5 w-3.5" /> Directions
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Guest count */}
              <div>
                <p className="text-sm font-semibold text-text-2 mb-2">How many guests are attending?</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => updateCount(count - 1)}
                    className="w-10 h-10 rounded-full border-2 border-brand-border text-text-3 hover:border-brand hover:text-brand font-bold text-xl transition-colors">
                    −
                  </button>
                  <span className="text-3xl font-bold text-text-1 w-8 text-center">{count}</span>
                  <button onClick={() => updateCount(count + 1)}
                    className="w-10 h-10 rounded-full border-2 border-brand-border text-text-3 hover:border-brand hover:text-brand font-bold text-xl transition-colors">
                    +
                  </button>
                </div>
              </div>

              {/* Attendee rows */}
              <div className="space-y-3">
                {attendees.map((a, i) => (
                  <AttendeeRow key={i} index={i} value={a} allowedDietary={allowedDietary} collectAllergens={collectAllergens} onChange={updated =>
                    setAttendees(prev => prev.map((x, idx) => idx === i ? updated : x))
                  } />
                ))}
              </div>

              {/* Actions */}
              <button onClick={submit} disabled={submitting}
                className="w-full py-3.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white rounded-2xl font-bold text-sm transition-colors shadow-sm">
                {submitting ? 'Confirming…' : `Confirm attendance →`}
              </button>
              <button onClick={decline} disabled={submitting}
                className="w-full py-2.5 border-2 border-brand-border hover:border-brand-border text-text-4 hover:text-text-2 rounded-2xl font-medium text-sm transition-colors">
                I can't make it
              </button>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-sm text-text-4 hover:text-brand transition-colors">
                  <MapPin className="h-3.5 w-3.5" /> Get directions to venue
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {eventPast && (
        <div className="px-6 pb-4 text-sm text-text-4 border-t border-brand-border pt-3">
          This occasion has already taken place.
        </div>
      )}
    </div>
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

  const { household, event, invites } = data!

  if (household.declined) return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-cream flex items-center justify-center px-4">
      <div className="text-center max-w-xs">
        <div className="text-5xl mb-4">🙏</div>
        <p className="text-lg font-semibold text-text-1 mb-1">You're marked as unable to attend</p>
        <p className="text-sm text-text-4">If this is a mistake, please contact the host to update your invitation.</p>
      </div>
    </div>
  )

  const nextEvent = invites
    .map(i => i.sub_event)
    .filter(se => !isPast(new Date(se.event_date)))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0]

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
              You're invited, <span className="text-brand">{household.label}</span>! 🎉
            </p>
            {nextEvent && (
              <p className="text-xs text-text-4">
                Next: {format(new Date(nextEvent.event_date), 'MMMM d, yyyy')} · {formatDistanceToNow(new Date(nextEvent.event_date), { addSuffix: true })}
              </p>
            )}
            {event.invite_message && (
              <p className="text-sm text-text-3 mt-3 italic leading-relaxed border-l-3 border-brand pl-3">
                &ldquo;{event.invite_message}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* RSVP cards */}
        <div className="space-y-3">
          {invites.map(invite => (
            <InviteSection key={invite.id} invite={invite} token={token} householdToken={token} allowedDietary={event.dietary_options} collectAllergens={event.collect_allergens} />
          ))}
        </div>

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
