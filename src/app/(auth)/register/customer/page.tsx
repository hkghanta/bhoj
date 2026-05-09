'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function CustomerRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', location: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      // Auto sign-in then go to verification
      await signIn('credentials', {
        email: form.email,
        password: form.password,
        role: 'customer',
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
        <Link href="/" className="text-xl font-extrabold tracking-tight text-text-1">
          One<span className="text-brand">Seva</span>
        </Link>
        <p className="text-sm text-text-4">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-semibold hover:underline">Sign in</Link>
        </p>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-md p-8 flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-1">Plan your celebration</h1>
            <p className="text-sm text-text-4 mt-1">Create a free account to start organising your perfect Indian event</p>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-5 text-xs text-text-4">
            <span className="flex items-center gap-1.5">
              <span className="text-brand">✓</span> Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-brand">✓</span> Verified vendors
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-brand">✓</span> No commitment
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-semibold text-text-2">Full name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={update('name')}
                required
                placeholder="Priya Sharma"
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
                placeholder="you@example.com"
                className="border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-text-4"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-sm font-semibold text-text-2">Phone number</label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                required
                placeholder="+1 555 000 0000"
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
            <div className="flex flex-col gap-1.5">
              <label htmlFor="location" className="text-sm font-semibold text-text-2">City / Location</label>
              <input
                id="location"
                type="text"
                value={form.location}
                onChange={update('location')}
                placeholder="London, UK"
                className="border border-brand-border rounded-xl px-4 py-3 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-text-4"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-extrabold tracking-tight py-3.5 rounded-xl transition-colors disabled:opacity-60"
              style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.28)' }}
            >
              {loading ? 'Creating account…' : 'Create free account →'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-brand-border" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-text-4">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full border border-brand-border bg-white hover:bg-cream text-text-2 text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-text-4">
            Are you a vendor?{' '}
            <Link href="/register/vendor" className="text-brand hover:underline font-semibold">List your business →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
