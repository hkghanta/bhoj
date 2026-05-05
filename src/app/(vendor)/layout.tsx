import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VendorSidebar } from '@/components/vendor/VendorSidebar'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user as any).role !== 'vendor') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-cream">
      <VendorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-cream-2 border-b border-brand-border px-4 sm:px-8 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3 text-sm text-text-3">
            <span>{session.user?.name}</span>
            <a href="/api/auth/signout" className="text-brand hover:underline text-sm">Sign out</a>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-8 py-6 pb-20 md:pb-6 mx-auto max-w-6xl w-full">{children}</main>
      </div>
    </div>
  )
}
