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
        className="block p-3 bg-dark-card rounded-lg border border-dark-border hover:border-primary-500/50 transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm text-foreground group-hover:text-primary-400 transition-colors line-clamp-1">
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
      className="block p-4 bg-dark-card rounded-lg border border-dark-border hover:border-primary-500/50 transition-all group animate-fade-in"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-foreground group-hover:text-primary-400 transition-colors line-clamp-1">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <StatusBadge status={task.status} size="sm" />
      </div>
      
      <TaskProgress progress={task.progress} />
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-border">
        <span className="text-xs text-muted-foreground">
          创建于 {formatDate(task.createdAt)}
        </span>
        <span className="text-xs text-muted-foreground">
          {task.steps?.length || 0} 个步骤
        </span>
      </div>
    </Link>
  )
}
