import { ContractTemplatesManager } from '@/components/vendor/ContractTemplatesManager'

export default function ContractsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-text-1">Contract Templates</h1>
        <p className="text-text-4 mt-1">
          Create and manage contract templates that are attached to your quotes.
        </p>
      </div>
      <ContractTemplatesManager />
    </div>
  )
}
