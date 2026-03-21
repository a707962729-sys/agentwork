import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTask } from '../hooks/useTasks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import TaskProgress from '../components/TaskProgress'

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { task, isLoading } = useTask(id || '')

  const controlMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => 
      taskApi.control(id, action as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => taskApi.delete(id!),
    onSuccess: () => {
      navigate('/tasks')
    },
  })

  const approveDecisionMutation = useMutation({
    mutationFn: ({ decisionId, decision }: { decisionId: string; decision: 'approve' | 'reject' }) =>
      taskApi.approveDecision(decisionId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
    },
  })

  const rejectDecisionMutation = useMutation({
    mutationFn: ({ decisionId, reason }: { decisionId: string; reason: string }) =>
      taskApi.rejectDecision(decisionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
    },
  })

  if (isLoading || !task) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  const handleControl = (action: string) => {
    if (!id) return
    controlMutation.mutate({ id, action })
  }

  const handleDelete = () => {
    if (!id) return
    if (confirm('确定要删除这个任务吗？')) {
      deleteMutation.mutate()
    }
  }

  const handleApproveDecision = (decisionId: string) => {
    approveDecisionMutation.mutate({ decisionId, decision: 'approve' })
  }

  const handleRejectDecision = (decisionId: string) => {
    const reason = prompt('请输入拒绝原因：')
    if (reason) {
      rejectDecisionMutation.mutate({ decisionId, reason })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/tasks" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← 返回任务列表
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">{task.title}</h1>
          {task.description && (
            <p className="text-muted-foreground">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={task.status} size="lg" />
        </div>
      </div>

      {/* 进度 */}
      <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
        <TaskProgress progress={task.progress} size="lg" />
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        {task.status === 'running' && (
          <button
            onClick={() => handleControl('pause')}
            disabled={controlMutation.isPending}
            className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50"
          >
            暂停
          </button>
        )}
        {task.status === 'paused' && (
          <button
            onClick={() => handleControl('resume')}
            disabled={controlMutation.isPending}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            继续
          </button>
        )}
        {(task.status === 'running' || task.status === 'paused') && (
          <button
            onClick={() => handleControl('cancel')}
            disabled={controlMutation.isPending}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            取消
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 ml-auto"
        >
          删除任务
        </button>
      </div>

      {/* 详细信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">任务 ID</h3>
          <p className="text-sm text-foreground font-mono">{task.id}</p>
        </div>
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">工作流</h3>
          <p className="text-sm text-foreground">{task.workflow?.name || 'N/A'}</p>
        </div>
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">创建时间</h3>
          <p className="text-sm text-foreground">{formatDate(task.createdAt)}</p>
        </div>
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">预计完成时间</h3>
          <p className="text-sm text-foreground">
            {task.estimatedCompletionTime 
              ? formatDate(task.estimatedCompletionTime) 
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">执行步骤</h2>
        {task.steps && task.steps.length > 0 ? (
          <div className="space-y-3">
            {task.steps.map((step: any, index: number) => (
              <div
                key={step.id}
                className="p-3 bg-dark-bg rounded-lg border border-dark-border"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'running' ? 'bg-blue-500 text-white animate-pulse' :
                    step.status === 'failed' ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {step.status === 'completed' ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">{step.name}</h3>
                      <StatusBadge status={step.status} size="sm" />
                    </div>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                    )}
                    {step.output && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">输出：</h4>
                        <pre className="text-xs text-muted-foreground bg-dark-card p-3 rounded-lg overflow-x-auto">
                          {step.output}
                        </pre>
                      </div>
                    )}
                    {step.logs && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">日志：</h4>
                        <pre className="text-xs text-muted-foreground bg-black/30 p-2 rounded-lg overflow-x-auto font-mono">
                          {step.logs}
                        </pre>
                      </div>
                    )}
                    {step.files && step.files.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">产出文件：</h4>
                        <div className="flex flex-wrap gap-2">
                          {step.files.map((file: any, i: number) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded"
                            >
                              {file.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">暂无步骤</p>
        )}
      </div>

      {/* 决策点 */}
      {task.decisionPoints && task.decisionPoints.length > 0 && (
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">决策点</h2>
          <div className="space-y-3">
            {task.decisionPoints.map((decision: any, index: number) => (
              <div
                key={decision.id}
                className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">
                        <span className="text-purple-400 mr-2">#{index + 1}</span>
                        {decision.title || `决策点 ${index + 1}`}
                      </h3>
                      <StatusBadge status="pending" size="sm" />
                    </div>
                    {decision.description && (
                      <p className="text-sm text-muted-foreground mb-3">{decision.description}</p>
                    )}
                    {decision.context && (
                      <div className="text-sm text-muted-foreground mb-3">
                        <span className="font-medium">上下文：</span>
                        {decision.context}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveDecision(decision.id)}
                        disabled={approveDecisionMutation.isPending}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 text-sm"
                      >
                        批准
                      </button>
                      <button
                        onClick={() => handleRejectDecision(decision.id)}
                        disabled={rejectDecisionMutation.isPending}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 text-sm"
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 元信息 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Agent 执行者</h3>
          <p className="text-foreground">{task.executorAgent?.name || 'N/A'}</p>
        </div>
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">重试次数</h3>
          <p className="text-foreground">{task.retryCount || 0}</p>
        </div>
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">优先级</h3>
          <p className="text-foreground">{task.priority || 'Normal'}</p>
        </div>
      </div>
    </div>
  )
}
