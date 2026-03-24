import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import TaskProgress from './TaskProgress'

interface Task {
  id: string
  title: string
  description: string
  status: string
  progress: number
  createdAt: string
  steps?: any[]
}

interface TaskCardProps {
  task: Task
  compact?: boolean
}

export default function TaskCard({ task, compact = false }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  if (compact) {
    return (
      <Link 
        to={`/tasks/${task.id}`}
        className="block p-3 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-1">
            {task.title}
          </h3>
          <StatusBadge status={task.status} size="sm" />
        </div>
        <TaskProgress progress={task.progress} size="sm" />
      </Link>
    )
  }

  return (
    <Link 
      to={`/tasks/${task.id}`}
      className="group block p-5 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300"
    >
      {/* 顶部区域 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-semibold text-base text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={task.status} size="sm" />
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="mb-4">
        <TaskProgress progress={task.progress} />
      </div>
      
      {/* 底部信息 */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatDate(task.createdAt)}</span>
        </div>
        {task.steps && task.steps.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{task.steps.length} 个步骤</span>
          </div>
        )}
      </div>
    </Link>
  )
}
