import { InstantBookManager } from '@/components/vendor/InstantBookManager'

export default function InstantBookPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-text-1">Instant Book Packages</h1>
        <p className="text-text-4 mt-1">
          Create packages that customers can book instantly.
        </p>
      </div>
      <InstantBookManager />
    </div>
  )
}
