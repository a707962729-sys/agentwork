import StatusBadge from './StatusBadge'

interface WorkflowStep {
  id: string
  name: string
  type: string
}

interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  status: string
}

interface WorkflowCardProps {
  workflow: Workflow
  onExecute?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function WorkflowCard({ workflow, onExecute, onEdit, onDelete }: WorkflowCardProps) {
  return (
    <div className="p-4 bg-dark-card rounded-lg border border-dark-border hover:border-primary-500/50 transition-all animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-foreground mb-1">
            {workflow.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workflow.description}
          </p>
        </div>
        <StatusBadge status={workflow.status} size="sm" />
      </div>

      {/* 步骤预览 */}
      <div className="mb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {workflow.steps.slice(0, 5).map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="px-2 py-1 bg-dark-bg rounded text-xs text-muted-foreground whitespace-nowrap">
                {step.name}
              </div>
              {index < Math.min(workflow.steps.length, 5) - 1 && (
                <svg className="w-3 h-3 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
          {workflow.steps.length > 5 && (
            <span className="text-xs text-muted-foreground">
              +{workflow.steps.length - 5}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onExecute}
          className="flex-1 px-3 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
        >
          执行
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm bg-dark-bg text-foreground rounded hover:bg-dark-border transition-colors"
        >
          编辑
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  )
}
