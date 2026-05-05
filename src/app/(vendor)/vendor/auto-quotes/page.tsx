import { AutoQuoteRulesManager } from '@/components/vendor/AutoQuoteRulesManager'

export default function AutoQuotesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-text-1">Auto-Quote Rules</h1>
        <p className="text-text-4 mt-1">
          Set up rules to automatically generate quotes when incoming requests match your criteria.
        </p>
      </div>
      <AutoQuoteRulesManager />
    </div>
  )
}
