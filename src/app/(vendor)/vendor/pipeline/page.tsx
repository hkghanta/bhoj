import { VendorPipeline } from '@/components/vendor/VendorPipeline'

export default function PipelinePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-1">CRM Pipeline</h1>
        <p className="text-text-4 mt-1">
          Track leads and manage your sales pipeline.
        </p>
      </div>
      <VendorPipeline />
    </div>
  )
}
