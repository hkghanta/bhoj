import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VendorSidebar } from '@/components/vendor/VendorSidebar'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user as any).role !== 'vendor') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <VendorSidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{session.user?.name}</span>
            <a href="/api/auth/signout" className="text-orange-600 hover:underline text-sm">Sign out</a>
          </div>
        </header>
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  )
}
