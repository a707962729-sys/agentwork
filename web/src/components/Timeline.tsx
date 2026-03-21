import StatusBadge from './StatusBadge'

interface TimelineEvent {
  id: string
  title: string
  time: string
  status: string
  description?: string
  type?: 'task' | 'decision' | 'system'
}

interface TimelineProps {
  events: TimelineEvent[]
  title?: string
}

export default function Timeline({ events, title = '时间线' }: TimelineProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'decision':
        return 'bg-purple-500'
      case 'system':
        return 'bg-gray-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      
      {events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无事件
        </div>
      ) : (
        <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-border">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-10">
              {/* 节点圆点 */}
              <div
                className={`absolute left-0 top-1.5 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border-4 border-dark-bg ${
                  getTypeColor(event.type || 'task')
                }`}
              >
                {event.type === 'decision' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* 时间线内容 */}
              <div className="p-3 bg-dark-bg rounded-lg border border-dark-border hover:border-primary-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{event.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {event.time}
                  </span>
                </div>
                
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                )}
                
                {event.type === 'decision' && (
                  <div className="flex items-center gap-2">
                    <StatusBadge status="pending" />
                    <span className="text-xs text-purple-400">需要人工确认</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
