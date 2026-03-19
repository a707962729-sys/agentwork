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
        <StatusBadge status={task.status} size="lg" />
      </div>

      {/* 进度 */}
      <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
        <TaskProgress progress={task.progress} size="lg" />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
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
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'running' ? 'bg-blue-500 text-white animate-pulse' :
                    step.status === 'failed' ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {step.status === 'completed' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{step.name}</h3>
                    {step.output && (
                      <pre className="mt-2 text-xs text-muted-foreground bg-dark-card p-2 rounded overflow-x-auto">
                        {step.output}
                      </pre>
                    )}
                  </div>
                  <StatusBadge status={step.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">暂无步骤</p>
        )}
      </div>

      {/* 元信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">创建时间</h3>
          <p className="text-foreground">{formatDate(task.createdAt)}</p>
        </div>
        <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">更新时间</h3>
          <p className="text-foreground">{formatDate(task.updatedAt)}</p>
        </div>
      </div>
    </div>
  )
}
