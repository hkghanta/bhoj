import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NotificationPrefsForm } from '@/components/notifications/NotificationPrefsForm'
import { SustainabilityTagsEditor } from '@/components/vendor/SustainabilityTagsEditor'

export default async function VendorSettingsPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== 'vendor') redirect('/login')

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-text-1">Settings</h1>
      <SustainabilityTagsEditor />
      <NotificationPrefsForm role="vendor" />
    </div>
  )
}
