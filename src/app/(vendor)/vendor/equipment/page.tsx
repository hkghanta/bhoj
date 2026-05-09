import { VendorEquipmentManager } from '@/components/vendor/VendorEquipmentManager'

export default function EquipmentPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-1">Equipment Catalog</h1>
        <p className="text-text-4 mt-1">
          List the equipment you provide for events, with pricing and availability.
        </p>
      </div>
      <VendorEquipmentManager />
    </div>
  )
}
