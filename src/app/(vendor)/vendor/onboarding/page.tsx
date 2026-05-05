import { OnboardingWizard } from '@/components/vendor/OnboardingWizard'

export default function OnboardingPage() {
  return (
    <div className="min-h-[80vh] flex items-start py-8">
      <div className="w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-text-1">Set up your vendor profile</h1>
          <p className="text-text-4 mt-2">
            Complete these steps to start receiving leads from OneSeva.
          </p>
        </div>
        <OnboardingWizard />
      </div>
    </div>
  )
}
