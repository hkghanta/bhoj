import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  if ((session.user as any).role !== 'customer') redirect('/vendor/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-orange-600">Bhoj</Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-orange-600">Events</Link>
          <Link href="/profile" className="text-sm text-gray-600 hover:text-orange-600">Profile</Link>
          <span className="text-sm text-gray-400">{session.user?.name}</span>
          <a href="/api/auth/signout" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Sign out
          </a>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
