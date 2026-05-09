import { MessageTemplateManager } from '@/components/vendor/MessageTemplateManager'

export default function MessageTemplatesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-1">Message Templates</h1>
        <p className="text-text-4 mt-1">
          Create reusable message templates for common communications.
        </p>
      </div>
      <MessageTemplateManager />
    </div>
  )
}
