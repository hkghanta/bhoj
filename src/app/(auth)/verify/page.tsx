'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Mail, Phone, RefreshCw, ArrowRight } from 'lucide-react'

type Step = 'email' | 'phone' | 'done'

export default function VerifyPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<Step>('email')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Auto-send on mount for email step
  useEffect(() => {
    if (session?.user) sendCode('email')
  }, [session])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function sendCode(type: 'email' | 'phone') {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to send code')
      } else {
        setSent(true)
        setCooldown(60)
      }
    } finally {
      setSending(false)
    }
  }

  async function confirm(type: 'email' | 'phone') {
    if (code.length !== 6) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, code }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? 'Something went wrong')
      } else {
        setCode('')
        setSent(false)
        if (type === 'email') {
          setStep('phone')
          sendCode('phone')
        } else {
          setStep('done')
          // Force session refresh so dashboard knows user is verified
          await update()
          const role = (session?.user as any)?.role
          setTimeout(() => {
            router.push(role === 'vendor' ? '/vendor/onboarding' : '/dashboard')
          }, 1500)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-black text-text-1">You're verified!</h2>
        <p className="text-text-3">Redirecting you now…</p>
      </div>
    )
  }

  const isEmail = step === 'email'
  const icon = isEmail ? <Mail className="w-6 h-6 text-brand" /> : <Phone className="w-6 h-6 text-brand" />
  const title = isEmail ? 'Verify your email' : 'Verify your phone'
  const target = isEmail
    ? (session?.user?.email ?? 'your email')
    : 'your phone number'

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex-1 h-1 rounded-full ${step === 'email' || step === 'phone' ? 'bg-brand' : 'bg-brand-border'}`} />
        <div className={`flex-1 h-1 rounded-full ${step === 'phone' ? 'bg-brand' : 'bg-brand-border'}`} />
      </div>

      <div className="bg-white border border-brand-border rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          {icon}
          <div>
            <h1 className="text-xl font-black text-text-1">{title}</h1>
            <p className="text-sm text-text-3 mt-0.5">
              {sent ? `We sent a 6-digit code to ${target}` : `Sending code to ${target}…`}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="flex-1 text-center text-2xl font-bold tracking-widest border border-brand-border rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            onKeyDown={e => e.key === 'Enter' && confirm(step)}
          />
        </div>

        <button
          onClick={() => confirm(step)}
          disabled={code.length !== 6 || loading}
          className="w-full flex items-center justify-center gap-2 bg-brand text-white font-bold rounded-xl py-3 hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? 'Verifying…' : 'Verify'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>

        <button
          onClick={() => sendCode(step)}
          disabled={sending || cooldown > 0}
          className="w-full flex items-center justify-center gap-2 text-sm text-text-3 hover:text-text-1 transition-colors disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : sending ? 'Sending…' : "Didn't get it? Resend"}
        </button>
      </div>

      <p className="text-center text-xs text-text-4 mt-6">
        Step {step === 'email' ? '1' : '2'} of 2 — {step === 'email' ? 'Phone verification next' : 'Last step'}
      </p>
    </div>
  )
}
