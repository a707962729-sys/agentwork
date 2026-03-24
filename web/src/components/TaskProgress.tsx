interface TaskProgressProps {
  progress: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function TaskProgress({ progress, size = 'md', showLabel = true }: TaskProgressProps) {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-gradient-to-r from-emerald-500 to-green-400'
    if (progress >= 75) return 'bg-gradient-to-r from-cyan-500 to-blue-400'
    if (progress >= 50) return 'bg-gradient-to-r from-blue-500 to-cyan-400'
    if (progress >= 25) return 'bg-gradient-to-r from-amber-500 to-yellow-400'
    return 'bg-gradient-to-r from-orange-500 to-amber-400'
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">进度</span>
          <span className="text-xs font-medium text-slate-300">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-700/50 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full ${getProgressColor(progress)} transition-all duration-500 ease-out rounded-full relative overflow-hidden`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {/* 进度条光泽效果 */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </div>
    </div>
  )
}
