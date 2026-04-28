import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'

export default async function CustomerDashboard() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-600">Bhoj</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, {session.user?.name}</span>
          <Link href="/api/auth/signout" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Sign out
          </Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <Button className="bg-orange-600 hover:bg-orange-700">
            + Create Event
          </Button>
        </div>
        <div className="bg-white border rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No events yet.</p>
          <p className="text-gray-400 text-sm mt-2">Create your first event to start finding vendors.</p>
        </div>
      </main>
    </div>
  )
}
