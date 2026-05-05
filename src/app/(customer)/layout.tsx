import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CustomerSidebar } from '@/components/customer/CustomerSidebar'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user as any).role !== 'customer') redirect('/vendor/dashboard')

  const customer = await prisma.customer.findUnique({
    where: { id: session.user!.id as string },
    select: { email_verified: true, phone_verified: true },
  })

  const needsVerification = !customer?.email_verified || !customer?.phone_verified

  return (
    <div className="flex min-h-screen bg-cream">
      <CustomerSidebar userName={session.user?.name ?? 'You'} />
      <main className="flex-1 px-4 sm:px-8 py-6 pb-20 md:pb-6 min-w-0 mx-auto max-w-6xl">
        {needsVerification && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 flex-1">
              Please verify your {!customer?.email_verified ? 'email' : 'phone'} to post event requests.
            </p>
            <Link href="/verify" className="text-sm font-bold text-amber-700 hover:text-amber-900 whitespace-nowrap">
              Verify now →
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
