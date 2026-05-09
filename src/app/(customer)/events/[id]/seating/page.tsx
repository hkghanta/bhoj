import { SeatingChartEditor } from '@/components/customer/SeatingChartEditor'

export default async function SeatingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight tracking-tight text-text-1">Seating Chart</h1>
        <p className="text-text-3 mt-1">
          Arrange tables and assign guests to their seats.
        </p>
      </div>
      <SeatingChartEditor eventId={id} />
    </div>
  )
}
