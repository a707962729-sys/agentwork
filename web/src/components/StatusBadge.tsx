interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'active':
      case 'idle':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'running':
      case 'busy':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'paused':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'failed':
      case 'error':
      case 'offline':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full border ${getStatusStyles(status)} ${sizeClasses[size]}`}
    >
      {status === 'running' || status === 'busy' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
