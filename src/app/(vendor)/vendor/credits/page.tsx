'use client'
import { useEffect, useState } from 'react'
import { Coins, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'

type Transaction = {
  id: string
  amount: number
  type: 'BONUS' | 'PURCHASE' | 'LEAD_SPEND' | 'REFUND'
  description: string | null
  reference: string | null
  created_at: string
}

type CreditsData = {
  credits_live: boolean
  balance: number | null
  total_bought: number
  total_spent: number
  transactions: Transaction[]
}

const TX_LABELS: Record<string, { label: string; color: string }> = {
  BONUS:      { label: 'Bonus credits',  color: 'text-green-600' },
  PURCHASE:   { label: 'Credits bought', color: 'text-green-600' },
  LEAD_SPEND: { label: 'Lead unlocked',  color: 'text-brand' },
  REFUND:     { label: 'Refund',         color: 'text-blue-600' },
}

export default function VendorCreditsPage() {
  const [data, setData] = useState<CreditsData | null>(null)

  useEffect(() => {
    fetch('/api/vendor/credits')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
  }, [])

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight tracking-tight text-text-1">Lead Credits</h1>
        <p className="text-text-4 mt-1">
          OneSeva charges a small fee per lead — only when you receive a real customer enquiry.
          No monthly subscription. No charge if no leads come in.
        </p>
      </div>

      {/* Beta banner */}
      {data && !data.credits_live && (
        <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-green-800">Free during beta</p>
            <p className="text-sm text-green-700 mt-0.5">
              All leads are free while we grow the platform. Lead credits will be introduced
              after our first year — you'll receive advance notice with no surprise charges.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 text-center">
            <Coins className="h-6 w-6 text-brand mx-auto mb-2" />
            <div className="text-3xl font-bold tracking-tight text-text-1">
              {data.credits_live ? (data.balance ?? 0) : '∞'}
            </div>
            <div className="text-sm text-text-4 mt-1">Credits available</div>
          </div>
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 text-center">
            <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <div className="text-3xl font-bold tracking-tight text-text-1">{data.total_spent}</div>
            <div className="text-sm text-text-4 mt-1">Leads received</div>
          </div>
          <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 text-center">
            <Clock className="h-6 w-6 text-text-4 mx-auto mb-2" />
            <div className="text-3xl font-bold tracking-tight text-text-1">{data.total_bought}</div>
            <div className="text-sm text-text-4 mt-1">Credits ever granted</div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border p-6 mb-8">
        <h2 className="text-lg font-bold text-text-1 mb-4">How lead credits work</h2>
        <ol className="space-y-4">
          {[
            'A customer posts their event with budget, date, and requirements.',
            'OneSeva matches you based on your profile, location, and availability.',
            'You see the lead summary — event name, date, guest count, budget.',
            'You spend 1 credit to unlock the customer\'s details and respond.',
            'If you win the booking, the credit was your best investment.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-text-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cream text-brand text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-text-4">
            Pricing when live: <strong className="text-text-1">£8–15 per lead</strong> depending on event size.
            A single booking is worth £5,000–25,000 — that makes the maths easy.
          </p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white dark:bg-cream-2 rounded-2xl border border-brand-border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-text-1">Transaction history</h2>
        </div>
        {(!data || data.transactions.length === 0) ? (
          <div className="px-6 py-16 text-center text-text-4 text-base">
            No transactions yet. Leads will appear here when they come in.
          </div>
        ) : (
          <div className="divide-y">
            {data.transactions.map(tx => {
              const meta = TX_LABELS[tx.type] ?? { label: tx.type, color: 'text-text-3' }
              return (
                <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-1">{tx.description ?? meta.label}</p>
                    <p className="text-xs text-text-4 mt-0.5">
                      {format(new Date(tx.created_at), 'd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${meta.color}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
