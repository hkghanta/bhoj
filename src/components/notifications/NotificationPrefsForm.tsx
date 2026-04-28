'use client'
import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Pref = {
  channel: 'EMAIL' | 'PUSH' | 'WHATSAPP'
  event_type: string
  is_enabled: boolean
}

const VENDOR_EVENTS = [
  { key: 'new_lead', label: 'New lead received' },
  { key: 'quote_viewed', label: 'Quote viewed by customer' },
  { key: 'quote_accepted', label: 'Quote accepted' },
  { key: 'review_posted', label: 'New review posted' },
  { key: 'new_message', label: 'New message' },
]

const CUSTOMER_EVENTS = [
  { key: 'quote_received', label: 'Quote received' },
  { key: 'match_ready', label: 'Matches ready' },
  { key: 'new_message', label: 'New message' },
  { key: 'review_replied', label: 'Vendor replied to your review' },
]

const CHANNELS = ['EMAIL', 'PUSH'] as const

type Props = { role: 'customer' | 'vendor' }

export function NotificationPrefsForm({ role }: Props) {
  const [prefs, setPrefs] = useState<Record<string, Record<string, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const events = role === 'vendor' ? VENDOR_EVENTS : CUSTOMER_EVENTS

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then((data: Pref[]) => {
        const map: Record<string, Record<string, boolean>> = {}
        data.forEach(p => {
          if (!map[p.event_type]) map[p.event_type] = {}
          map[p.event_type][p.channel] = p.is_enabled
        })
        setPrefs(map)
      })
  }, [])

  function getPref(event_type: string, channel: string): boolean {
    return prefs[event_type]?.[channel] ?? true
  }

  function togglePref(event_type: string, channel: string) {
    setPrefs(p => ({
      ...p,
      [event_type]: { ...p[event_type], [channel]: !getPref(event_type, channel) },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const updates: Pref[] = []
    for (const event of events) {
      for (const channel of CHANNELS) {
        updates.push({ channel, event_type: event.key, is_enabled: getPref(event.key, channel) })
      }
    }
    await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold text-gray-900 mb-5">Notification Preferences</h3>

      <div className="space-y-1 mb-4">
        <div className="grid grid-cols-[1fr_100px_100px] gap-4 text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
          <span>Event</span>
          {CHANNELS.map(c => <span key={c} className="text-center">{c}</span>)}
        </div>
      </div>

      <div className="space-y-3">
        {events.map(event => (
          <div
            key={event.key}
            className="grid grid-cols-[1fr_100px_100px] gap-4 items-center px-1 py-2 rounded-lg hover:bg-gray-50"
          >
            <Label className="text-sm text-gray-700 font-normal">{event.label}</Label>
            {CHANNELS.map(channel => (
              <div key={channel} className="flex justify-center">
                <Switch
                  checked={getPref(event.key, channel)}
                  onCheckedChange={() => togglePref(event.key, channel)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={cn(buttonVariants(), 'mt-5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50')}
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Preferences'}
      </button>
    </div>
  )
}
