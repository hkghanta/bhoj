'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Link from 'next/link'

export default function CustomerRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', location: '' })
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
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Start planning your perfect Indian event</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{error}</p>}
            <div className="space-y-1">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} onChange={update('name')} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={update('email')} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={update('password')} required minLength={8} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="location">City / Location</Label>
              <Input id="location" value={form.location} onChange={update('location')} placeholder="London, UK" />
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-600 hover:underline">Sign in</Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Are you a vendor?{' '}
            <Link href="/register/vendor" className="text-orange-600 hover:underline">List your business</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
