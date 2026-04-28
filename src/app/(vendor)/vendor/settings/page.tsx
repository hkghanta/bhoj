import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NotificationPrefsForm } from '@/components/notifications/NotificationPrefsForm'

export default async function VendorSettingsPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') redirect('/login')

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <NotificationPrefsForm role="vendor" />
    </div>
  )
}
