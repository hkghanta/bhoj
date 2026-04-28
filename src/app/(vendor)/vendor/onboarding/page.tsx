import { OnboardingWizard } from '@/components/vendor/OnboardingWizard'

export default function OnboardingPage() {
  return (
    <div className="min-h-[80vh] flex items-start py-8">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Set up your vendor profile</h1>
          <p className="text-gray-500 mt-2">
            Complete these steps to start receiving leads from Bhoj.
          </p>
        </div>
        <OnboardingWizard />
      </div>
    </div>
  )
}
