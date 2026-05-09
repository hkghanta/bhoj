'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, Check, Users, MessageSquare } from 'lucide-react'

type HouseholdData = {
  id: string
  label: string
  declined: boolean
  rsvp_status: string | null
  rsvp_count: number | null
  meal_preference: string | null
  allergens: string[]
  rsvp_note: string | null
  responded_at: string | null
}

type RSVPData = {
  household: HouseholdData
  event: {
    event_name: string
    event_date: string
    city: string
    venue: string | null
    invite_image_url: string | null
    invite_message: string | null
    invite_theme: string | null
    dietary_options: string[]
    collect_allergens: boolean
  }
}

const THEMES: Record<string, { bg: string; accent: string; accentLight: string }> = {
  orange:  { bg: 'from-orange-950 via-orange-900 to-rose-900', accent: 'bg-orange-600', accentLight: 'bg-orange-50 border-orange-200 text-orange-700' },
  royal:   { bg: 'from-violet-950 via-purple-900 to-indigo-900', accent: 'bg-purple-600', accentLight: 'bg-purple-50 border-purple-200 text-purple-700' },
  emerald: { bg: 'from-emerald-950 via-teal-900 to-cyan-900', accent: 'bg-emerald-600', accentLight: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  rose:    { bg: 'from-rose-950 via-pink-900 to-fuchsia-900', accent: 'bg-rose-600', accentLight: 'bg-rose-50 border-rose-200 text-rose-700' },
  navy:    { bg: 'from-slate-950 via-blue-950 to-indigo-950', accent: 'bg-blue-600', accentLight: 'bg-blue-50 border-blue-200 text-blue-700' },
  maroon:  { bg: 'from-red-950 via-rose-950 to-orange-950', accent: 'bg-red-700', accentLight: 'bg-red-50 border-red-200 text-red-700' },
  slate:   { bg: 'from-slate-900 via-zinc-900 to-gray-900', accent: 'bg-slate-600', accentLight: 'bg-slate-50 border-slate-200 text-slate-700' },
  stone:   { bg: 'from-stone-900 via-stone-800 to-neutral-900', accent: 'bg-stone-600', accentLight: 'bg-stone-50 border-stone-200 text-stone-700' },
  gold:    { bg: 'from-yellow-950 via-amber-900 to-stone-900', accent: 'bg-amber-600', accentLight: 'bg-amber-50 border-amber-200 text-amber-700' },
}

const MEAL_OPTIONS: Record<string, { label: string; emoji: string }> = {
  NON_VEG:    { label: 'Non-Veg', emoji: '🍗' },
  VEGETARIAN: { label: 'Vegetarian', emoji: '🥦' },
  VEGAN:      { label: 'Vegan', emoji: '🌱' },
  JAIN:       { label: 'Jain', emoji: '🪷' },
  HALAL:      { label: 'Halal', emoji: '☪️' },
}

const ALLERGEN_OPTIONS = ['Nuts', 'Gluten', 'Dairy', 'Eggs', 'Shellfish', 'Soy']

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

  // Form state
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState(1)
  const [mealPref, setMealPref] = useState<string | null>(null)
  const [allergens, setAllergens] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const populateForm = useCallback((h: HouseholdData) => {
    if (h.rsvp_status) setRsvpStatus(h.rsvp_status)
    if (h.rsvp_count) setGuestCount(h.rsvp_count)
    if (h.meal_preference) setMealPref(h.meal_preference)
    if (h.allergens?.length) setAllergens(h.allergens)
    if (h.rsvp_note) setNote(h.rsvp_note)
  }, [])

  useEffect(() => {
    fetch(`/api/rsvp/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: RSVPData) => {
        setData(d)
        populateForm(d.household)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token, populateForm])

  const handleSubmit = async () => {
    if (!rsvpStatus) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rsvp_status: rsvpStatus,
          rsvp_count: rsvpStatus === 'not_attending' ? null : guestCount,
          meal_preference: rsvpStatus === 'not_attending' ? null : mealPref,
          allergens: rsvpStatus === 'not_attending' ? [] : allergens,
          rsvp_note: note || null,
        }),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()
      setData(prev => prev ? { ...prev, household: result.household } : prev)
      setSubmitted(true)
      setIsEditing(false)
    } catch {
      // silently handle — user can retry
    } finally {
      setSubmitting(false)
    }
  }

  const toggleAllergen = (a: string) => {
    setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

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
  const eventPast = isPast(new Date(event.event_date))
  const theme = THEMES[event.invite_theme ?? 'orange'] ?? THEMES.orange
  const hasResponded = !!household.responded_at
  const showForm = !eventPast && (!hasResponded || isEditing)
  const showDetails = rsvpStatus === 'attending' || rsvpStatus === 'maybe'

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
                <h1 className="text-3xl font-extrabold tracking-tight tracking-tight text-white">{event.event_name}</h1>
                <p className="text-white/80 text-sm mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.city}{event.venue ? ` \u00B7 ${event.venue}` : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className={`bg-gradient-to-br ${theme.bg} px-6 py-8 text-white`}>
              <div className="text-3xl mb-2">🪷</div>
              <h1 className="text-2xl font-bold">{event.event_name}</h1>
              <p className="text-white/80 text-sm mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.city}{event.venue ? ` \u00B7 ${event.venue}` : ''}
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

        {/* Success / Already responded state */}
        {hasResponded && !isEditing && !eventPast && (
          <div className="bg-white rounded-3xl shadow-sm border border-brand-border overflow-hidden">
            <div className="px-6 py-6 text-center">
              {submitted ? (
                <div className="animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Check className="h-8 w-8 text-green-600" strokeWidth={3} />
                  </div>
                  <p className="text-lg font-bold text-text-1 mb-1">Response recorded!</p>
                  <p className="text-sm text-text-4">Thank you for letting us know.</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-text-1 mb-2">Your current response</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
                    household.rsvp_status === 'attending'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : household.rsvp_status === 'maybe'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {household.rsvp_status === 'attending' && '✓ Attending'}
                    {household.rsvp_status === 'maybe' && '? Maybe'}
                    {household.rsvp_status === 'not_attending' && '✗ Not attending'}
                  </div>
                  {household.rsvp_count && (
                    <p className="text-xs text-text-4 mt-2">{household.rsvp_count} guest{household.rsvp_count > 1 ? 's' : ''}</p>
                  )}
                  {household.meal_preference && (
                    <p className="text-xs text-text-4 mt-0.5">
                      {MEAL_OPTIONS[household.meal_preference]?.emoji} {MEAL_OPTIONS[household.meal_preference]?.label ?? household.meal_preference}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={() => { setIsEditing(true); setSubmitted(false) }}
                className="mt-4 text-sm text-brand hover:underline font-medium"
              >
                Update your response
              </button>
            </div>
          </div>
        )}

        {/* RSVP Form */}
        {showForm && (
          <div className="bg-white rounded-3xl shadow-sm border border-brand-border overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h2 className="text-lg font-bold text-text-1">Will you be joining us?</h2>
              <p className="text-sm text-text-4 mt-0.5">We&apos;d love to know if you can make it</p>
            </div>

            {/* Status buttons */}
            <div className="px-6 py-4 grid grid-cols-3 gap-3">
              <button
                onClick={() => setRsvpStatus('attending')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  rsvpStatus === 'attending'
                    ? 'border-green-500 bg-green-50 shadow-sm scale-[1.02]'
                    : 'border-brand-border hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <span className="text-2xl">🎉</span>
                <span className={`text-xs font-semibold leading-tight text-center ${
                  rsvpStatus === 'attending' ? 'text-green-700' : 'text-text-3'
                }`}>Yes, I&apos;ll be there!</span>
              </button>

              <button
                onClick={() => setRsvpStatus('maybe')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  rsvpStatus === 'maybe'
                    ? 'border-amber-500 bg-amber-50 shadow-sm scale-[1.02]'
                    : 'border-brand-border hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                <span className="text-2xl">🤔</span>
                <span className={`text-xs font-semibold leading-tight text-center ${
                  rsvpStatus === 'maybe' ? 'text-amber-700' : 'text-text-3'
                }`}>Maybe</span>
              </button>

              <button
                onClick={() => setRsvpStatus('not_attending')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  rsvpStatus === 'not_attending'
                    ? 'border-red-400 bg-red-50 shadow-sm scale-[1.02]'
                    : 'border-brand-border hover:border-red-300 hover:bg-red-50/50'
                }`}
              >
                <span className="text-2xl">😔</span>
                <span className={`text-xs font-semibold leading-tight text-center ${
                  rsvpStatus === 'not_attending' ? 'text-red-600' : 'text-text-3'
                }`}>Sorry, can&apos;t make it</span>
              </button>
            </div>

            {/* Additional fields for attending/maybe */}
            {showDetails && (
              <div className="px-6 pb-2 space-y-5 animate-in slide-in-from-top-2 fade-in duration-300">
                {/* Guest count */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-text-1 mb-2">
                    <Users className="h-4 w-4 text-text-4" />
                    How many guests?
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuestCount(c => Math.max(1, c - 1))}
                      className="w-10 h-10 rounded-xl border border-brand-border text-text-3 hover:bg-cream transition-colors text-lg font-medium"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold text-text-1 w-8 text-center">{guestCount}</span>
                    <button
                      onClick={() => setGuestCount(c => Math.min(10, c + 1))}
                      className="w-10 h-10 rounded-xl border border-brand-border text-text-3 hover:bg-cream transition-colors text-lg font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Meal preference */}
                {event.dietary_options?.length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-text-1 mb-2 block">Meal preference</label>
                    <div className="grid grid-cols-2 gap-2">
                      {event.dietary_options.map(opt => {
                        const info = MEAL_OPTIONS[opt]
                        if (!info) return null
                        const selected = mealPref === opt
                        return (
                          <button
                            key={opt}
                            onClick={() => setMealPref(selected ? null : opt)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                              selected
                                ? `${theme.accentLight} border-current font-semibold`
                                : 'border-brand-border hover:border-text-4/40 text-text-3'
                            }`}
                          >
                            <span className="text-lg">{info.emoji}</span>
                            <span className="text-sm">{info.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Allergens */}
                {event.collect_allergens && (
                  <div>
                    <label className="text-sm font-semibold text-text-1 mb-2 block">Any allergies?</label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGEN_OPTIONS.map(a => {
                        const active = allergens.includes(a)
                        return (
                          <button
                            key={a}
                            onClick={() => toggleAllergen(a)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                              active
                                ? 'bg-red-50 border-red-300 text-red-700 font-medium'
                                : 'border-brand-border text-text-4 hover:border-text-4/40'
                            }`}
                          >
                            {active && <span className="mr-1">✓</span>}
                            {a}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-text-1 mb-2">
                    <MessageSquare className="h-4 w-4 text-text-4" />
                    Message for the hosts
                    <span className="text-text-4 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    placeholder="Can't wait to celebrate with you!"
                    className="w-full rounded-xl border border-brand-border bg-cream/50 px-3 py-2.5 text-sm text-text-1 placeholder:text-text-4/60 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                  />
                </div>
              </div>
            )}

            {/* Note for not_attending */}
            {rsvpStatus === 'not_attending' && (
              <div className="px-6 pb-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-text-1 mb-2">
                  <MessageSquare className="h-4 w-4 text-text-4" />
                  Message for the hosts
                  <span className="text-text-4 font-normal">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  placeholder="Wishing you all the best!"
                  className="w-full rounded-xl border border-brand-border bg-cream/50 px-3 py-2.5 text-sm text-text-1 placeholder:text-text-4/60 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                />
              </div>
            )}

            {/* Submit */}
            {rsvpStatus && (
              <div className="px-6 py-5">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`w-full py-3 rounded-2xl text-white font-semibold text-sm transition-all shadow-sm disabled:opacity-60 ${
                    rsvpStatus === 'attending'
                      ? 'bg-green-600 hover:bg-green-700 active:scale-[0.98]'
                      : rsvpStatus === 'maybe'
                      ? 'bg-amber-600 hover:bg-amber-700 active:scale-[0.98]'
                      : 'bg-red-500 hover:bg-red-600 active:scale-[0.98]'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    hasResponded ? 'Update response' : 'Send RSVP'
                  )}
                </button>
                {isEditing && (
                  <button
                    onClick={() => { setIsEditing(false); populateForm(household) }}
                    className="w-full mt-2 py-2 text-sm text-text-4 hover:text-text-3"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-text-4">
            Powered by{' '}
            <Link href="/" className="text-brand hover:underline font-medium">OneSeva</Link>
            {' '}&middot; Planning your own event?{' '}
            <Link href="/" className="text-brand hover:underline">Get started &rarr;</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
