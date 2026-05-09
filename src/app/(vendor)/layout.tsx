import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VendorSidebar } from '@/components/vendor/VendorSidebar'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user as any).role !== 'vendor') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-cream/50">
      <VendorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-cream-2 border-b border-brand-border/80 px-4 sm:px-8 py-3 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-text-1 tracking-tight">{session.user?.name}</h1>
          <a href="/api/auth/signout" className="text-xs text-text-4 hover:text-text-2 transition-colors px-2.5 py-1 rounded-md hover:bg-cream/80">Sign out</a>
        </header>
        <main className="flex-1 px-4 sm:px-8 py-5 pb-20 md:pb-5 mx-auto max-w-7xl w-full">{children}</main>
      </div>
    </div>
  )
}
