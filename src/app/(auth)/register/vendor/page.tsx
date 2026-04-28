'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

const VENDOR_TYPES = [
  { value: 'CATERER', label: 'Caterer' },
  { value: 'DECORATOR', label: 'Decorator' },
  { value: 'PHOTOGRAPHER', label: 'Photographer' },
  { value: 'VIDEOGRAPHER', label: 'Videographer' },
  { value: 'DJ', label: 'DJ' },
  { value: 'LIVE_BAND', label: 'Live Band' },
  { value: 'DHOL_PLAYER', label: 'Dhol Player' },
  { value: 'FLORIST', label: 'Florist' },
  { value: 'MEHENDI_ARTIST', label: 'Mehendi Artist' },
  { value: 'MAKEUP_HAIR', label: 'Makeup & Hair' },
  { value: 'PANDIT_OFFICIANT', label: 'Pandit / Officiant' },
  { value: 'BARTENDER', label: 'Bartender' },
  { value: 'DESSERT_VENDOR', label: 'Dessert / Sweet Vendor' },
  { value: 'CHAI_STATION', label: 'Chai Station' },
  { value: 'FOOD_TRUCK', label: 'Food Truck' },
  { value: 'INVITATION_DESIGNER', label: 'Invitation Designer' },
  { value: 'CHOREOGRAPHER', label: 'Choreographer' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'MC_HOST', label: 'MC / Host' },
  { value: 'LIGHTING', label: 'Lighting' },
  { value: 'TENT_MARQUEE', label: 'Tent / Marquee' },
  { value: 'FURNITURE_RENTAL', label: 'Furniture Rental' },
  { value: 'EQUIPMENT_RENTAL', label: 'Equipment Rental' },
  { value: 'GAMES_ENTERTAINMENT', label: 'Games & Entertainment' },
  { value: 'CLASSICAL_MUSICIAN', label: 'Classical Musician' },
]

export default function VendorRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    business_name: '', email: '', password: '',
    vendor_type: '', city: '', country: 'GB', phone_business: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.vendor_type) { setError('Please select a vendor type'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register/vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push('/login?registered=1')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">List your business</CardTitle>
          <CardDescription>Join Bhoj and start receiving quality leads</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{error}</p>}
            <div className="space-y-1">
              <Label>Business name</Label>
              <Input value={form.business_name} onChange={update('business_name')} required />
            </div>
            <div className="space-y-1">
              <Label>Business type</Label>
              <Select onValueChange={(v: string | null) => setForm(f => ({ ...f, vendor_type: v ?? '' }))}>
                <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={form.city} onChange={update('city')} placeholder="London" required />
              </div>
              <div className="space-y-1">
                <Label>Country code</Label>
                <Input value={form.country} onChange={update('country')} placeholder="GB" required maxLength={2} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Business phone</Label>
              <Input value={form.phone_business} onChange={update('phone_business')} type="tel" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={update('email')} required />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={update('password')} required minLength={8} />
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading ? 'Creating account…' : 'Create vendor account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already registered? <Link href="/login" className="text-orange-600 hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
