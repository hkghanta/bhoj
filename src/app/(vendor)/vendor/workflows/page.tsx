import { WorkflowManager } from '@/components/vendor/WorkflowManager'

export default function WorkflowsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-1">Workflows</h1>
        <p className="text-text-4 mt-1">
          Automate tasks with trigger-based workflows.
        </p>
      </div>
      <WorkflowManager />
    </div>
  )
}
