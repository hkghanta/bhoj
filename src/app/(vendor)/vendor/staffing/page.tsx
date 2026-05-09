import { VendorStaffingManager } from '@/components/vendor/VendorStaffingManager'

export default function StaffingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight tracking-tight text-text-1">Staffing Services</h1>
        <p className="text-text-4 mt-1">
          Manage the event staffing roles you offer and their rates.
        </p>
      </div>
      <VendorStaffingManager />
    </div>
  )
}
