'use client'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    const demoEmail = demoRole === 'customer' ? 'priya@demo.bhoj' : 'spice@demo.bhoj'
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            <span className="text-orange-600">Bhoj</span> — Sign in
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demo accounts */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
            <p className="text-xs font-medium text-orange-700 mb-2">Try a demo account</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => signInAsDemo('customer')}
                disabled={loading}
                className="flex-1 text-xs bg-white border border-orange-200 hover:bg-orange-100 text-orange-700 font-medium py-2 rounded-md transition-colors disabled:opacity-50"
              >
                Customer — Priya
              </button>
              <button
                type="button"
                onClick={() => signInAsDemo('vendor')}
                disabled={loading}
                className="flex-1 text-xs bg-white border border-orange-200 hover:bg-orange-100 text-orange-700 font-medium py-2 rounded-md transition-colors disabled:opacity-50"
              >
                Vendor — Spice Route
              </button>
            </div>
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium transition-colors ${role === 'customer' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setRole('customer')}
            >Customer</button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium transition-colors ${role === 'vendor' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setRole('vendor')}
            >Vendor</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{error}</p>}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
            Continue with Google
          </Button>
          <p className="text-center text-sm text-gray-500">
            No account?{' '}
            <Link href="/register/customer" className="text-orange-600 hover:underline">Sign up as customer</Link>
            {' · '}
            <Link href="/register/vendor" className="text-orange-600 hover:underline">List your business</Link>
          </p>
          <p className="text-center text-xs text-gray-400">
            <Link href="/admin/login" className="hover:text-orange-600">Admin panel</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
