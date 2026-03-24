interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: string
  trendUp?: boolean
  description?: string
}

export default function StatCard({ title, value, icon, trend, trendUp, description }: StatCardProps) {
  return (
    <div className="p-4 bg-dark-card rounded-lg border border-dark-border hover:border-primary-500/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && (
          <div className="p-2 bg-dark-bg rounded-lg">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {trend && (
          <span
            className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              trendUp
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  )
}
