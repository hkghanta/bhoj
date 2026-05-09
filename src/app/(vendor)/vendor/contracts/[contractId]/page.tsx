'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ScrollText } from 'lucide-react'
import ContractViewer from '@/components/contracts/ContractViewer'

export default function VendorContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vendor/contracts" className="text-text-4 hover:text-text-3">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-text-3" />
          <h1 className="text-2xl font-bold tracking-tight text-text-1">Contract</h1>
        </div>
      </div>

      <ContractViewer contractId={contractId} role="vendor" />
    </div>
  )
}
