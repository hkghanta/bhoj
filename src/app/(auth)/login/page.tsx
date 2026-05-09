'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'vendor'>('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', {
      email, password, role,
      redirect: false,
    })
    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      window.location.href = role === 'vendor' ? '/vendor/dashboard' : '/dashboard'
    }
  }

  async function signInAsDemo(demoRole: 'customer' | 'vendor') {
    setLoading(true)
    setError('')
    const demoEmail = demoRole === 'customer' ? 'priya@demo.oneseva' : 'spice@demo.oneseva'
    const result = await signIn('credentials', {
      email: demoEmail,
      password: 'demo1234',
      role: demoRole,
      redirect: false,
    })
    if (result?.error) {
      setError('Demo login failed')
      setLoading(false)
    } else {
      window.location.href = demoRole === 'vendor' ? '/vendor/dashboard' : '/dashboard'
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
          No account?{' '}
          <Link href="/register/customer" className="text-brand font-semibold hover:underline">Sign up free</Link>
        </p>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-xl shadow-black/5 p-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-1">Sign in to OneSeva</h1>
            <p className="text-sm text-text-4 mt-1">Plan your celebration or manage your business</p>
          </div>

          {/* Demo accounts */}
          <div className="rounded-xl border border-brand-border bg-gradient-to-b from-cream/60 to-white p-4 shadow-sm">
            <p className="text-xs font-medium text-text-4 mb-2.5 uppercase tracking-wide">Try a demo account</p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => signInAsDemo('customer')}
                disabled={loading}
                className="flex-1 text-xs bg-white border border-brand-border/80 hover:border-brand/40 hover:shadow-sm text-text-2 font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                Customer — Priya
              </button>
              <button
                type="button"
                onClick={() => signInAsDemo('vendor')}
                disabled={loading}
                className="flex-1 text-xs bg-white border border-brand-border/80 hover:border-brand/40 hover:shadow-sm text-text-2 font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                Vendor — Spice Route
              </button>
            </div>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-xl bg-cream p-1 gap-1">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${role === 'customer' ? 'bg-white text-text-1 shadow-sm' : 'text-text-4 hover:text-text-2'}`}
              onClick={() => setRole('customer')}
            >Customer</button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${role === 'vendor' ? 'bg-white text-text-1 shadow-sm' : 'text-text-4 hover:text-text-2'}`}
              onClick={() => setRole('vendor')}
            >Vendor</button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-text-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="border border-brand-border rounded-xl px-4 h-11 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 transition-all duration-200 placeholder:text-text-4"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-text-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="border border-brand-border rounded-xl px-4 h-11 text-sm text-text-1 bg-white outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 transition-all duration-200 placeholder:text-text-4"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-extrabold py-3.5 h-12 rounded-xl transition-colors disabled:opacity-60"
              style={{ boxShadow: '0 4px 16px rgba(232,85,16,0.22)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-brand-border/40" /></div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-text-4">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full border border-brand-border bg-white hover:bg-cream hover:shadow-md hover:-translate-y-0.5 text-text-2 text-sm font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-text-4">
            No account?{' '}
            <Link href="/register/customer" className="text-brand hover:underline font-semibold">Sign up as customer</Link>
            {' · '}
            <Link href="/register/vendor" className="text-brand hover:underline font-semibold">List your business</Link>
          </p>
          <p className="text-center text-xs text-text-4">
            <Link href="/admin/login" className="hover:text-text-3">Admin panel</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
