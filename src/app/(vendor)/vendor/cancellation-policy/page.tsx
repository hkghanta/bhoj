import { CancellationPolicyEditor } from '@/components/vendor/CancellationPolicyEditor'

export default function CancellationPolicyPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight tracking-tight text-text-1">Cancellation Policy</h1>
        <p className="text-text-4 mt-1">
          Define refund tiers based on how far in advance a cancellation occurs.
        </p>
      </div>
      <CancellationPolicyEditor />
    </div>
  )
}
