import { GiftRegistryManager } from '@/components/customer/GiftRegistryManager'

export default async function RegistryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-text-1">Gift Registry</h1>
        <p className="text-text-3 mt-1">
          Manage your event gift registry and track contributions.
        </p>
      </div>
      <GiftRegistryManager eventId={id} />
    </div>
  )
}
