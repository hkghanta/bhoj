import { TastingBookingManager } from '@/components/customer/TastingBookingManager'

export default async function TastingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-text-1">Tastings &amp; Visits</h1>
        <p className="text-text-3 mt-1">
          Schedule tastings, site visits, and consultations with vendors.
        </p>
      </div>
      <TastingBookingManager eventId={id} />
    </div>
  )
}
