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
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-primary-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <>
            <span className="text-xs text-muted-foreground">进度</span>
            <span className="text-xs font-medium text-foreground">{Math.round(progress)}%</span>
          </>
        )}
      </div>
      <div className={`w-full bg-dark-bg rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full ${getProgressColor(progress)} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}
