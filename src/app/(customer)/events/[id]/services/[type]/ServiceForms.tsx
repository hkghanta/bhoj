'use client'
import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'

// ── Shared helpers ───────────────────────────────────────────────────────────

function PillSelect({
  options,
  selected,
  onChange,
  multi = true,
}: {
  options: { value: string; label: string; emoji?: string }[]
  selected: string[]
  onChange: (v: string[]) => void
  multi?: boolean
}) {
  const toggle = (val: string) => {
    if (multi) {
      onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
    } else {
      onChange(selected.includes(val) ? [] : [val])
    }
  }
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map(o => {
        const on = selected.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
              on
                ? 'bg-brand/10 text-brand border-brand shadow-sm'
                : 'bg-white dark:bg-cream-2 text-text-3 border-brand-border hover:border-brand/40 hover:text-text-1'
            }`}
          >
            {o.emoji && <span className="text-base">{o.emoji}</span>}
            {o.label}
            {on && (
              <svg viewBox="0 0 10 10" className="w-3 h-3 text-brand" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>
            )}
          </button>
        )
      })}
    </div>
  )
}

function CheckCard({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string; emoji: string; desc: string }[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map(o => {
        const on = selected.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all ${
              on
                ? 'bg-purple-50 border-purple-300 shadow-sm'
                : 'bg-white dark:bg-cream-2 border-brand-border hover:border-purple-200'
            }`}
          >
            <span className="text-2xl mt-0.5 flex-shrink-0">{o.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-1">{o.label}</p>
              <p className="text-xs text-text-4 mt-1 leading-snug">{o.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              on ? 'bg-purple-500' : 'border-2 border-brand-border'
            }`}>
              {on && <svg viewBox="0 0 10 10" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t-2 border-brand-border/60 pt-5 pb-2">
      <p className="text-lg font-black text-text-1 mb-4">{title}</p>
      {children}
    </div>
  )
}

function NumberInput({ label, value, onChange, min = 1, max = 50 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-text-2 flex-1">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border-2 border-brand-border flex items-center justify-center text-text-3 hover:bg-cream-2 font-bold">−</button>
        <span className="text-base font-black text-text-1 w-6 text-center tabular-nums">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full border-2 border-brand-border flex items-center justify-center text-text-3 hover:bg-cream-2 font-bold">+</button>
      </div>
    </div>
  )
}

function SaveButton({ saving, onClick, disabled }: { saving: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-end pt-4">
      <button type="button" onClick={onClick} disabled={saving || disabled}
        className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-black px-5 py-3 rounded-xl transition-colors disabled:opacity-60"
        style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}>
        {saving ? (
          <><span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Saving…</>
        ) : (
          <><Send className="h-3.5 w-3.5" /> Save requirements</>
        )}
      </button>
    </div>
  )
}

function NotesField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder}
      className="w-full border-2 border-brand-border rounded-xl px-4 py-3.5 text-sm text-text-1 bg-white dark:bg-cream-2 resize-none
                 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all" />
  )
}

// Helper to build summary from form state
function summarize(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(' · ')
}

// ── Photography Form ─────────────────────────────────────────────────────────

const PHOTO_STYLE = [
  { value: 'candid', label: 'Candid', emoji: '📸' },
  { value: 'traditional', label: 'Traditional / Posed', emoji: '🖼️' },
  { value: 'documentary', label: 'Documentary', emoji: '🎞️' },
  { value: 'artistic', label: 'Artistic / Editorial', emoji: '🎨' },
]
const PHOTO_COVERAGE = [
  { value: 'getting-ready', label: 'Getting Ready', emoji: '💄', desc: 'Pre-ceremony prep shots' },
  { value: 'ceremony', label: 'Ceremony', emoji: '💍', desc: 'Full ceremony coverage' },
  { value: 'reception', label: 'Reception', emoji: '🎉', desc: 'Party, dancing, speeches' },
  { value: 'couple-portraits', label: 'Couple Portraits', emoji: '💑', desc: 'Dedicated couple shoot' },
  { value: 'family-portraits', label: 'Family Portraits', emoji: '👨‍👩‍👧‍👦', desc: 'Formal group/family photos' },
  { value: 'drone', label: 'Drone / Aerial', emoji: '🚁', desc: 'Aerial venue and group shots' },
]
const PHOTO_DELIVERABLES = [
  { value: 'digital', label: 'Digital Files Only', emoji: '💻' },
  { value: 'album', label: 'Photo Album', emoji: '📖' },
  { value: 'prints', label: 'Prints / Canvas', emoji: '🖼️' },
  { value: 'highlight-reel', label: 'Video Highlight Reel', emoji: '🎬' },
]

function PhotographyForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [style, setStyle] = useState<string[]>([])
  const [coverage, setCoverage] = useState<string[]>([])
  const [deliverables, setDeliverables] = useState<string[]>([])
  const [hours, setHours] = useState(6)
  const [photographers, setPhotographers] = useState(1)
  const [videoToo, setVideoToo] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      style.length > 0 && `Style: ${style.map(s => PHOTO_STYLE.find(o => o.value === s)?.label ?? s).join(', ')}`,
      `${hours} hours, ${photographers} photographer${photographers > 1 ? 's' : ''}`,
      coverage.length > 0 && `Coverage: ${coverage.map(c => PHOTO_COVERAGE.find(o => o.value === c)?.label ?? c).join(', ')}`,
      deliverables.length > 0 && `Deliverables: ${deliverables.map(d => PHOTO_DELIVERABLES.find(o => o.value === d)?.label ?? d).join(', ')}`,
      videoToo && 'Videography also needed',
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="Photography Style">
        <PillSelect options={PHOTO_STYLE} selected={style} onChange={setStyle} />
      </FormSection>

      <FormSection title="Coverage Details">
        <div className="space-y-4">
          <NumberInput label="Hours of coverage" value={hours} onChange={setHours} min={1} max={16} />
          <NumberInput label="Number of photographers" value={photographers} onChange={setPhotographers} min={1} max={5} />
        </div>
      </FormSection>

      <FormSection title="What to Cover">
        <CheckCard options={PHOTO_COVERAGE} selected={coverage} onChange={setCoverage} />
      </FormSection>

      <FormSection title="Deliverables">
        <PillSelect options={PHOTO_DELIVERABLES} selected={deliverables} onChange={setDeliverables} />
        <div className="mt-4">
          <button type="button" onClick={() => setVideoToo(!videoToo)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
              videoToo ? 'bg-blue-50 border-blue-300 text-text-1' : 'border-brand-border text-text-3 hover:border-blue-200'
            }`}>
            <span className="text-xl">🎥</span>
            Also need videography
            {videoToo && <svg viewBox="0 0 10 10" className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>}
          </button>
        </div>
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Special shots, locations, timing preferences, cultural moments to capture…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── Decorator Form ───────────────────────────────────────────────────────────

const DECOR_STYLE = [
  { value: 'traditional', label: 'Traditional', emoji: '🪔' },
  { value: 'modern', label: 'Modern / Contemporary', emoji: '✨' },
  { value: 'rustic', label: 'Rustic / Boho', emoji: '🌾' },
  { value: 'floral', label: 'Floral Heavy', emoji: '🌸' },
  { value: 'minimalist', label: 'Minimalist', emoji: '🤍' },
  { value: 'luxury', label: 'Luxury / Opulent', emoji: '👑' },
]
const DECOR_AREAS = [
  { value: 'entrance', label: 'Entrance / Welcome Area', emoji: '🚪', desc: 'Arch, signage, welcome decor' },
  { value: 'mandap', label: 'Mandap / Altar / Stage', emoji: '🛕', desc: 'Main ceremony structure' },
  { value: 'reception-stage', label: 'Reception Stage', emoji: '🎤', desc: 'Backdrop for speeches and performances' },
  { value: 'dining', label: 'Dining Area', emoji: '🍽️', desc: 'Table centrepieces, runners, chair covers' },
  { value: 'photo-booth', label: 'Photo Booth / Selfie Wall', emoji: '📸', desc: 'Dedicated photo area with props' },
  { value: 'aisle', label: 'Aisle / Walkway', emoji: '🚶', desc: 'Aisle décor, petal pathway, pillars' },
  { value: 'ceiling', label: 'Ceiling / Draping', emoji: '🎪', desc: 'Fabric draping, hanging flowers, fairy lights' },
  { value: 'outdoor', label: 'Outdoor / Garden', emoji: '🌳', desc: 'Garden, poolside, or terrace décor' },
]
const DECOR_EXTRAS = [
  { value: 'flowers-fresh', label: 'Fresh Flowers', emoji: '🌹' },
  { value: 'flowers-artificial', label: 'Artificial Flowers', emoji: '🌷' },
  { value: 'fairy-lights', label: 'Fairy Lights', emoji: '✨' },
  { value: 'candles', label: 'Candles / Lanterns', emoji: '🕯️' },
  { value: 'fabric-draping', label: 'Fabric Draping', emoji: '🎀' },
  { value: 'props', label: 'Props & Signage', emoji: '🪧' },
]

function DecoratorForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [style, setStyle] = useState<string[]>([])
  const [areas, setAreas] = useState<string[]>([])
  const [extras, setExtras] = useState<string[]>([])
  const [venueType, setVenueType] = useState<string[]>([])
  const [colorTheme, setColorTheme] = useState('')
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      style.length > 0 && `Style: ${style.map(s => DECOR_STYLE.find(o => o.value === s)?.label ?? s).join(', ')}`,
      venueType.length > 0 && `Venue: ${venueType.join(', ')}`,
      areas.length > 0 && `Areas: ${areas.map(a => DECOR_AREAS.find(o => o.value === a)?.label ?? a).join(', ')}`,
      extras.length > 0 && `Elements: ${extras.map(e => DECOR_EXTRAS.find(o => o.value === e)?.label ?? e).join(', ')}`,
      colorTheme && `Color theme: ${colorTheme}`,
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="Decoration Style">
        <PillSelect options={DECOR_STYLE} selected={style} onChange={setStyle} />
      </FormSection>

      <FormSection title="Venue Type">
        <PillSelect options={[
          { value: 'Indoor', label: 'Indoor', emoji: '🏛️' },
          { value: 'Outdoor', label: 'Outdoor', emoji: '🌳' },
          { value: 'Both', label: 'Both', emoji: '🏠' },
        ]} selected={venueType} onChange={setVenueType} multi={false} />
      </FormSection>

      <FormSection title="Areas to Decorate">
        <CheckCard options={DECOR_AREAS} selected={areas} onChange={setAreas} />
      </FormSection>

      <FormSection title="Décor Elements">
        <PillSelect options={DECOR_EXTRAS} selected={extras} onChange={setExtras} />
      </FormSection>

      <FormSection title="Color Theme">
        <input type="text" value={colorTheme} onChange={e => setColorTheme(e.target.value)}
          placeholder="e.g. Blush pink & gold, Red & white, Pastels…"
          className="w-full border-2 border-brand-border rounded-xl px-4 py-3 text-sm bg-white dark:bg-cream-2 text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40" />
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Inspiration images, Pinterest board links, specific flower types, budget range…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── DJ / Music Form ──────────────────────────────────────────────────────────

const MUSIC_STYLE = [
  { value: 'bollywood', label: 'Bollywood', emoji: '🎬' },
  { value: 'bhangra', label: 'Bhangra / Punjabi', emoji: '🥁' },
  { value: 'western', label: 'Western / Pop', emoji: '🎧' },
  { value: 'rnb-hiphop', label: 'R&B / Hip-Hop', emoji: '🎤' },
  { value: 'classical', label: 'Classical / Instrumental', emoji: '🎻' },
  { value: 'mixed', label: 'Mixed / All Genres', emoji: '🎶' },
]
const DJ_EQUIPMENT = [
  { value: 'sound-system', label: 'Sound System', emoji: '🔊', desc: 'PA system, speakers, subwoofers' },
  { value: 'dj-booth', label: 'DJ Booth / Setup', emoji: '🎛️', desc: 'Full DJ booth with decks' },
  { value: 'dance-lighting', label: 'Dance Floor Lighting', emoji: '💡', desc: 'Moving heads, lasers, LED bars' },
  { value: 'fog-machine', label: 'Fog / Haze Machine', emoji: '🌫️', desc: 'Atmospheric effects' },
  { value: 'wireless-mics', label: 'Wireless Microphones', emoji: '🎙️', desc: 'For speeches and toasts' },
  { value: 'led-screen', label: 'LED Screen / Projector', emoji: '📺', desc: 'For visuals, slideshows, lyrics' },
]

function DJForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [musicStyle, setMusicStyle] = useState<string[]>([])
  const [equipment, setEquipment] = useState<string[]>([])
  const [hours, setHours] = useState(4)
  const [mcNeeded, setMcNeeded] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      musicStyle.length > 0 && `Music: ${musicStyle.map(s => MUSIC_STYLE.find(o => o.value === s)?.label ?? s).join(', ')}`,
      `${hours} hours`,
      equipment.length > 0 && `Equipment: ${equipment.map(e => DJ_EQUIPMENT.find(o => o.value === e)?.label ?? e).join(', ')}`,
      mcNeeded && 'MC / host services needed',
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="Music Style">
        <PillSelect options={MUSIC_STYLE} selected={musicStyle} onChange={setMusicStyle} />
      </FormSection>

      <FormSection title="Duration">
        <NumberInput label="Hours of music" value={hours} onChange={setHours} min={1} max={12} />
      </FormSection>

      <FormSection title="Equipment & Setup">
        <CheckCard options={DJ_EQUIPMENT} selected={equipment} onChange={setEquipment} />
      </FormSection>

      <FormSection title="MC / Hosting">
        <button type="button" onClick={() => setMcNeeded(!mcNeeded)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold w-full text-left transition-all ${
            mcNeeded ? 'bg-blue-50 border-blue-300 text-text-1' : 'border-brand-border text-text-3 hover:border-blue-200'
          }`}>
          <span className="text-xl">🎙️</span>
          <div className="flex-1">
            <p className="font-bold">Need MC / host services</p>
            <p className="text-xs text-text-4 mt-0.5">DJ to also host, announce, and engage the crowd</p>
          </div>
          {mcNeeded && <svg viewBox="0 0 10 10" className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>}
        </button>
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Song requests, must-play list, any no-play songs, vibe you're going for…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── MC / Host Form ───────────────────────────────────────────────────────────

const MC_STYLE = [
  { value: 'formal', label: 'Formal / Elegant', emoji: '🎩' },
  { value: 'fun', label: 'Fun / Energetic', emoji: '🎉' },
  { value: 'bilingual', label: 'Bilingual', emoji: '🌐' },
  { value: 'comedy', label: 'Comedy / Roast Style', emoji: '😂' },
]
const MC_SEGMENTS = [
  { value: 'introductions', label: 'Guest Introductions', emoji: '👋', desc: 'Introduce VIPs, family, wedding party' },
  { value: 'speeches', label: 'Speech Coordination', emoji: '🎤', desc: 'Manage toasts, speeches, order of events' },
  { value: 'games', label: 'Games & Activities', emoji: '🎲', desc: 'Interactive games for guests' },
  { value: 'dance-floor', label: 'Dance Floor Management', emoji: '💃', desc: 'Get guests dancing, manage playlist requests' },
  { value: 'cultural', label: 'Cultural Segments', emoji: '🪔', desc: 'Manage cultural rituals and traditions' },
  { value: 'timeline', label: 'Full Event Timeline', emoji: '⏱️', desc: 'Run the entire event schedule' },
]

function MCForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [style, setStyle] = useState<string[]>([])
  const [segments, setSegments] = useState<string[]>([])
  const [hours, setHours] = useState(4)
  const [languages, setLanguages] = useState('')
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      style.length > 0 && `Style: ${style.map(s => MC_STYLE.find(o => o.value === s)?.label ?? s).join(', ')}`,
      `${hours} hours`,
      languages && `Languages: ${languages}`,
      segments.length > 0 && `Segments: ${segments.map(s => MC_SEGMENTS.find(o => o.value === s)?.label ?? s).join(', ')}`,
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="MC Style">
        <PillSelect options={MC_STYLE} selected={style} onChange={setStyle} />
      </FormSection>

      <FormSection title="Duration">
        <NumberInput label="Hours needed" value={hours} onChange={setHours} min={1} max={10} />
      </FormSection>

      <FormSection title="Languages">
        <input type="text" value={languages} onChange={e => setLanguages(e.target.value)}
          placeholder="e.g. English, Hindi, Punjabi, Gujarati…"
          className="w-full border-2 border-brand-border rounded-xl px-4 py-3 text-sm bg-white dark:bg-cream-2 text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40" />
      </FormSection>

      <FormSection title="What Should the MC Handle?">
        <CheckCard options={MC_SEGMENTS} selected={segments} onChange={setSegments} />
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Event flow, key moments, cultural context, names to pronounce correctly…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── Mehendi Artist Form ──────────────────────────────────────────────────────

const MEHENDI_STYLE = [
  { value: 'traditional', label: 'Traditional Indian', emoji: '🇮🇳' },
  { value: 'arabic', label: 'Arabic', emoji: '🌙' },
  { value: 'contemporary', label: 'Contemporary / Fusion', emoji: '✨' },
  { value: 'minimal', label: 'Minimal / Simple', emoji: '🤍' },
  { value: 'portrait', label: 'Portrait / Figure', emoji: '🎨' },
]
const BRIDAL_COVERAGE = [
  { value: 'full-arms', label: 'Full Arms (up to elbow)', emoji: '💪' },
  { value: 'full-hands-feet', label: 'Full Arms + Feet', emoji: '🦶' },
  { value: 'half-arms', label: 'Half Arms (wrists)', emoji: '🤚' },
  { value: 'hands-only', label: 'Hands Only', emoji: '✋' },
]

function MehendiForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [style, setStyle] = useState<string[]>([])
  const [bridalCoverage, setBridalCoverage] = useState<string[]>([])
  const [bridalCount, setBridalCount] = useState(1)
  const [guestCount, setGuestCount] = useState(0)
  const [guestComplexity, setGuestComplexity] = useState<string[]>([])
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      style.length > 0 && `Style: ${style.map(s => MEHENDI_STYLE.find(o => o.value === s)?.label ?? s).join(', ')}`,
      `${bridalCount} bridal mehendi`,
      bridalCoverage.length > 0 && `Bridal coverage: ${bridalCoverage.map(c => BRIDAL_COVERAGE.find(o => o.value === c)?.label ?? c).join(', ')}`,
      guestCount > 0 && `${guestCount} guests`,
      guestComplexity.length > 0 && `Guest designs: ${guestComplexity.join(', ')}`,
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="Mehendi Style">
        <PillSelect options={MEHENDI_STYLE} selected={style} onChange={setStyle} />
      </FormSection>

      <FormSection title="Bridal Mehendi">
        <div className="space-y-4">
          <NumberInput label="Brides / VIP designs" value={bridalCount} onChange={setBridalCount} min={1} max={5} />
          <div>
            <p className="text-sm font-bold text-text-2 mb-3">Coverage</p>
            <PillSelect options={BRIDAL_COVERAGE} selected={bridalCoverage} onChange={setBridalCoverage} multi={false} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Guest Mehendi">
        <div className="space-y-4">
          <NumberInput label="Number of guests" value={guestCount} onChange={setGuestCount} min={0} max={200} />
          {guestCount > 0 && (
            <PillSelect options={[
              { value: 'Simple', label: 'Simple (one hand)', emoji: '✋' },
              { value: 'Medium', label: 'Medium (both hands)', emoji: '🙌' },
              { value: 'Detailed', label: 'Detailed', emoji: '🌸' },
            ]} selected={guestComplexity} onChange={setGuestComplexity} multi={false} />
          )}
        </div>
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Design preferences, reference images, timing needs, any allergies…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── Makeup & Hair Form ───────────────────────────────────────────────────────

const MAKEUP_STYLE = [
  { value: 'natural', label: 'Natural / Dewy', emoji: '🌿' },
  { value: 'glamorous', label: 'Glamorous / Bold', emoji: '💄' },
  { value: 'traditional', label: 'Traditional / Bridal', emoji: '👰' },
  { value: 'airbrush', label: 'Airbrush', emoji: '✨' },
]
const MAKEUP_SERVICES = [
  { value: 'bridal-makeup', label: 'Bridal Makeup', emoji: '👰', desc: 'Full bridal look with HD/airbrush' },
  { value: 'bridal-hair', label: 'Bridal Hair Styling', emoji: '💇‍♀️', desc: 'Updo, curls, extensions' },
  { value: 'bridesmaid-makeup', label: 'Bridesmaid Makeup', emoji: '💄', desc: 'Makeup for bridesmaids' },
  { value: 'bridesmaid-hair', label: 'Bridesmaid Hair', emoji: '💇', desc: 'Hair styling for bridesmaids' },
  { value: 'family-makeup', label: 'Family Members Makeup', emoji: '👩', desc: 'Mother of bride/groom, etc.' },
  { value: 'groom-grooming', label: 'Groom Grooming', emoji: '🤵', desc: 'Groom skincare and light makeup' },
]

function MakeupForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [style, setStyle] = useState<string[]>([])
  const [services, setServices] = useState<string[]>([])
  const [totalPeople, setTotalPeople] = useState(1)
  const [trialNeeded, setTrialNeeded] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      style.length > 0 && `Style: ${style.map(s => MAKEUP_STYLE.find(o => o.value === s)?.label ?? s).join(', ')}`,
      services.length > 0 && `Services: ${services.map(s => MAKEUP_SERVICES.find(o => o.value === s)?.label ?? s).join(', ')}`,
      `${totalPeople} person${totalPeople > 1 ? 's' : ''} total`,
      trialNeeded && 'Trial session needed',
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="Makeup Style">
        <PillSelect options={MAKEUP_STYLE} selected={style} onChange={setStyle} />
      </FormSection>

      <FormSection title="Services Needed">
        <CheckCard options={MAKEUP_SERVICES} selected={services} onChange={setServices} />
      </FormSection>

      <FormSection title="Details">
        <div className="space-y-4">
          <NumberInput label="Total people for makeup/hair" value={totalPeople} onChange={setTotalPeople} min={1} max={20} />
          <button type="button" onClick={() => setTrialNeeded(!trialNeeded)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold w-full text-left transition-all ${
              trialNeeded ? 'bg-blue-50 border-blue-300 text-text-1' : 'border-brand-border text-text-3 hover:border-blue-200'
            }`}>
            <span className="text-xl">🪞</span>
            <div className="flex-1">
              <p className="font-bold">Need a trial session before the event</p>
              <p className="text-xs text-text-4 mt-0.5">Test the look beforehand to make sure it's perfect</p>
            </div>
            {trialNeeded && <svg viewBox="0 0 10 10" className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>}
          </button>
        </div>
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Skin type, allergies, outfit colors to match, reference images…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── Pandit / Officiant Form ──────────────────────────────────────────────────

const CEREMONY_TYPE = [
  { value: 'hindu', label: 'Hindu', emoji: '🕉️' },
  { value: 'sikh', label: 'Sikh', emoji: '☬' },
  { value: 'muslim', label: 'Muslim / Nikah', emoji: '☪️' },
  { value: 'christian', label: 'Christian', emoji: '✝️' },
  { value: 'interfaith', label: 'Interfaith', emoji: '🤝' },
  { value: 'civil', label: 'Civil / Non-religious', emoji: '📜' },
]
const CEREMONY_NEEDS = [
  { value: 'materials', label: 'Puja Materials / Samagri', emoji: '🪔', desc: 'All ritual items provided by pandit' },
  { value: 'mandap-setup', label: 'Mandap / Altar Setup', emoji: '🛕', desc: 'Sacred fire, seating arrangement' },
  { value: 'explanation', label: 'English Explanation', emoji: '🗣️', desc: 'Translate rituals for non-Hindi speakers' },
  { value: 'short-ceremony', label: 'Short Ceremony (under 1 hr)', emoji: '⏱️', desc: 'Abbreviated version of traditional rituals' },
  { value: 'mehendi-ceremony', label: 'Mehendi / Sangeet Puja', emoji: '🎉', desc: 'Separate pre-wedding ceremony' },
  { value: 'ganesh-puja', label: 'Ganesh Puja / Opening', emoji: '🙏', desc: 'Opening prayer before main ceremony' },
]

function PanditForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [ceremony, setCeremony] = useState<string[]>([])
  const [needs, setNeeds] = useState<string[]>([])
  const [languages, setLanguages] = useState('')
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      ceremony.length > 0 && `Ceremony: ${ceremony.map(c => CEREMONY_TYPE.find(o => o.value === c)?.label ?? c).join(', ')}`,
      languages && `Languages: ${languages}`,
      needs.length > 0 && `Needs: ${needs.map(n => CEREMONY_NEEDS.find(o => o.value === n)?.label ?? n).join(', ')}`,
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="Ceremony Type">
        <PillSelect options={CEREMONY_TYPE} selected={ceremony} onChange={setCeremony} />
      </FormSection>

      <FormSection title="Language Preference">
        <input type="text" value={languages} onChange={e => setLanguages(e.target.value)}
          placeholder="e.g. Hindi, Sanskrit with English explanation, Punjabi…"
          className="w-full border-2 border-brand-border rounded-xl px-4 py-3 text-sm bg-white dark:bg-cream-2 text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40" />
      </FormSection>

      <FormSection title="What Do You Need?">
        <CheckCard options={CEREMONY_NEEDS} selected={needs} onChange={setNeeds} />
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Specific rituals, regional traditions, timing, venue constraints…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── Invitation Designer Form ─────────────────────────────────────────────────

const INVITE_TYPE = [
  { value: 'digital', label: 'Digital Only', emoji: '📱' },
  { value: 'printed', label: 'Printed Only', emoji: '📨' },
  { value: 'both', label: 'Digital + Printed', emoji: '📬' },
]
const INVITE_STYLE = [
  { value: 'traditional', label: 'Traditional', emoji: '🪔' },
  { value: 'modern', label: 'Modern / Minimalist', emoji: '✨' },
  { value: 'illustrated', label: 'Illustrated / Caricature', emoji: '🎨' },
  { value: 'photo-based', label: 'Photo-based', emoji: '📸' },
  { value: 'luxury', label: 'Luxury / Foil / Letterpress', emoji: '👑' },
]
const INVITE_ITEMS = [
  { value: 'main-invite', label: 'Main Invitation', emoji: '💌', desc: 'Primary wedding/event invite' },
  { value: 'save-the-date', label: 'Save the Date', emoji: '📅', desc: 'Pre-invite announcement' },
  { value: 'rsvp', label: 'RSVP Cards', emoji: '✉️', desc: 'Response cards with envelope' },
  { value: 'itinerary', label: 'Event Itinerary', emoji: '📋', desc: 'Schedule card for multi-day events' },
  { value: 'menu-card', label: 'Menu Cards', emoji: '🍽️', desc: 'Table menu cards for reception' },
  { value: 'thank-you', label: 'Thank You Cards', emoji: '🙏', desc: 'Post-event thank you notes' },
]

function InvitationForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [type, setType] = useState<string[]>([])
  const [style, setStyle] = useState<string[]>([])
  const [items, setItems] = useState<string[]>([])
  const [quantity, setQuantity] = useState(100)
  const [languages, setLanguages] = useState('')
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      type.length > 0 && `Type: ${type.map(t => INVITE_TYPE.find(o => o.value === t)?.label ?? t).join(', ')}`,
      style.length > 0 && `Style: ${style.map(s => INVITE_STYLE.find(o => o.value === s)?.label ?? s).join(', ')}`,
      items.length > 0 && `Items: ${items.map(i => INVITE_ITEMS.find(o => o.value === i)?.label ?? i).join(', ')}`,
      quantity > 0 && `Quantity: ~${quantity}`,
      languages && `Languages: ${languages}`,
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="Invitation Type">
        <PillSelect options={INVITE_TYPE} selected={type} onChange={setType} multi={false} />
      </FormSection>

      <FormSection title="Design Style">
        <PillSelect options={INVITE_STYLE} selected={style} onChange={setStyle} />
      </FormSection>

      <FormSection title="What Do You Need?">
        <CheckCard options={INVITE_ITEMS} selected={items} onChange={setItems} />
      </FormSection>

      <FormSection title="Details">
        <div className="space-y-4">
          <NumberInput label="Approximate quantity" value={quantity} onChange={setQuantity} min={10} max={1000} />
          <div>
            <p className="text-sm font-bold text-text-2 mb-2">Languages on invitation</p>
            <input type="text" value={languages} onChange={e => setLanguages(e.target.value)}
              placeholder="e.g. English, Hindi, Gujarati…"
              className="w-full border-2 border-brand-border rounded-xl px-4 py-3 text-sm bg-white dark:bg-cream-2 text-text-1 placeholder:text-text-4 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Color preferences, reference designs, deadline, matching theme with décor…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── Transport Form ───────────────────────────────────────────────────────────

const VEHICLE_TYPE = [
  { value: 'sedan', label: 'Sedan / Saloon', emoji: '🚗' },
  { value: 'suv', label: 'SUV / 4x4', emoji: '🚙' },
  { value: 'vintage', label: 'Vintage / Classic Car', emoji: '🚘' },
  { value: 'limousine', label: 'Limousine', emoji: '🚐' },
  { value: 'horse-carriage', label: 'Horse & Carriage', emoji: '🐴' },
  { value: 'minibus', label: 'Minibus / Coach', emoji: '🚌' },
]
const TRANSPORT_PURPOSE = [
  { value: 'bridal-entry', label: 'Bridal / Groom Entry', emoji: '👰', desc: 'Grand arrival at venue' },
  { value: 'baraat', label: 'Baraat Procession', emoji: '🐎', desc: 'Groom\'s wedding procession' },
  { value: 'guest-shuttle', label: 'Guest Shuttle', emoji: '🚌', desc: 'Hotel ↔ venue transfers' },
  { value: 'airport', label: 'Airport Transfers', emoji: '✈️', desc: 'Pick up/drop off out-of-town guests' },
  { value: 'getaway', label: 'Post-Event Getaway', emoji: '💕', desc: 'Couple\'s departure vehicle' },
]

function TransportForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [vehicles, setVehicles] = useState<string[]>([])
  const [purpose, setPurpose] = useState<string[]>([])
  const [vehicleCount, setVehicleCount] = useState(1)
  const [decorated, setDecorated] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      vehicles.length > 0 && `Vehicles: ${vehicles.map(v => VEHICLE_TYPE.find(o => o.value === v)?.label ?? v).join(', ')}`,
      `${vehicleCount} vehicle${vehicleCount > 1 ? 's' : ''}`,
      purpose.length > 0 && `Purpose: ${purpose.map(p => TRANSPORT_PURPOSE.find(o => o.value === p)?.label ?? p).join(', ')}`,
      decorated && 'Vehicle decoration needed',
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="Vehicle Type">
        <PillSelect options={VEHICLE_TYPE} selected={vehicles} onChange={setVehicles} />
      </FormSection>

      <FormSection title="Purpose">
        <CheckCard options={TRANSPORT_PURPOSE} selected={purpose} onChange={setPurpose} />
      </FormSection>

      <FormSection title="Details">
        <div className="space-y-4">
          <NumberInput label="Number of vehicles" value={vehicleCount} onChange={setVehicleCount} min={1} max={20} />
          <button type="button" onClick={() => setDecorated(!decorated)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-bold w-full text-left transition-all ${
              decorated ? 'bg-blue-50 border-blue-300 text-text-1' : 'border-brand-border text-text-3 hover:border-blue-200'
            }`}>
            <span className="text-xl">🎀</span>
            <div className="flex-1">
              <p className="font-bold">Vehicle decoration needed</p>
              <p className="text-xs text-text-4 mt-0.5">Flowers, ribbons, or custom décor on the vehicle</p>
            </div>
            {decorated && <svg viewBox="0 0 10 10" className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>}
          </button>
        </div>
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Pick-up/drop-off locations, timing, number of passengers, route preferences…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── Security Form ────────────────────────────────────────────────────────────

const SECURITY_TYPE = [
  { value: 'event-security', label: 'Event Security', emoji: '🛡️' },
  { value: 'bouncer', label: 'Bouncers / Door Staff', emoji: '💪' },
  { value: 'parking', label: 'Parking Attendants', emoji: '🅿️' },
  { value: 'valet', label: 'Valet Parking', emoji: '🚗' },
  { value: 'vip', label: 'VIP / Close Protection', emoji: '🕴️' },
]

function SecurityForm({ initialNotes, onSave, saving }: { initialNotes: string; onSave: (notes: string) => Promise<void>; saving: boolean }) {
  const [type, setType] = useState<string[]>([])
  const [personnel, setPersonnel] = useState(2)
  const [hours, setHours] = useState(6)
  const [notes, setNotes] = useState(initialNotes)
  useEffect(() => { setNotes(initialNotes) }, [initialNotes])

  const save = () => {
    const summary = summarize([
      type.length > 0 && `Type: ${type.map(t => SECURITY_TYPE.find(o => o.value === t)?.label ?? t).join(', ')}`,
      `${personnel} personnel, ${hours} hours`,
      notes.trim(),
    ])
    onSave(summary)
  }

  return (
    <div className="space-y-1">
      <FormSection title="Security Type">
        <PillSelect options={SECURITY_TYPE} selected={type} onChange={setType} />
      </FormSection>

      <FormSection title="Details">
        <div className="space-y-4">
          <NumberInput label="Number of personnel" value={personnel} onChange={setPersonnel} min={1} max={30} />
          <NumberInput label="Hours of coverage" value={hours} onChange={setHours} min={1} max={16} />
        </div>
      </FormSection>

      <FormSection title="Additional Notes">
        <NotesField value={notes} onChange={setNotes} placeholder="Venue layout, entry points, crowd size, specific concerns, dress code…" />
      </FormSection>

      <SaveButton saving={saving} onClick={save} />
    </div>
  )
}

// ── Export map ────────────────────────────────────────────────────────────────

export const SERVICE_FORMS: Record<string, React.ComponentType<{
  initialNotes: string
  onSave: (notes: string) => Promise<void>
  saving: boolean
}>> = {
  'photographer': PhotographyForm,
  'decorator': DecoratorForm,
  'dj': DJForm,
  'mc-host': MCForm,
  'mehendi-artist': MehendiForm,
  'makeup-hair': MakeupForm,
  'pandit-officiant': PanditForm,
  'invitation-designer': InvitationForm,
  'transport': TransportForm,
  'security': SecurityForm,
}
