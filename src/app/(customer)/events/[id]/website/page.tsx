import { EventWebsiteBuilder } from '@/components/customer/EventWebsiteBuilder'

export default async function EventWebsitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-text-1">Event Website</h1>
        <p className="text-text-3 mt-1">
          Create and customize a beautiful website for your event.
        </p>
      </div>
      <EventWebsiteBuilder eventId={id} />
    </div>
  )
}
