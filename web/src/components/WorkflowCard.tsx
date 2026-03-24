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
    <div className="group relative p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border hover:border-emerald-500/40 transition-all duration-300 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-semibold text-base text-foreground group-hover:text-emerald-400 transition-colors mb-1">
            {workflow.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {workflow.description}
          </p>
        </div>
        <StatusBadge status={workflow.status} size="sm" />
      </div>

      {/* 步骤预览 */}
      <div className="mb-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {workflow.steps.slice(0, 5).map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="px-2 py-1 bg-dark-bg/80 rounded-lg text-xs text-slate-400 whitespace-nowrap border border-dark-border/50">
                {step.name}
              </div>
              {index < Math.min(workflow.steps.length, 5) - 1 && (
                <svg className="w-3 h-3 text-slate-600 flex-shrink-0 mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
          {workflow.steps.length > 5 && (
            <span className="text-xs text-slate-500 px-1 whitespace-nowrap">
              +{workflow.steps.length - 5} 更多
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-dark-border/50">
        <button
          onClick={onExecute}
          className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-emerald-500/25 font-medium"
        >
          执行
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-2 text-sm bg-dark-bg/80 text-slate-300 rounded-xl hover:bg-dark-border transition-colors border border-dark-border font-medium"
        >
          编辑
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 text-sm bg-rose-500/15 text-rose-400 rounded-xl hover:bg-rose-500/25 border border-rose-500/30 transition-colors font-medium"
        >
          删除
        </button>
      </div>
    </div>
  )
}
