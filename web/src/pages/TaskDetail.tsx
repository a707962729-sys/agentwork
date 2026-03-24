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
  const { task, isLoading, error } = useTask(id || '')

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-200 mb-2">无法加载任务</h3>
        <p className="text-sm text-slate-400 mb-4">{error?.message || '任务不存在或已被删除'}</p>
        <Link to="/tasks" className="px-4 py-2 bg-dark-card text-slate-300 rounded-xl hover:bg-dark-border transition-colors text-sm font-medium">
          返回任务列表
        </Link>
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
    <div className="space-y-5">
      {/* 头部 */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/tasks" className="text-sm text-slate-500 hover:text-cyan-400 mb-2 inline-block transition-colors">
            ← 返回任务列表
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{task.title}</h1>
          {task.description && (
            <p className="text-sm text-slate-400 mt-1">{task.description}</p>
          )}
        </div>
        <StatusBadge status={task.status} size="lg" />
      </div>

      {/* 进度 */}
      <div className="p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10">
        <TaskProgress progress={task.progress} size="lg" />
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-2">
        {task.status === 'running' && (
          <button
            onClick={() => handleControl('pause')}
            disabled={controlMutation.isPending}
            className="px-4 py-2 bg-orange-500/15 text-orange-400 rounded-xl hover:bg-orange-500/25 border border-orange-500/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            暂停
          </button>
        )}
        {task.status === 'paused' && (
          <button
            onClick={() => handleControl('resume')}
            disabled={controlMutation.isPending}
            className="px-4 py-2 bg-emerald-500/15 text-emerald-400 rounded-xl hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            继续
          </button>
        )}
        {(task.status === 'running' || task.status === 'paused') && (
          <button
            onClick={() => handleControl('cancel')}
            disabled={controlMutation.isPending}
            className="px-4 py-2 bg-rose-500/15 text-rose-400 rounded-xl hover:bg-rose-500/25 border border-rose-500/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            取消
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="px-4 py-2 bg-rose-500/15 text-rose-400 rounded-xl hover:bg-rose-500/25 border border-rose-500/30 transition-colors text-sm font-medium disabled:opacity-50 ml-auto"
        >
          删除任务
        </button>
      </div>

      {/* 步骤列表 */}
      <div className="p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10">
        <h2 className="text-base font-semibold text-foreground mb-4 tracking-tight">执行步骤</h2>
        {task.steps && task.steps.length > 0 ? (
          <div className="space-y-3">
            {task.steps.map((step: any, index: number) => (
              <div
                key={step.id}
                className="p-4 bg-dark-bg/80 rounded-xl border border-dark-border"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    step.status === 'completed' ? 'bg-emerald-500 text-white' :
                    step.status === 'running' ? 'bg-cyan-500 text-white animate-pulse' :
                    step.status === 'failed' ? 'bg-rose-500 text-white' :
                    'bg-slate-600 text-white'
                  }`}>
                    {step.status === 'completed' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm">{step.name}</h3>
                    {step.output && (
                      <pre className="mt-2 text-xs text-slate-400 bg-dark-card p-3 rounded-lg border border-dark-border overflow-x-auto leading-relaxed">
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
          <p className="text-slate-500 text-center py-8 text-sm">暂无步骤</p>
        )}
      </div>

      {/* 元信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10">
          <h3 className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">创建时间</h3>
          <p className="text-sm text-foreground font-medium">{formatDate(task.createdAt)}</p>
        </div>
        <div className="p-4 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10">
          <h3 className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">更新时间</h3>
          <p className="text-sm text-foreground font-medium">{formatDate(task.updatedAt)}</p>
        </div>
      </div>
    </div>
  )
}
