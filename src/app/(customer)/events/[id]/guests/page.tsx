'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  Plus, Mail, Link2, Trash2, UserX, Check, Send, Bell,
  Users, CheckCircle2, Clock, XCircle, ChevronRight,
  Sparkles, UserCheck, CalendarDays, MapPin, ImagePlus,
  Pencil, X, Upload, Palette, MessageSquare, ExternalLink,
  Download, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRef as useFileRef } from 'react'

type Attendee  = { dietary_type: string; allergens: string[] }
type SubEvent  = { id: string; name: string; event_date: string }
type Invite    = { id: string; sub_event: SubEvent; responded_at: string | null; attendees: Attendee[] }
type Household = { id: string; label: string; email: string | null; token: string; declined: boolean; invites: Invite[] }
type EventData = {
  event_name: string
  event_type: string
  event_date: string
  city: string
  state: string | null
  venue: string | null
  guest_count: number
  invite_image_url: string | null
  invite_message: string | null
  invite_theme: string | null
  dietary_options: string[]
  collect_allergens: boolean
}

const ALL_DIETARY_OPTIONS = [
  { value: 'NON_VEG',    label: 'Non-Veg',    emoji: '🍗' },
  { value: 'VEGETARIAN', label: 'Vegetarian', emoji: '🥦' },
  { value: 'VEGAN',      label: 'Vegan',      emoji: '🌱' },
  { value: 'JAIN',       label: 'Jain',       emoji: '🪷' },
  { value: 'HALAL',      label: 'Halal',      emoji: '☪️' },
]

// ── Gradient themes ────────────────────────────────────────────────────────
const THEMES: { key: string; label: string; bg: string; band: string; accent: string }[] = [
  // Vibrant / Indian-inspired
  { key: 'orange',  label: 'Saffron',   bg: 'from-orange-950 via-orange-900 to-rose-900',    band: 'from-amber-400 via-orange-400 to-rose-400',    accent: 'text-amber-300' },
  { key: 'royal',   label: 'Royal',     bg: 'from-violet-950 via-purple-900 to-indigo-900',  band: 'from-violet-400 via-purple-400 to-indigo-400', accent: 'text-violet-300' },
  { key: 'emerald', label: 'Emerald',   bg: 'from-emerald-950 via-teal-900 to-cyan-900',     band: 'from-emerald-400 via-teal-400 to-cyan-400',    accent: 'text-emerald-300' },
  { key: 'rose',    label: 'Rose',      bg: 'from-rose-950 via-pink-900 to-fuchsia-900',     band: 'from-rose-400 via-pink-400 to-fuchsia-400',    accent: 'text-rose-300' },
  { key: 'navy',    label: 'Midnight',  bg: 'from-slate-950 via-blue-950 to-indigo-950',     band: 'from-blue-400 via-indigo-400 to-slate-400',    accent: 'text-blue-300' },
  { key: 'maroon',  label: 'Maroon',    bg: 'from-red-950 via-rose-950 to-orange-950',       band: 'from-red-400 via-rose-400 to-orange-400',      accent: 'text-red-300' },
  // Neutral / elegant
  { key: 'slate',   label: 'Slate',     bg: 'from-slate-900 via-zinc-900 to-gray-900',       band: 'from-slate-400 via-zinc-400 to-gray-400',      accent: 'text-slate-300' },
  { key: 'stone',   label: 'Stone',     bg: 'from-stone-900 via-stone-800 to-neutral-900',   band: 'from-stone-400 via-amber-300 to-stone-400',    accent: 'text-stone-300' },
  { key: 'gold',    label: 'Gold',      bg: 'from-yellow-950 via-amber-900 to-stone-900',    band: 'from-yellow-400 via-amber-300 to-yellow-400',  accent: 'text-yellow-300' },
]

// ── Curated photo backgrounds (Unsplash, stable IDs) ───────────────────────
const PHOTO_BACKGROUNDS: { id: string; label: string; url: string; thumb: string }[] = [
  {
    id: 'marigold',
    label: 'Marigolds',
    url:   'https://images.unsplash.com/photo-1595841077284-98fef19efb23?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1595841077284-98fef19efb23?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'bokeh',
    label: 'Festive Lights',
    url:   'https://images.unsplash.com/photo-1707097700926-530e88bac97f?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1707097700926-530e88bac97f?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'roses',
    label: 'Rose Petals',
    url:   'https://images.unsplash.com/photo-1550748726-26268dd3b313?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1550748726-26268dd3b313?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'diyas',
    label: 'Diyas',
    url:   'https://images.unsplash.com/photo-1699801676350-4182399f7cdd?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1699801676350-4182399f7cdd?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'fabric',
    label: 'Silk Fabric',
    url:   'https://images.unsplash.com/photo-1610637018413-166d2c5755c7?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1610637018413-166d2c5755c7?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'rangoli',
    label: 'Rangoli',
    url:   'https://images.unsplash.com/photo-1666352571312-db1557140bc4?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1666352571312-db1557140bc4?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'confetti',
    label: 'Confetti',
    url:   'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'flowers2',
    label: 'Garden',
    url:   'https://images.unsplash.com/photo-1664530140722-7e3bdbf2b870?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1664530140722-7e3bdbf2b870?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'birthday',
    label: 'Birthday Cake',
    url:   'https://images.unsplash.com/photo-1730406928890-99395b04c0db?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1730406928890-99395b04c0db?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'balloons',
    label: 'Balloons',
    url:   'https://images.unsplash.com/photo-1659670178527-158a26dc7824?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1659670178527-158a26dc7824?w=200&auto=format&fit=crop&q=60',
  },
  {
    id: 'graduation',
    label: 'Graduation',
    url:   'https://images.unsplash.com/photo-1645262803541-8c47413511e6?w=1600&auto=format&fit=crop&q=80',
    thumb: 'https://images.unsplash.com/photo-1645262803541-8c47413511e6?w=200&auto=format&fit=crop&q=60',
  },
]

function getTheme(key: string | null | undefined) {
  return THEMES.find(t => t.key === (key ?? 'orange')) ?? THEMES[0]
}

// Determines what kind of background is active
function bgType(imageUrl: string | null | undefined, theme: string | null | undefined): 'photo' | 'preset-photo' | 'gradient' {
  if (!imageUrl) return 'gradient'
  if (PHOTO_BACKGROUNDS.some(p => p.url === imageUrl)) return 'preset-photo'
  return 'photo'
}

const DIETARY_LABEL: Record<string, string> = {
  NON_VEG: 'Non-veg', VEGETARIAN: 'Veg', VEGAN: 'Vegan', JAIN: 'Jain', HALAL: 'Halal',
}

const DIETARY_COLOR: Record<string, string> = {
  NON_VEG:    'bg-red-50 text-red-700 border-red-100',
  VEGETARIAN: 'bg-green-50 text-green-700 border-green-100',
  VEGAN:      'bg-lime-50 text-lime-700 border-lime-100',
  JAIN:       'bg-amber-50 text-amber-700 border-amber-100',
  HALAL:      'bg-emerald-50 text-emerald-700 border-emerald-100',
}

function initials(label: string) {
  return label.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}

function avatarColor(label: string) {
  const colors = [
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700',
    'bg-sky-100 text-sky-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-pink-100 text-pink-700',
    'bg-indigo-100 text-indigo-700',
    'bg-teal-100 text-teal-700',
  ]
  const idx = label.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}

