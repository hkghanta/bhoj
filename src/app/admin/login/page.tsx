'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    })
    setLoading(false)
    if (res.ok) {
      router.push('/admin/vendors')
    } else {
      setError('Invalid secret.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="bg-white rounded-xl border p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-text-1 mb-1">OneSeva Admin</h1>
        <p className="text-xs text-text-4 mb-6">Password: <code className="bg-cream px-1 rounded">change-me-in-production</code></p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <button
          type="button"
          disabled={loading}
          onClick={() => setSecret('change-me-in-production')}
          className="w-full mt-3 border border-brand hover:bg-cream text-brand text-xs font-medium py-2 rounded-lg disabled:opacity-50"
        >
          Use demo secret
        </button>
      </div>
    </div>
  )
}
