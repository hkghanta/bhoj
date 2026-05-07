'use client'

import { useState } from 'react'
import { MapPin, Calendar, Clock, ChevronDown, ChevronUp, Heart, Send } from 'lucide-react'

type SubEvent = {
  id: string
  name: string
  date: string
  venue: string | null
  notes: string | null
}

type RsvpData = {
  householdLabel: string
  token: string
  declined: boolean
  invites: never[]
}

type Props = {
  eventName: string
  eventDate: string
  city: string
  venue: string
  heroPhoto: string | null
  ourStory: string | null
  travelInfo: string | null
  accommodation: string | null
  faq: { question: string; answer: string }[]
  colors: { primary?: string; secondary?: string; accent?: string }
  template: string
  subEvents: SubEvent[]
  rsvp?: RsvpData
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function PublicEventWebsite({
  eventName,
  eventDate,
  city,
  venue,
  heroPhoto,
  ourStory,
  travelInfo,
  accommodation,
  faq,
  colors,
  template,
  subEvents,
  rsvp,
}: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const primary = colors.primary || '#c2410c'
  const secondary = colors.secondary || '#1e293b'
  const accent = colors.accent || '#f97316'
  const days = daysUntil(eventDate)

  const hasContent = ourStory || travelInfo || accommodation || subEvents.length > 0 || faq.length > 0 || rsvp

  return (
    <div className="min-h-screen bg-white dark:bg-cream-2" style={{ '--color-primary': primary, '--color-secondary': secondary, '--color-accent': accent } as React.CSSProperties}>

      {/* ── HERO ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6"
        style={{
          minHeight: heroPhoto ? '80vh' : '50vh',
          background: heroPhoto
            ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${heroPhoto}) center/cover no-repeat`
            : `linear-gradient(135deg, ${primary}, ${secondary})`,
        }}
      >
        <div className="relative z-10 max-w-2xl">
          {rsvp ? (
            <p className="text-white/90 text-sm uppercase tracking-[0.2em] mb-4 font-medium">
              Welcome, {rsvp.householdLabel}
            </p>
          ) : (
            <p className="text-white/80 text-sm uppercase tracking-[0.3em] mb-4 font-medium">You&apos;re Invited</p>
          )}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6"
            style={{ fontFamily: template === 'royal' ? 'Georgia, serif' : template === 'modern' ? 'system-ui, sans-serif' : 'Georgia, serif' }}
          >
            {eventName}
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/90 text-lg">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {formatDate(eventDate)}
            </span>
            {(city || venue) && (
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {[venue, city].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          {days > 0 && (
            <div className="mt-8 inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <Heart className="h-4 w-4 text-white" />
              <span className="text-white font-medium">{days} day{days !== 1 ? 's' : ''} to go</span>
            </div>
          )}
          {rsvp && (
            <div className="mt-4">
              <a href="#rsvp" className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-full transition-colors" style={{ background: accent }}>
                <Send className="h-4 w-4" /> RSVP Now
              </a>
            </div>
          )}
        </div>
      </section>

      {!hasContent && (
        <section className="py-20 text-center">
          <p className="text-text-4 text-lg">More details coming soon...</p>
        </section>
      )}

      {/* ── RSVP SECTION (personalized) ── */}
      {rsvp && (
        <section id="rsvp" className="py-16 sm:py-24 px-6" style={{ background: `${accent}10` }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-3" style={{ color: secondary }}>
              RSVP
            </h2>
            <p className="text-center text-text-4 mb-10">
              Hi {rsvp.householdLabel}, please let us know if you can make it!
            </p>

            {rsvp.declined ? (
              <div className="bg-white dark:bg-cream-2 rounded-2xl p-8 text-center border border-brand-border shadow-sm">
                <p className="text-text-4">You have declined this invitation.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-cream-2 rounded-2xl p-8 text-center border border-brand-border shadow-sm">
                <p className="text-text-3">
                  We look forward to seeing you at the event!
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── OUR STORY ── */}
      {ourStory && (
        <section className="py-16 sm:py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8" style={{ color: secondary }}>Our Story</h2>
            <div className="h-px w-16 mx-auto mb-8" style={{ background: accent }} />
            <p className="text-text-3 leading-relaxed text-lg whitespace-pre-line">{ourStory}</p>
          </div>
        </section>
      )}

      {/* ── SCHEDULE / SUB-EVENTS ── */}
      {subEvents.length > 0 && (
        <section className="py-16 sm:py-24 px-6" style={{ background: `${primary}08` }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: secondary }}>Wedding Events</h2>
            <div className="space-y-6">
              {subEvents.map((se) => (
                <div
                  key={se.id}
                  className="bg-white dark:bg-cream-2 rounded-2xl p-6 shadow-sm border border-brand-border flex flex-col sm:flex-row gap-4"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white shrink-0"
                    style={{ background: primary }}
                  >
                    <span className="text-xs font-bold uppercase">
                      {new Date(se.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {new Date(se.date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold" style={{ color: secondary }}>{se.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-sm text-text-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(se.date)}
                      </span>
                      {se.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {se.venue}
                        </span>
                      )}
                    </div>
                    {se.notes && <p className="text-text-3 text-sm mt-2">{se.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TRAVEL & ACCOMMODATION ── */}
      {(travelInfo || accommodation) && (
        <section className="py-16 sm:py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: secondary }}>Travel & Stay</h2>
            <div className="grid sm:grid-cols-2 gap-8">
              {travelInfo && (
                <div className="bg-cream rounded-2xl p-6">
                  <h3 className="font-semibold text-lg mb-3" style={{ color: primary }}>Getting There</h3>
                  <p className="text-text-3 leading-relaxed whitespace-pre-line">{travelInfo}</p>
                </div>
              )}
              {accommodation && (
                <div className="bg-cream rounded-2xl p-6">
                  <h3 className="font-semibold text-lg mb-3" style={{ color: primary }}>Where to Stay</h3>
                  <p className="text-text-3 leading-relaxed whitespace-pre-line">{accommodation}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQs ── */}
      {faq.length > 0 && (
        <section className="py-16 sm:py-24 px-6" style={{ background: `${primary}08` }}>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: secondary }}>FAQs</h2>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <div key={i} className="bg-white dark:bg-cream-2 rounded-xl border border-brand-border overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium" style={{ color: secondary }}>{item.question}</span>
                    {openFaq === i ? (
                      <ChevronUp className="h-4 w-4 text-text-4 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-4 shrink-0" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-text-3 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="py-12 text-center px-6" style={{ background: secondary }}>
        <Heart className="h-6 w-6 mx-auto mb-3" style={{ color: accent }} />
        <p className="text-white/80 text-lg font-medium mb-2">{eventName}</p>
        <p className="text-white/50 text-sm">{formatDate(eventDate)}</p>
        {(city || venue) && (
          <p className="text-white/40 text-xs mt-1">{[venue, city].filter(Boolean).join(', ')}</p>
        )}
        <p className="text-white/20 text-xs mt-6">Powered by OneSeva</p>
      </footer>
    </div>
  )
}