export default function GuestsPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [event, setEvent]           = useState<EventData | null>(null)
  const [households, setHouseholds] = useState<Household[]>([])
  const [subEvents, setSubEvents]   = useState<SubEvent[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  // Multi-guest add: array of rows
  const [guestRows, setGuestRows]   = useState([{ label: '', email: '' }])
  const [form, setForm]             = useState({ label: '', email: '', sub_event_ids: [] as string[] })
  const [saving, setSaving]         = useState(false)
  // Import from paste
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importSaving, setImportSaving] = useState(false)
  // Import from guest book
  const [showGuestBook, setShowGuestBook] = useState(false)
  const [guestBookContacts, setGuestBookContacts] = useState<{ id: string; label: string; email: string | null; phone: string | null; tags: string[] }[]>([])
  const [guestBookSelected, setGuestBookSelected] = useState<Set<string>>(new Set())
  const [guestBookLoading, setGuestBookLoading] = useState(false)
  const [guestBookImporting, setGuestBookImporting] = useState(false)
  const [guestBookResult, setGuestBookResult] = useState<{ imported: number; skipped: number } | null>(null)
  // Send event update
  const [showUpdate, setShowUpdate] = useState(false)
  const [updateSubject, setUpdateSubject] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateSending, setUpdateSending] = useState(false)
  const [updateResult, setUpdateResult] = useState<string | null>(null)
  const [sendingId, setSendingId]   = useState<string | null>(null)
  const [copiedId, setCopiedId]     = useState<string | null>(null)
  const [bulkSending, setBulkSending] = useState<'all' | 'pending' | null>(null)
  const [bulkResult, setBulkResult]   = useState<string | null>(null)
  const [appUrl, setAppUrl]         = useState('')
  const [filter, setFilter]         = useState<'all' | 'pending' | 'responded' | 'declined'>('all')
  const bulkResultTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Banner editor
  const [editBanner, setEditBanner]           = useState(false)
  const [editorTab, setEditorTab]             = useState<'photos' | 'colors' | 'upload'>('photos')
  const [bannerMsg, setBannerMsg]             = useState('')
  const [bannerTheme, setBannerTheme]         = useState('orange')
  const [mealPrefOn, setMealPrefOn]           = useState(false)
  const [dietaryOpts, setDietaryOpts]         = useState<string[]>([])
  const [collectAllergens, setCollectAllergens] = useState(false)
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null) // selected but not yet saved
  const [bannerUploading, setBannerUploading] = useState(false)
  const [bannerSaving, setBannerSaving]       = useState(false)
  const fileInputRef = useFileRef<HTMLInputElement>(null)

  // Invitation settings panel (message + guest info)
  const [editEventInfo, setEditEventInfo]     = useState(false)
  const [infoSaving, setInfoSaving]           = useState(false)
  const [websiteSlug, setWebsiteSlug]         = useState<string | null>(null)

  useEffect(() => {
    setAppUrl(window.location.origin)
    Promise.all([
      fetch(`/api/events/${eventId}`).then(r => r.json()),
      fetch(`/api/events/${eventId}/guests`).then(r => r.json()),
      fetch(`/api/events/${eventId}/sub-events`).then(r => r.json()),
      fetch(`/api/events/${eventId}/website`).then(r => r.ok ? r.json() : null),
    ]).then(([ev, h, s, w]) => {
      if (w?.is_published && w?.slug) setWebsiteSlug(w.slug)
      setEvent(ev)
      setBannerMsg(ev.invite_message ?? '')
      setBannerTheme(ev.invite_theme ?? 'orange')
      const opts = ev.dietary_options ?? []
      setMealPrefOn(opts.length > 0)
      setDietaryOpts(opts)
      setCollectAllergens(ev.collect_allergens ?? false)
      setHouseholds(h)
      setSubEvents(s)
    }).finally(() => setLoading(false))
  }, [eventId])

  async function addHousehold() {
    setSaving(true)
    // Add all non-empty guest rows
    const rows = guestRows.filter(r => r.label.trim())
    const added: Household[] = []
    for (const row of rows) {
      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: row.label.trim(), email: row.email.trim() || undefined, sub_event_ids: form.sub_event_ids }),
      })
      if (res.ok) added.push(await res.json())
    }
    if (added.length) {
      setHouseholds(prev => [...prev, ...added])
      setGuestRows([{ label: '', email: '' }])
      setForm(f => ({ ...f, sub_event_ids: [] }))
      setShowAdd(false)
    }
    setSaving(false)
  }

  async function importGuests() {
    setImportSaving(true)
    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean)
    const rows = lines.map(line => {
      const parts = line.split(/,|\t/)
      const label = parts[0]?.trim() ?? ''
      const email = parts[1]?.trim() ?? ''
      return { label, email }
    }).filter(r => r.label)
    const added: Household[] = []
    for (const row of rows) {
      if (!form.sub_event_ids.length) break
      const res = await fetch(`/api/events/${eventId}/guests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: row.label, email: row.email || undefined, sub_event_ids: form.sub_event_ids }),
      })
      if (res.ok) added.push(await res.json())
    }
    if (added.length) {
      setHouseholds(prev => [...prev, ...added])
      setImportText('')
      setShowImport(false)
    }
    setImportSaving(false)
  }

  async function openGuestBook() {
    setShowGuestBook(true)
    setShowAdd(false)
    setShowImport(false)
    setGuestBookResult(null)
    setGuestBookSelected(new Set())
    setGuestBookLoading(true)
    const res = await fetch('/api/contacts')
    if (res.ok) setGuestBookContacts(await res.json())
    setGuestBookLoading(false)
  }

  async function importFromGuestBook() {
    if (guestBookSelected.size === 0) return
    setGuestBookImporting(true)
    const res = await fetch('/api/contacts/import-to-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, contact_ids: [...guestBookSelected] }),
    })
    if (res.ok) {
      const result = await res.json()
      setGuestBookResult(result)
      if (result.imported > 0) {
        // Reload households
        const r = await fetch(`/api/events/${eventId}/guests`)
        if (r.ok) { const d = await r.json(); setHouseholds(d.households ?? d) }
      }
    }
    setGuestBookImporting(false)
  }

  function toggleGuestBookContact(id: string) {
    setGuestBookSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleAllGuestBook() {
    if (guestBookSelected.size === guestBookContacts.length) {
      setGuestBookSelected(new Set())
    } else {
      setGuestBookSelected(new Set(guestBookContacts.map(c => c.id)))
    }
  }

  async function saveToGuestBook() {
    const res = await fetch('/api/contacts/save-from-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId }),
    })
    if (res.ok) {
      const data = await res.json()
      alert(`Saved ${data.saved} guests to your Guest Book${data.skipped > 0 ? ` (${data.skipped} already existed)` : ''}`)
    }
  }

  async function sendUpdate() {
    setUpdateSending(true); setUpdateResult(null)
    const res = await fetch(`/api/events/${eventId}/guests/send-update`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: updateSubject, message: updateMessage }),
    })
    const data = await res.json()
    setUpdateResult(`Update sent to ${data.sent} guest${data.sent !== 1 ? 's' : ''}${data.skipped ? ` · ${data.skipped} skipped` : ''}`)
    setUpdateSending(false)
    setUpdateSubject(''); setUpdateMessage('')
    setTimeout(() => { setUpdateResult(null); setShowUpdate(false) }, 4000)
  }

  async function sendInvite(householdId: string) {
    setSendingId(householdId)
    await fetch(`/api/events/${eventId}/guests/${householdId}/send-invite`, { method: 'POST' })
    setSendingId(null)
  }

  async function bulkSend(mode: 'all' | 'pending') {
    setBulkSending(mode); setBulkResult(null)
    const res = await fetch(`/api/events/${eventId}/guests/bulk-send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
    const data = await res.json()
    setBulkResult(`${data.sent} invite${data.sent !== 1 ? 's' : ''} sent${data.skipped ? ` · ${data.skipped} skipped (no email)` : ''}`)
    setBulkSending(null)
    if (bulkResultTimer.current) clearTimeout(bulkResultTimer.current)
    bulkResultTimer.current = setTimeout(() => setBulkResult(null), 5000)
  }

  function copyLink(token: string, householdId: string) {
    const url = websiteSlug
      ? `${appUrl}/w/${websiteSlug}?token=${token}`
      : `${appUrl}/e/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(householdId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function markDeclined(householdId: string) {
    await fetch(`/api/events/${eventId}/guests/${householdId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ declined: true }),
    })
    setHouseholds(prev => prev.map(h => h.id === householdId ? { ...h, declined: true } : h))
  }

  async function handleBannerUpload(file: File) {
    setBannerUploading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      const res = await fetch(`/api/events/${eventId}/invite`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_image_data_url: dataUrl }),
      })
      if (res.ok) {
        const data = await res.json()
        setEvent(prev => prev ? { ...prev, invite_image_url: data.invite_image_url } : prev)
      }
      setBannerUploading(false)
    }
    reader.readAsDataURL(file)
  }

  async function saveBannerSettings() {
    setBannerSaving(true)
    const body: Record<string, unknown> = { invite_theme: bannerTheme }
    if (pendingImageUrl !== null) {
      body.invite_image_url_direct = pendingImageUrl
    } else if (editorTab === 'colors' && event?.invite_image_url) {
      body.clear_image = true
    }
    const res = await fetch(`/api/events/${eventId}/invite`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      setEvent(prev => prev ? { ...prev, invite_theme: data.invite_theme, invite_image_url: data.invite_image_url } : prev)
      setPendingImageUrl(null)
    }
    setBannerSaving(false)
    setEditBanner(false)
  }

  async function saveEventInfo() {
    setInfoSaving(true)
    const res = await fetch(`/api/events/${eventId}/invite`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_message: bannerMsg || null,
        dietary_options: mealPrefOn ? dietaryOpts : [],
        collect_allergens: collectAllergens,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setEvent(prev => prev ? {
        ...prev,
        invite_message: data.invite_message,
        dietary_options: data.dietary_options ?? prev.dietary_options,
        collect_allergens: data.collect_allergens ?? prev.collect_allergens,
      } : prev)
    }
    setInfoSaving(false)
    setEditEventInfo(false)
  }

  async function clearBannerImage() {
    const res = await fetch(`/api/events/${eventId}/invite`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clear_image: true }),
    })
    if (res.ok) {
      setEvent(prev => prev ? { ...prev, invite_image_url: null } : prev)
    }
  }

  async function remove(householdId: string) {
    if (!confirm('Remove this guest from the list?')) return
    await fetch(`/api/events/${eventId}/guests/${householdId}`, { method: 'DELETE' })
    setHouseholds(prev => prev.filter(h => h.id !== householdId))
  }

  // Stats
  const total      = households.length
  const responded  = households.filter(h => !h.declined && h.invites.some(i => i.responded_at)).length
  const pending    = households.filter(h => !h.declined && !h.invites.some(i => i.responded_at)).length
  const declined   = households.filter(h => h.declined).length
  const totalGuests = households.flatMap(h => h.invites.flatMap(i => i.attendees)).length
  const pendingWithEmail = households.filter(h => !h.declined && !h.invites.some(i => i.responded_at) && h.email).length
  const respondedPct = total > 0 ? Math.round((responded / total) * 100) : 0
  const declinedPct  = total > 0 ? Math.round((declined / total) * 100) : 0

  // Sub-event dietary totals
  const subEventStats = subEvents.map(se => {
    const attendees = households.flatMap(h =>
      h.invites.filter(inv => inv.sub_event.id === se.id).flatMap(inv => inv.attendees)
    )
    const counts: Record<string, number> = {}
    for (const a of attendees) counts[a.dietary_type] = (counts[a.dietary_type] ?? 0) + 1
    return { se, attendees, counts }
  })

  const filteredHouseholds = households.filter(h => {
    if (filter === 'pending')   return !h.declined && !h.invites.some(i => i.responded_at)
    if (filter === 'responded') return !h.declined && h.invites.some(i => i.responded_at)
    if (filter === 'declined')  return h.declined
    return true
  })

  const noSubEvents = subEvents.length === 0

  return (
    <div className="max-w-4xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-text-4">
        <Link href="/dashboard" className="hover:text-brand transition-colors">My Events</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/events/${eventId}`} className="hover:text-brand transition-colors">Event</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-2 font-medium">Guests & Invitations</span>
      </div>

      {/* ── Invitation Banner ────────────────────────────────────────────── */}
      {(() => {
        const theme = getTheme(event?.invite_theme)
        const hasImage = !!event?.invite_image_url
        return (
          <div className="relative overflow-hidden rounded-3xl shadow-xl group">
            {/* Background — either uploaded image or themed gradient */}
            {hasImage ? (
              <div className="absolute inset-0">
                <img src={event!.invite_image_url!} alt="Banner" className="w-full h-full object-cover" />
                {/* Strong scrim: bottom-heavy so text pops */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/25" />
              </div>
            ) : (
              <>
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg}`} />
                <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute -right-10 -top-10 w-60 h-60 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute right-8 top-8 w-36 h-36 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              </>
            )}

            {/* Content */}
            <div className="relative">
              {/* Top band */}
              <div className={`h-1.5 bg-gradient-to-r ${theme.band}`} />

              {/* === Photo mode: Evite-style centered hero text === */}
              {hasImage ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-12 md:py-16 min-h-[280px]">
                  {/* "You're invited" badge */}
                  <div className="inline-flex items-center gap-1.5 bg-white/15 dark:bg-cream-2/15 backdrop-blur-sm border border-white/20 text-white/80 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5">
                    <Sparkles className="h-3 w-3" /> You&apos;re invited
                  </div>

                  {/* Event name */}
                  <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {event?.event_name ?? <span className="opacity-30 animate-pulse">Loading…</span>}
                  </h1>

                  {/* Personal message */}
                  {event?.invite_message && (
                    <p className="text-white/80 text-sm italic mb-5 max-w-md leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                      &ldquo;{event.invite_message}&rdquo;
                    </p>
                  )}

                  {/* Event details row — frosted pill */}
                  {event && (
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3">
                      <div className="flex items-center gap-1.5 text-white/85 text-xs font-medium">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-white/50" />
                        {format(new Date(event.event_date), 'EEE, d MMM yyyy')}
                      </div>
                      <div className="flex items-center gap-1.5 text-white/85 text-xs font-medium">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-white/50" />
                        {[event.venue, event.city].filter(Boolean).join(', ')}
                      </div>
                      {event.guest_count > 0 && (
                        <div className="flex items-center gap-1.5 text-white/85 text-xs font-medium">
                          <Users className="h-3.5 w-3.5 shrink-0 text-white/50" />
                          {event.guest_count.toLocaleString()} guests
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-event pills */}
                  {subEvents.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {subEvents.map(se => (
                        <span key={se.id} className="inline-flex items-center gap-1.5 bg-white/10 dark:bg-cream-2/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full border border-white/15">
                          {se.name}
                          <span className="text-white/40">{format(new Date(se.event_date), 'd MMM')}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* === Gradient mode: left-aligned layout === */
                <div className="px-7 pt-8 pb-6 md:px-10 md:pt-10">
                  {/* "You're invited" label */}
                  <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme.accent}`}>
                    You&apos;re invited
                  </div>

                  {/* Event name */}
                  <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
                    {event?.event_name ?? <span className="opacity-30 animate-pulse">Loading…</span>}
                  </h1>

                  {/* Personal message */}
                  {event?.invite_message && (
                    <p className="text-white/75 text-sm italic mb-4 max-w-xl leading-relaxed">
                      &ldquo;{event.invite_message}&rdquo;
                    </p>
                  )}

                  {/* Event details */}
                  {event && (
                    <div className="flex flex-wrap gap-4 mb-5">
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <CalendarDays className={`h-4 w-4 shrink-0 ${theme.accent}`} />
                        {format(new Date(event.event_date), 'EEEE, d MMMM yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <MapPin className={`h-4 w-4 shrink-0 ${theme.accent}`} />
                        {[event.venue, event.city, event.state].filter(Boolean).join(', ')}
                      </div>
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Users className={`h-4 w-4 shrink-0 ${theme.accent}`} />
                        {event.guest_count.toLocaleString()} expected guests
                      </div>
                    </div>
                  )}

                  {/* Sub-event pills */}
                  {subEvents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {subEvents.map(se => (
                        <span key={se.id} className="inline-flex items-center gap-1.5 bg-white/10 dark:bg-cream-2/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">
                          {se.name}
                          <span className="text-white/40">{format(new Date(se.event_date), 'd MMM')}</span>
                        </span>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* ── Action buttons & stats bar (below the hero) ── */}
              <div className={`px-6 py-4 md:px-10 ${hasImage ? 'bg-black/40 backdrop-blur-sm border-t border-white/10' : ''}`}>
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowAdd(true)}
                    className="inline-flex items-center gap-2 bg-white dark:bg-cream-2 text-text-1 font-bold text-sm px-5 py-2.5 rounded-2xl shadow-lg hover:bg-cream transition-colors">
                    <Plus className="h-4 w-4" /> Add guests
                  </button>
                  {pendingWithEmail > 0 && (
                    <button onClick={() => bulkSend('pending')} disabled={!!bulkSending}
                      className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/30 text-amber-200 text-sm font-medium px-5 py-2.5 rounded-2xl hover:bg-amber-400/30 transition-colors disabled:opacity-50">
                      {bulkSending === 'pending'
                        ? <><span className="animate-spin h-4 w-4 border-2 border-amber-200/30 border-t-amber-200 rounded-full" />Sending…</>
                        : <><Bell className="h-4 w-4" /> Remind {pendingWithEmail}</>}
                    </button>
                  )}
                  {total > 0 && (
                    <button onClick={() => bulkSend('all')} disabled={!!bulkSending}
                      className="inline-flex items-center gap-2 bg-white/10 dark:bg-cream-2/10 text-white/80 text-sm font-medium px-5 py-2.5 rounded-2xl hover:bg-white/20 transition-colors disabled:opacity-50">
                      {bulkSending === 'all'
                        ? <><span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />Sending…</>
                        : <><Send className="h-4 w-4" /> Send all invites</>}
                    </button>
                  )}
                  {/* Edit banner — always available */}
                  <button onClick={() => setEditBanner(b => !b)}
                    className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-2xl transition-colors ${
                      editBanner
                        ? 'bg-white dark:bg-cream-2 text-brand shadow'
                        : 'bg-white/90 dark:bg-cream-2/90 text-text-2 hover:bg-white dark:hover:bg-cream-2 shadow'
                    }`}>
                    <Pencil className="h-3.5 w-3.5" /> Edit banner
                  </button>
                  <button
                    onClick={() => { setEditBanner(true); setEditorTab('upload') }}
                    className="inline-flex items-center gap-2 bg-white/90 dark:bg-cream-2/90 text-text-2 hover:bg-white dark:hover:bg-cream-2 text-sm font-semibold px-4 py-2.5 rounded-2xl shadow transition-colors">
                    <Upload className="h-3.5 w-3.5" /> Upload photo
                  </button>
                </div>
              </div>

              {/* Invite link mode indicator */}
              <div className="px-6 py-3 md:px-10">
                {websiteSlug ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 bg-green-400/20 text-green-200 border border-green-300/20 px-3 py-1.5 rounded-full font-medium">
                      <ExternalLink className="h-3 w-3" /> Guests will land on your event website
                    </span>
                    <Link href={`/events/${eventId}/website`} className="text-white/50 underline underline-offset-2 hover:text-white/80">
                      Edit website
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1.5 bg-white/10 dark:bg-cream-2/10 text-white/60 border border-white/10 px-3 py-1.5 rounded-full font-medium">
                      <Link2 className="h-3 w-3" /> Guests will receive a simple RSVP link
                    </span>
                    <Link href={`/events/${eventId}/website`} className="text-amber-300/80 underline underline-offset-2 hover:text-amber-200 font-medium">
                      Create an event website for a branded experience
                    </Link>
                  </div>
                )}
              </div>

              {/* RSVP bar */}
              {total > 0 && (
                <div className="px-7 pb-7 md:px-10 md:pb-8">
                  <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
                    <span>RSVP progress</span>
                    <span>{respondedPct}% responded</span>
                  </div>
                  <div className="h-1.5 bg-white/10 dark:bg-cream-2/10 rounded-full overflow-hidden flex">
                    <div className="bg-green-400 h-full transition-all duration-700" style={{ width: `${respondedPct}%` }} />
                    <div className="bg-red-400/70 h-full transition-all duration-700" style={{ width: `${declinedPct}%` }} />
                  </div>
                  <div className="flex gap-5 mt-2 text-xs text-white/30">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" />Responded</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400/70" />Declined</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20 dark:bg-cream-2/20" />Pending</span>
                  </div>
                </div>
              )}

              <div className={`h-1 bg-gradient-to-r ${theme.band} opacity-60`} />
            </div>
          </div>
        )
      })()}

      {/* ── Invitation editor panel ──────────────────────────────────────── */}
      {editBanner && (
        <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
            <h3 className="text-sm font-bold text-text-1 flex items-center gap-2">
              <Palette className="h-4 w-4 text-brand" /> Design your invitation banner
            </h3>
            <button onClick={() => setEditBanner(false)} className="p-1 text-text-4 hover:text-text-3 rounded-xl transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-brand-border">
            {([
              { key: 'photos', label: '📷 Backgrounds' },
              { key: 'colors', label: '🎨 Colour themes' },
              { key: 'upload', label: '⬆️ Upload your own' },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setEditorTab(tab.key)}
                className={`flex-1 text-xs font-semibold py-3 transition-colors ${
                  editorTab === tab.key
                    ? 'text-brand border-b-2 border-brand bg-cream/50'
                    : 'text-text-4 hover:text-text-2'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5">
            {/* ── Photos tab ── */}
            {editorTab === 'photos' && (
              <div>
                <p className="text-xs text-text-4 mb-3">
                  Pick a background — your event name and details will appear on top automatically.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PHOTO_BACKGROUNDS.map(photo => {
                    const isActive = (pendingImageUrl ?? event?.invite_image_url) === photo.url
                    return (
                      <button key={photo.id} onClick={() => setPendingImageUrl(photo.url)}
                        className={`relative rounded-xl overflow-hidden aspect-video ring-2 transition-all ${
                          isActive ? 'ring-brand ring-offset-1' : 'ring-transparent hover:ring-brand-border'
                        }`}>
                        <img src={photo.thumb} alt={photo.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-end p-1.5">
                          <span className="text-white text-[10px] font-semibold">{photo.label}</span>
                        </div>
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 bg-brand rounded-full p-0.5">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {/* Clear to gradient */}
                  {(event?.invite_image_url || pendingImageUrl) && (
                    <button
                      onClick={() => { setPendingImageUrl(null); clearBannerImage() }}
                      className="rounded-xl border-2 border-dashed border-brand-border aspect-video flex flex-col items-center justify-center gap-1 text-text-4 hover:border-brand-border hover:text-text-4 transition-colors">
                      <X className="h-4 w-4" />
                      <span className="text-[10px] font-medium">Use colour theme</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Colours tab ── */}
            {editorTab === 'colors' && (
              <div>
                <p className="text-xs text-text-4 mb-3">Choose a colour theme for when no photo is selected.</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3" style={{gridTemplateColumns:'repeat(auto-fill,minmax(68px,1fr))'}}>
                  {THEMES.map(t => (
                    <button key={t.key} onClick={() => setBannerTheme(t.key)}
                      className="flex flex-col items-center gap-1.5">
                      <div className={`w-full aspect-video rounded-xl bg-gradient-to-br ${t.bg} ring-2 transition-all ${
                        bannerTheme === t.key ? 'ring-text-1 ring-offset-2' : 'ring-transparent hover:ring-brand-border'
                      }`} />
                      <span className={`text-[10px] font-medium ${bannerTheme === t.key ? 'text-text-1' : 'text-text-4'}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Upload tab ── */}
            {editorTab === 'upload' && (
              <div>
                <p className="text-xs text-text-4 mb-3">
                  Upload a JPG or PNG you designed in Canva, Photoshop, or anywhere else. Recommended size: 1600 × 600 px.
                </p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f) }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={bannerUploading}
                  className="w-full flex flex-col items-center gap-3 border-2 border-dashed border-brand-border rounded-2xl p-8 hover:border-brand hover:bg-cream/30 transition-all disabled:opacity-50 group">
                  {bannerUploading ? (
                    <>
                      <span className="animate-spin h-8 w-8 rounded-full border-2 border-brand-border border-t-brand" />
                      <span className="text-sm text-text-4">Uploading…</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-cream group-hover:bg-cream-2 flex items-center justify-center transition-colors">
                        <Upload className="h-5 w-5 text-text-4 group-hover:text-brand transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-text-2">Click to upload</p>
                        <p className="text-xs text-text-4 mt-0.5">JPG, PNG or WebP · max 10 MB</p>
                      </div>
                    </>
                  )}
                </button>
                {event?.invite_image_url && !PHOTO_BACKGROUNDS.some(p => p.url === event.invite_image_url) && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-cream rounded-xl">
                    <img src={event.invite_image_url} alt="Current" className="h-12 w-20 object-cover rounded-xl border border-brand-border" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-text-2">Current upload</p>
                      <button onClick={clearBannerImage} className="text-xs text-red-500 hover:text-red-700 mt-0.5 transition-colors">Remove</button>
                    </div>
                  </div>
                )}
                <a href="https://www.canva.com/templates/?query=wedding+invitation+banner" target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                  <ImagePlus className="h-3.5 w-3.5" /> Design a banner on Canva (free) →
                </a>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button onClick={saveBannerSettings} disabled={bannerSaving}
                className="inline-flex items-center gap-2 text-sm font-bold bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {bannerSaving
                  ? <><span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" />Saving…</>
                  : <><Check className="h-3.5 w-3.5" /> Apply banner</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invitation settings panel ─────────────────────────────────── */}
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setEditEventInfo(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream transition-colors">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand" />
            <span className="text-sm font-bold text-text-1">Invitation settings</span>
            {(event?.invite_message || event?.dietary_options?.length || event?.collect_allergens) && (
              <span className="text-xs bg-cream text-brand font-semibold px-2 py-0.5 rounded-full">Configured</span>
            )}
          </div>
          {editEventInfo ? <ChevronRight className="h-4 w-4 text-text-4 rotate-90 transition-transform" /> : <ChevronRight className="h-4 w-4 text-text-4 transition-transform" />}
        </button>

        {editEventInfo && (
          <div className="px-5 pb-5 space-y-5 border-t border-brand-border pt-4">

            {/* Personal message */}
            <div>
              <label className="text-xs font-semibold text-text-4 uppercase tracking-wide block mb-1">
                Personal message
              </label>
              <p className="text-xs text-text-4 mb-2">Shown on the invitation banner your guests see.</p>
              <textarea
                value={bannerMsg}
                onChange={e => setBannerMsg(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="e.g. Join us as we celebrate our special day…"
                className="w-full text-sm border border-brand-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
              <p className="text-xs text-text-4 text-right mt-1">{bannerMsg.length}/500</p>
            </div>

            {/* What to collect from guests */}
            <div className="space-y-4">
              <label className="text-xs font-semibold text-text-4 uppercase tracking-wide block">
                What would you like to know from guests?
              </label>

              {/* Meal preference */}
              <div className="rounded-2xl border border-brand-border p-5 space-y-4 bg-cream/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-1">🍽 Meal preference</p>
                    <p className="text-xs text-text-4 mt-0.5">Ask guests which food type they prefer</p>
                  </div>
                  <button type="button" onClick={() => setMealPrefOn(v => !v)}
                    className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${mealPrefOn ? 'bg-brand' : 'bg-cream-2'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-cream-2 rounded-full shadow transition-transform ${mealPrefOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {mealPrefOn && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-text-4">What food will you be serving? <span className="text-text-4">(select all that apply)</span></p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_DIETARY_OPTIONS.map(opt => {
                        const checked = dietaryOpts.includes(opt.value)
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => setDietaryOpts(prev =>
                              checked ? prev.filter(v => v !== opt.value) : [...prev, opt.value]
                            )}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${
                              checked ? 'border-brand bg-cream text-brand' : 'border-brand-border bg-white dark:bg-cream-2 text-text-4 hover:border-brand-border'
                            }`}>
                            {opt.emoji} {opt.label}
                          </button>
                        )
                      })}
                    </div>
                    {dietaryOpts.length === 0 && (
                      <p className="text-xs text-amber-600">Select at least one food type being served</p>
                    )}
                  </div>
                )}
              </div>

              {/* Allergens */}
              <div className="rounded-2xl border border-brand-border p-5 bg-cream/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-1">🌿 Allergy & dietary needs</p>
                    <p className="text-xs text-text-4 mt-0.5">Ask guests about nut, gluten, dairy or egg allergies</p>
                  </div>
                  <button type="button" onClick={() => setCollectAllergens(v => !v)}
                    className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${collectAllergens ? 'bg-brand' : 'bg-cream-2'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white dark:bg-cream-2 rounded-full shadow transition-transform ${collectAllergens ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={saveEventInfo} disabled={infoSaving}
                className="inline-flex items-center gap-2 text-sm font-bold bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {infoSaving
                  ? <><span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" />Saving…</>
                  : <><Check className="h-3.5 w-3.5" /> Save settings</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {bulkResult && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-2xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> {bulkResult}
        </div>
      )}

      {/* ── No sub-events warning ──────────────────────────────────────── */}
      {noSubEvents && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Set up sub-events first</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Guests are invited to specific occasions (e.g. Mehendi, Reception). Add at least one sub-event to start inviting.
            </p>
            <Link href={`/events/${eventId}/sub-events`}
              className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors">
              Add sub-events <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── RSVP Stats strip ─────────────────────────────────────────── */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total invited', value: total,      sub: 'households',  color: 'text-text-1',   bg: 'bg-cream',   border: 'border-brand-border' },
            { label: 'Attending',     value: totalGuests, sub: 'guests',      color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
            { label: 'Awaiting RSVP', value: pending,    sub: 'households',  color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
            { label: 'Declined',      value: declined,   sub: 'households',  color: 'text-rose-700',   bg: 'bg-rose-50',   border: 'border-rose-200' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl px-4 py-3.5`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs font-semibold text-text-3 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-text-4">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Dietary breakdown by sub-event ───────────────────────────── */}
      {subEventStats.filter(s => s.attendees.length > 0).length > 0 && (
        <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-border flex items-center gap-2">
            <span className="text-sm font-bold text-text-1">Dietary by Occasion</span>
            <span className="text-xs text-text-4">(from confirmed RSVPs)</span>
          </div>
          <div className="divide-y divide-brand-border">
            {subEventStats.filter(s => s.attendees.length > 0).map(({ se, counts, attendees }) => (
              <div key={se.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="min-w-[130px]">
                  <p className="text-sm font-semibold text-text-1">{se.name}</p>
                  <p className="text-xs text-text-4">{attendees.length} attending</p>
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {Object.entries(counts).map(([type, n]) => (
                    <span key={type} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${DIETARY_COLOR[type] ?? 'bg-cream text-text-2 border-brand-border'}`}>
                      {n} × {DIETARY_LABEL[type] ?? type}
                    </span>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    await fetch(`/api/events/${eventId}/guests/apply-dietary`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sub_event_id: se.id }),
                    })
                  }}
                  className="text-xs text-brand font-semibold border border-brand-border rounded-full px-3 py-1 hover:bg-cream transition-colors whitespace-nowrap shrink-0"
                >
                  Sync to catering →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Guest list ───────────────────────────────────────────────── */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-text-1">Guest List</h2>
            {total > 0 && (
              <span className="text-xs font-semibold bg-cream text-text-3 px-2.5 py-1 rounded-full">{total} {total === 1 ? 'household' : 'households'}</span>
            )}
          </div>
          {!noSubEvents && (
            <div className="flex items-center gap-2">
              <button onClick={openGuestBook}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-3 border border-brand-border bg-white dark:bg-cream-2 px-3 py-2 rounded-xl hover:bg-cream transition-colors">
                <Users className="h-3.5 w-3.5" /> Guest Book
              </button>
              {households.length > 0 && (
                <button onClick={saveToGuestBook}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-3 border border-brand-border bg-white dark:bg-cream-2 px-3 py-2 rounded-xl hover:bg-cream transition-colors">
                  <Upload className="h-3.5 w-3.5" /> Save to Book
                </button>
              )}
              <button onClick={() => { setShowImport(true); setShowAdd(false); setShowGuestBook(false) }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-3 border border-brand-border bg-white dark:bg-cream-2 px-3 py-2 rounded-xl hover:bg-cream transition-colors">
                <Download className="h-3.5 w-3.5" /> Import
              </button>
              <button onClick={() => { setShowAdd(true); setShowImport(false); setShowGuestBook(false) }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl transition-colors shadow-sm">
                <Plus className="h-4 w-4" /> Add guests
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        {total > 0 && (
          <div className="flex items-center gap-1 bg-cream rounded-xl p-1 mb-4 w-fit">
            {(['all', 'responded', 'pending', 'declined'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold capitalize transition-all ${
                  filter === f ? 'bg-white dark:bg-cream-2 text-text-1 shadow-sm' : 'text-text-4 hover:text-text-2'
                }`}>
                {f}
                {f === 'responded' && responded > 0 && (
                  <span className="ml-1.5 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{responded}</span>
                )}
                {f === 'pending' && pending > 0 && (
                  <span className="ml-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pending}</span>
                )}
                {f === 'declined' && declined > 0 && (
                  <span className="ml-1.5 bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{declined}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Add multiple guests form */}
        {showAdd && (
          <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 mb-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-1 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-brand" /> Add guests
              </h3>
              <button onClick={() => { setShowAdd(false); setGuestRows([{ label: '', email: '' }]) }}
                className="p-1 text-text-4 hover:text-text-3 rounded-xl transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Guest rows */}
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-1">
                <span className="text-[10px] font-semibold text-text-4 uppercase tracking-wide">Name / Family *</span>
                <span className="text-[10px] font-semibold text-text-4 uppercase tracking-wide">Email (for invite)</span>
                <span />
              </div>
              {guestRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input
                    type="text"
                    value={row.label}
                    onChange={e => setGuestRows(rows => rows.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
                    placeholder="e.g. Sharma Family"
                    className="text-sm border border-brand-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                  <input
                    type="email"
                    value={row.email}
                    onChange={e => setGuestRows(rows => rows.map((r, i) => i === idx ? { ...r, email: e.target.value } : r))}
                    placeholder="email@example.com"
                    className="text-sm border border-brand-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                  />
                  {guestRows.length > 1 ? (
                    <button onClick={() => setGuestRows(rows => rows.filter((_, i) => i !== idx))}
                      className="p-2 text-text-4 hover:text-red-500 transition-colors rounded-xl">
                      <X className="h-4 w-4" />
                    </button>
                  ) : <div className="w-8" />}
                </div>
              ))}
              <button onClick={() => setGuestRows(rows => [...rows, { label: '', email: '' }])}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-hover transition-colors mt-1">
                <Plus className="h-3.5 w-3.5" /> Add another guest
              </button>
            </div>

            {/* Occasions */}
            {subEvents.length > 0 && (
              <div>
                <label className="text-xs font-medium text-text-4 block mb-2">Invite to occasion *</label>
                <div className="flex flex-wrap gap-2">
                  {subEvents.map(se => {
                    const sel = form.sub_event_ids.includes(se.id)
                    return (
                      <button key={se.id} type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          sub_event_ids: sel ? f.sub_event_ids.filter(x => x !== se.id) : [...f.sub_event_ids, se.id],
                        }))}
                        className={`text-xs px-3.5 py-2 rounded-xl border transition-all font-medium ${
                          sel ? 'border-brand bg-cream text-brand' : 'border-brand-border text-text-3 hover:border-brand-border bg-white dark:bg-cream-2'
                        }`}>
                        {sel && <Check className="inline h-3 w-3 mr-1" />}
                        {se.name}
                        <span className="ml-1.5 text-text-4 font-normal">{format(new Date(se.event_date), 'd MMM')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => { setShowAdd(false); setGuestRows([{ label: '', email: '' }]) }}
                className="text-sm text-text-4 border border-brand-border rounded-xl px-4 py-2 hover:bg-cream transition-colors">
                Cancel
              </button>
              <button onClick={addHousehold}
                disabled={saving || !guestRows.some(r => r.label.trim()) || (subEvents.length > 0 && form.sub_event_ids.length === 0)}
                className="flex items-center gap-2 text-sm font-bold bg-brand hover:bg-brand-hover text-white px-5 py-2 rounded-xl transition-colors disabled:opacity-50">
                {saving
                  ? <><span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" /> Adding…</>
                  : <><Plus className="h-3.5 w-3.5" /> Add {guestRows.filter(r => r.label.trim()).length || ''} to list</>}
              </button>
            </div>
          </div>
        )}

        {/* Paste-import panel */}
        {showImport && (
          <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 mb-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-1 flex items-center gap-2">
                <Download className="h-4 w-4 text-brand" /> Import guest list
              </h3>
              <button onClick={() => setShowImport(false)} className="p-1 text-text-4 hover:text-text-3 rounded-xl transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-text-4">Paste names and emails — one per line. Format: <code className="bg-cream px-1.5 py-0.5 rounded text-text-2">Name, email@example.com</code></p>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              rows={6}
              placeholder={"Sharma Family, sharma@gmail.com\nGupta Family, gupta@gmail.com\nAli Family"}
              className="w-full text-sm font-mono border border-brand-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
            />

            {/* Occasion picker */}
            {subEvents.length > 0 && (
              <div>
                <label className="text-xs font-medium text-text-4 block mb-2">Invite to occasion *</label>
                <div className="flex flex-wrap gap-2">
                  {subEvents.map(se => {
                    const sel = form.sub_event_ids.includes(se.id)
                    return (
                      <button key={se.id} type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          sub_event_ids: sel ? f.sub_event_ids.filter(x => x !== se.id) : [...f.sub_event_ids, se.id],
                        }))}
                        className={`text-xs px-3.5 py-2 rounded-xl border transition-all font-medium ${
                          sel ? 'border-brand bg-cream text-brand' : 'border-brand-border text-text-3 hover:border-brand-border bg-white dark:bg-cream-2'
                        }`}>
                        {sel && <Check className="inline h-3 w-3 mr-1" />}
                        {se.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-text-4 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              To import from Gmail or Contacts, export contacts as CSV and paste the Name + Email columns here.
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowImport(false)}
                className="text-sm text-text-4 border border-brand-border rounded-xl px-4 py-2 hover:bg-cream transition-colors">
                Cancel
              </button>
              <button onClick={importGuests}
                disabled={importSaving || !importText.trim() || (subEvents.length > 0 && form.sub_event_ids.length === 0)}
                className="flex items-center gap-2 text-sm font-bold bg-brand hover:bg-brand-hover text-white px-5 py-2 rounded-xl transition-colors disabled:opacity-50">
                {importSaving
                  ? <><span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" /> Importing…</>
                  : <><Download className="h-3.5 w-3.5" /> Import guests</>}
              </button>
            </div>
          </div>
        )}

        {/* Guest Book import panel */}
        {showGuestBook && (
          <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl p-5 mb-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-1 flex items-center gap-2">
                <Users className="h-4 w-4 text-brand" /> Import from Guest Book
              </h3>
              <button onClick={() => setShowGuestBook(false)} className="p-1 text-text-4 hover:text-text-3 rounded-xl transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {guestBookLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="animate-spin h-5 w-5 rounded-full border-2 border-brand/30 border-t-brand" />
              </div>
            ) : guestBookContacts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-text-3">Your guest book is empty.</p>
                <a href="/contacts" className="text-sm text-brand font-semibold hover:underline mt-1 inline-block">
                  Add contacts to your Guest Book
                </a>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-text-2 cursor-pointer">
                    <input type="checkbox"
                      checked={guestBookSelected.size === guestBookContacts.length}
                      onChange={toggleAllGuestBook}
                      className="rounded border-brand-border text-brand focus:ring-brand" />
                    Select all ({guestBookContacts.length})
                  </label>
                  {guestBookSelected.size > 0 && (
                    <span className="text-xs text-brand font-bold">{guestBookSelected.size} selected</span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto border border-brand-border/40 rounded-xl divide-y divide-brand-border/30">
                  {guestBookContacts.map(c => (
                    <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream/50 cursor-pointer transition-colors">
                      <input type="checkbox"
                        checked={guestBookSelected.has(c.id)}
                        onChange={() => toggleGuestBookContact(c.id)}
                        className="rounded border-brand-border text-brand focus:ring-brand" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-text-1">{c.label}</span>
                        {c.email && <span className="text-xs text-text-4 ml-2">{c.email}</span>}
                      </div>
                      {c.tags.length > 0 && (
                        <div className="flex gap-1">
                          {c.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cream text-brand border border-brand-border/60">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button onClick={() => setShowGuestBook(false)}
                    className="text-sm text-text-4 border border-brand-border rounded-xl px-4 py-2 hover:bg-cream transition-colors">
                    Cancel
                  </button>
                  <button onClick={importFromGuestBook}
                    disabled={guestBookImporting || guestBookSelected.size === 0}
                    className="flex items-center gap-2 text-sm font-bold bg-brand hover:bg-brand-hover text-white px-5 py-2 rounded-xl transition-colors disabled:opacity-50">
                    {guestBookImporting
                      ? <><span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" /> Importing…</>
                      : <><Users className="h-3.5 w-3.5" /> Import {guestBookSelected.size} guest{guestBookSelected.size !== 1 ? 's' : ''}</>}
                  </button>
                </div>
                {guestBookResult && (
                  <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {guestBookResult.imported} imported{guestBookResult.skipped > 0 ? `, ${guestBookResult.skipped} already in this event` : ''}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Guest cards */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[72px] bg-white dark:bg-cream-2 border border-brand-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredHouseholds.length === 0 ? (
          <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-3xl py-16 text-center shadow-sm">
            <div className="w-14 h-14 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-brand" />
            </div>
            <p className="text-base font-bold text-text-2 mb-1">
              {households.length === 0 ? 'No guests yet' : `No ${filter} guests`}
            </p>
            <p className="text-sm text-text-4 mb-6">
              {households.length === 0
                ? 'Add your first guest to start sending invites.'
                : 'Switch the filter above to see other guests.'}
            </p>
            {households.length === 0 && !noSubEvents && (
              <button onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
                <Plus className="h-4 w-4" /> Add first guest
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHouseholds.map(h => {
              const hasResponded = h.invites.some(i => i.responded_at)
              const totalAttendees = h.invites.reduce((s, i) => s + i.attendees.length, 0)
              const allAttendees   = h.invites.flatMap(i => i.attendees)
              const subNames = h.invites.map(i => i.sub_event.name)

              const statusBorder = h.declined
                ? 'border-l-brand-border'
                : hasResponded
                ? 'border-l-green-400'
                : 'border-l-amber-400'

              return (
                <div key={h.id}
                  className={`bg-white dark:bg-cream-2 border border-brand-border border-l-4 ${statusBorder} rounded-2xl px-4 py-4 flex items-center gap-4 transition-all hover:shadow-md hover:border-brand-border ${h.declined ? 'opacity-60' : ''}`}>

                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ring-2 ring-white shadow-sm ${avatarColor(h.label)}`}>
                    {initials(h.label)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-text-1">{h.label}</span>
                      {h.declined ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-cream text-text-4 px-2 py-0.5 rounded-full font-semibold">
                          <XCircle className="h-3 w-3" /> Declined
                        </span>
                      ) : hasResponded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> {totalAttendees} {totalAttendees === 1 ? 'guest' : 'guests'} coming
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                          <Clock className="h-3 w-3" /> Awaiting RSVP
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-4">
                      {h.email && <span className="truncate max-w-[180px]">{h.email}</span>}
                      {subNames.length > 0 && (
                        <span className="flex items-center gap-1">
                          {subNames.map((n, i) => (
                            <span key={i} className="inline-block bg-cream text-text-3 text-[10px] font-semibold px-2 py-0.5 rounded-full">{n}</span>
                          ))}
                        </span>
                      )}
                      {!h.email && !h.declined && !hasResponded && (
                        <span className="italic text-text-4">no email — share link manually</span>
                      )}
                    </div>
                    {hasResponded && allAttendees.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {allAttendees.map((a, idx) => (
                          <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${DIETARY_COLOR[a.dietary_type] ?? 'bg-cream text-text-3 border-brand-border'}`}>
                            {DIETARY_LABEL[a.dietary_type] ?? a.dietary_type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Remind button — prominent for non-responders with email */}
                    {!hasResponded && !h.declined && h.email && (
                      <button onClick={() => sendInvite(h.id)} disabled={sendingId === h.id}
                        title="Resend invite"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 px-2.5 py-1.5 rounded-xl transition-colors disabled:opacity-40">
                        {sendingId === h.id
                          ? <span className="animate-spin h-3 w-3 rounded-full border-2 border-amber-300 border-t-amber-700 inline-block" />
                          : <><Bell className="h-3 w-3" /> Remind</>}
                      </button>
                    )}
                    <button onClick={() => copyLink(h.token, h.id)} title="Copy RSVP link"
                      className="p-2 text-text-4 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                      {copiedId === h.id ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
                    </button>
                    {h.email && hasResponded && (
                      <button onClick={() => sendInvite(h.id)} disabled={sendingId === h.id}
                        title="Re-send invite"
                        className="p-2 text-text-4 hover:text-brand hover:bg-cream rounded-xl transition-colors disabled:opacity-40">
                        {sendingId === h.id
                          ? <span className="animate-spin h-4 w-4 rounded-full border-2 border-brand-border border-t-text-4 inline-block" />
                          : <Mail className="h-4 w-4" />}
                      </button>
                    )}
                    {!h.declined && (
                      <button onClick={() => markDeclined(h.id)} title="Mark as declined"
                        className="p-2 text-text-4 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => remove(h.id)} title="Remove"
                      className="p-2 text-text-4 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Send invitations panel ───────────────────────────────────── */}
      {total > 0 && (
        <div className="bg-gradient-to-br from-cream to-cream border border-brand-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-text-1 mb-0.5">Send Invitations</h3>
              <p className="text-xs text-text-4">
                {pendingWithEmail > 0
                  ? `${pendingWithEmail} guest${pendingWithEmail > 1 ? 's' : ''} haven't received their invite yet.`
                  : 'All guests with email have been invited.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingWithEmail > 0 && (
                <button onClick={() => bulkSend('pending')} disabled={!!bulkSending}
                  className="inline-flex items-center gap-2 text-sm font-bold bg-brand hover:bg-brand-hover text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {bulkSending === 'pending'
                    ? <><span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" /> Sending…</>
                    : <><Bell className="h-3.5 w-3.5" /> Remind {pendingWithEmail} pending</>}
                </button>
              )}
              <button onClick={() => bulkSend('all')} disabled={!!bulkSending}
                className="inline-flex items-center gap-2 text-sm font-medium border border-brand-border text-brand bg-white dark:bg-cream-2 px-4 py-2.5 rounded-xl hover:bg-cream transition-colors disabled:opacity-50">
                {bulkSending === 'all'
                  ? <><span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-brand-border border-t-brand" /> Sending…</>
                  : <><Send className="h-3.5 w-3.5" /> Re-send to all</>}
              </button>
            </div>
          </div>
          <p className="text-xs text-text-4 mt-3 flex items-center gap-1">
            <Link2 className="inline h-3 w-3 shrink-0" />
            No email? Copy each guest&apos;s personal RSVP link using the link icon and share via WhatsApp or SMS.
          </p>
        </div>
      )}

      {/* ── Send event update ─────────────────────────────────────────── */}
      {total > 0 && (
        <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowUpdate(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream transition-colors">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-bold text-text-1">Send Event Update</span>
              <span className="text-xs text-text-4">Notify all guests of a change</span>
            </div>
            <ChevronRight className={`h-4 w-4 text-text-4 transition-transform ${showUpdate ? 'rotate-90' : ''}`} />
          </button>
          {showUpdate && (
            <div className="px-5 pb-5 space-y-4 border-t border-brand-border pt-4">
              {updateResult ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> {updateResult}
                </div>
              ) : (
                <>
                  <p className="text-xs text-text-4">Write a message to all invited guests (e.g. venue change, time update, new detail).</p>
                  <input
                    value={updateSubject}
                    onChange={e => setUpdateSubject(e.target.value)}
                    placeholder="Subject — e.g. Venue has changed"
                    maxLength={150}
                    className="w-full text-sm border border-brand-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                  />
                  <textarea
                    value={updateMessage}
                    onChange={e => setUpdateMessage(e.target.value)}
                    placeholder="Dear guests, we wanted to let you know that…"
                    rows={4}
                    maxLength={2000}
                    className="w-full text-sm border border-brand-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all"
                  />
                  <div className="flex justify-end">
                    <button onClick={sendUpdate}
                      disabled={updateSending || !updateSubject.trim() || !updateMessage.trim()}
                      className="inline-flex items-center gap-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                      {updateSending
                        ? <><span className="animate-spin h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white" /> Sending…</>
                        : <><Send className="h-3.5 w-3.5" /> Send to all guests</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Public RSVP links ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-cream-2 border border-brand-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border flex items-center gap-2">
          <Link2 className="h-4 w-4 text-text-4" />
          <span className="text-sm font-bold text-text-1">Guest RSVP Links</span>
          <span className="text-xs text-text-4">Share these to collect RSVPs without email</span>
        </div>
        {households.length === 0 ? (
          <p className="px-5 py-4 text-sm text-text-4">Add guests first to see their RSVP links.</p>
        ) : (
          <div className="divide-y divide-brand-border max-h-64 overflow-y-auto">
            {households.filter(h => !h.declined).map(h => {
              const rsvpUrl = `${appUrl}/e/${h.token}`
              const hasResponded = h.invites.some(i => i.responded_at)
              return (
                <div key={h.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${hasResponded ? 'bg-green-400' : 'bg-amber-400'}`} />
                  <span className="text-sm font-medium text-text-1 flex-1 min-w-0 truncate">{h.label}</span>
                  <span className="text-xs text-text-4 font-mono hidden sm:block truncate max-w-[180px]">/e/{h.token.slice(0, 12)}…</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => copyLink(h.token, h.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-3 border border-brand-border px-2.5 py-1.5 rounded-xl hover:bg-cream transition-colors">
                      {copiedId === h.id ? <><Check className="h-3 w-3 text-green-500" /> Copied</> : <><Link2 className="h-3 w-3" /> Copy</>}
                    </button>
                    <a href={rsvpUrl} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-text-4 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
