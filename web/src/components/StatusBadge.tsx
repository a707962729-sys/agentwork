interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      case 'active':
      case 'idle':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      case 'running':
      case 'busy':
        return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      case 'paused':
        return 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
      case 'failed':
      case 'error':
      case 'offline':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
      case 'inactive':
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
    }
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  }

  const isRunning = status === 'running' || status === 'busy'

  const label = status === 'running' ? '进行中' : 
                status === 'pending' ? '待处理' :
                status === 'completed' ? '已完成' :
                status === 'failed' ? '失败' :
                status === 'paused' ? '已暂停' :
                status === 'active' ? '活跃' :
                status === 'idle' ? '空闲' :
                status === 'busy' ? '忙碌' :
                status === 'offline' ? '离线' :
                status === 'inactive' ? '未启用' :
                status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${getStatusStyles(status)} ${sizeClasses[size]}`}
    >
      {isRunning && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {label}
    </span>
  )
}
