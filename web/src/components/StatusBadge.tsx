interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const safeStatus = status || 'unknown'
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

  const isRunning = safeStatus === 'running' || safeStatus === 'busy'

  const label = safeStatus === 'running' ? '进行中' : 
                safeStatus === 'pending' ? '待处理' :
                safeStatus === 'completed' ? '已完成' :
                safeStatus === 'failed' ? '失败' :
                safeStatus === 'paused' ? '已暂停' :
                safeStatus === 'active' ? '活跃' :
                safeStatus === 'idle' ? '空闲' :
                safeStatus === 'busy' ? '忙碌' :
                safeStatus === 'offline' ? '离线' :
                safeStatus === 'inactive' ? '未启用' :
                safeStatus === 'unknown' ? '未知' :
                safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)

  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${getStatusStyles(safeStatus)} ${sizeClasses[size]}`}
    >
      {isRunning && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {label}
    </span>
  )
}
