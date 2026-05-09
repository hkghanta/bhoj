import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft, FileText } from 'lucide-react'
import ContractViewer from '@/components/contracts/ContractViewer'

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string; contractId: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id, contractId } = await params
  const customerId = session.user!.id as string

  // Verify the customer owns this event and the contract belongs to it
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      customer_id: customerId,
      event_id: id,
    },
    select: { id: true },
  })

  if (!contract) notFound()

  const event = await prisma.event.findFirst({
    where: { id, customer_id: customerId },
    select: { id: true, event_name: true },
  })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/events/${id}`} className="text-text-4 hover:text-text-3">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-text-3" />
          <h1 className="text-2xl font-extrabold tracking-tight text-text-1">Contract</h1>
        </div>
        {event && <span className="text-sm text-text-3">{event.event_name}</span>}
      </div>

      <ContractViewer contractId={contractId} />
    </div>
  )
}
