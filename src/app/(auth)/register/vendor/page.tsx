'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { CityInput } from '@/components/ui/CityInput'

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
    vendor_type: '', city: '', country: 'US', phone_business: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.vendor_type) { setError('Please select a business type'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register/vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      await signIn('credentials', {
        email: form.email,
        password: form.password,
        role: 'vendor',
        redirect: false,
      })
      router.push('/verify')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream bg-dot-grid flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-brand-border flex items-center justify-between px-8 py-0 h-[62px]">
        <Link href="/" className="text-xl font-extrabold tracking-tight tracking-tight text-text-1">
          One<span className="text-brand">Seva</span>
        </Link>
        <p className="text-sm text-text-4">
          Already registered?{' '}
          <Link href="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
        </p>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6 py-10">
        <div className="w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-md p-8 flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-1">List your business</h1>
            <p className="text-sm text-text-4 mt-1">Join OneSeva and start receiving quality leads for Indian events</p>
          </div>

          {/* Benefits */}
          <div className="rounded-xl border border-brand-border bg-cream p-3.5 flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-text-3 mb-0.5">Why vendors love OneSeva</p>
            <p className="text-xs text-text-4 flex items-center gap-1.5"><span className="text-brand font-bold">✓</span> Receive direct quote requests from event planners</p>
            <p className="text-xs text-text-4 flex items-center gap-1.5"><span className="text-brand font-bold">✓</span> No monthly fees — only pay when it makes sense</p>
            <p className="text-xs text-text-4 flex items-center gap-1.5"><span className="text-brand font-bold">✓</span> Build your profile with reviews and portfolio</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="business_name" className="text-sm font-semibold text-text-2">Business name</label>
              <input
                id="business_name"
                type="text"
                value={form.business_name}
                onChange={update('business_name')}
                required
                placeholder="Spice Route Catering"
                className="border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-text-4"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="vendor_type" className="text-sm font-semibold text-text-2">Business type</label>
              <select
                id="vendor_type"
                value={form.vendor_type}
                onChange={e => setForm(f => ({ ...f, vendor_type: e.target.value }))}
                required
                className="border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 appearance-none"
              >
                <option value="" disabled>Select business type…</option>
                {VENDOR_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-2">City</label>
                <CityInput
                  value={form.city}
                  onChange={city => setForm(f => ({ ...f, city }))}
                  placeholder="London…"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="country" className="text-sm font-semibold text-text-2">Country code</label>
                <input
                  id="country"
                  type="text"
                  value={form.country}
                  onChange={update('country')}
                  placeholder="GB"
                  required
                  maxLength={2}
                  className="border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-text-4 uppercase"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone_business" className="text-sm font-semibold text-text-2">
                Business phone <span className="text-text-4 font-normal">(optional)</span>
              </label>
              <input
                id="phone_business"
                type="tel"
                value={form.phone_business}
                onChange={update('phone_business')}
                placeholder="+44 20 1234 5678"
                className="border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-text-4"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-text-2">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                placeholder="you@yourbusiness.com"
                className="border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-text-4"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-text-2">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-text-4"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-extrabold tracking-tight py-3.5 rounded-xl transition-colors disabled:opacity-60"
              style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}
            >
              {loading ? 'Creating account…' : 'Create vendor account →'}
            </button>
          </form>

          <p className="text-center text-xs text-text-4">
            Looking to plan an event?{' '}
            <Link href="/register/customer" className="text-brand hover:underline font-semibold">Sign up as customer →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
