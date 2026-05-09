'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CityInput } from '@/components/ui/CityInput'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const VENDOR_TYPES = [
  { value: 'CATERER', label: 'Caterer' },
  { value: 'DESSERT_VENDOR', label: 'Dessert Vendor' },
  { value: 'BARTENDER', label: 'Bartender' },
  { value: 'CHAI_STATION', label: 'Chai Station' },
  { value: 'FOOD_TRUCK', label: 'Food Truck' },
  { value: 'DECORATOR', label: 'Decorator' },
  { value: 'FLORIST', label: 'Florist' },
  { value: 'DJ', label: 'DJ' },
  { value: 'LIVE_BAND', label: 'Live Band' },
  { value: 'DHOL_PLAYER', label: 'Dhol Player' },
  { value: 'PHOTOGRAPHER', label: 'Photographer' },
  { value: 'VIDEOGRAPHER', label: 'Videographer' },
  { value: 'MEHENDI_ARTIST', label: 'Mehendi Artist' },
  { value: 'MAKEUP_ARTIST', label: 'Makeup Artist' },
  { value: 'PRIEST', label: 'Priest / Pandit' },
  { value: 'VENUE', label: 'Venue' },
  { value: 'TENT_RENTAL', label: 'Tent Rental' },
  { value: 'LIGHTING', label: 'Lighting' },
  { value: 'SOUND_AV', label: 'Sound & AV' },
  { value: 'INVITATION_DESIGNER', label: 'Invitation Designer' },
  { value: 'CHOREOGRAPHER', label: 'Choreographer' },
  { value: 'EMCEE', label: 'Emcee / MC' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'OTHER', label: 'Other' },
]

type Props = { onNext: () => void }

export function Step1BusinessInfo({ onNext }: Props) {
  const [form, setForm] = useState({
    business_name: '', vendor_type: '', description: '',
    city: '', country: 'US', website: '', instagram: '',
    phone_business: '', travel_radius_miles: 50,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!form.business_name || !form.vendor_type || !form.city) {
      setError('Business name, type and city are required.')
      return
    }
    setSaving(true)
    setError('')
    const res = await fetch('/api/vendor/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) onNext()
    else setError('Failed to save. Please try again.')
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold tracking-tight text-text-1">Tell us about your business</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="space-y-1">
        <Label>Business name *</Label>
        <Input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Spice Garden Catering" />
      </div>

      <div className="space-y-1">
        <Label>Business type *</Label>
        <Select value={form.vendor_type} onValueChange={(v: string | null) => setForm(f => ({ ...f, vendor_type: v ?? '' }))}>
          <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
          <SelectContent>
            {VENDOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1">
          <Label>City *</Label>
          <CityInput value={form.city} onChange={city => setForm(f => ({ ...f, city }))} placeholder="New York, Chicago, Houston…" required />
        </div>
        <div className="space-y-1">
          <Label>Country</Label>
          <Select value={form.country} onValueChange={(v: string | null) => setForm(f => ({ ...f, country: v ?? 'US' }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="IN">India</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>How far can you travel to serve events?</Label>
        <Select
          value={String(form.travel_radius_miles)}
          onValueChange={v => setForm(f => ({ ...f, travel_radius_miles: Number(v) }))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="25">Up to 25 miles</SelectItem>
            <SelectItem value="50">Up to 50 miles</SelectItem>
            <SelectItem value="100">Up to 100 miles</SelectItem>
            <SelectItem value="150">Up to 150 miles</SelectItem>
            <SelectItem value="200">Up to 200 miles</SelectItem>
            <SelectItem value="300">Up to 300 miles</SelectItem>
            <SelectItem value="400">Up to 400 miles</SelectItem>
            <SelectItem value="500">Up to 500 miles</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-text-4">You'll only appear in searches within this radius from your city.</p>
      </div>

      <div className="space-y-1">
        <Label>About your business</Label>
        <Textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe your specialties, experience, and what makes you unique…"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input value={form.phone_business} onChange={e => setForm(f => ({ ...f, phone_business: e.target.value }))} placeholder="+44 20 1234 5678" />
        </div>
        <div className="space-y-1">
          <Label>Website</Label>
          <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://yoursite.com" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-brand hover:bg-brand-hover rounded-xl font-bold">
        {saving ? 'Saving…' : 'Save & Continue →'}
      </Button>
    </div>
  )
}
