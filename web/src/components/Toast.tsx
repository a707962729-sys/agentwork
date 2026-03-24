import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

export default function Toast() {
  const { notifications, removeNotification } = useAppStore()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

function ToastItem({ notification, onClose }: {
  notification: {
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
  }
  onClose: () => void
}) {
  const config = {
    info: { bg: 'bg-[#165DFF]/10', border: 'border-[#165DFF]/30', icon: 'ℹ️', color: '#165DFF' },
    success: { bg: 'bg-[#00B42A]/10', border: 'border-[#00B42A]/30', icon: '✅', color: '#00B42A' },
    warning: { bg: 'bg-[#FF7D00]/10', border: 'border-[#FF7D00]/30', icon: '⚠️', color: '#FF7D00' },
    error: { bg: 'bg-[#F53F3F]/10', border: 'border-[#F53F3F]/30', icon: '❌', color: '#F53F3F' },
  }[notification.type]

  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-lg p-4 min-w-[300px] max-w-[400px] animate-slide-in`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{notification.title}</p>
          <p className="text-xs text-[#86909C] mt-0.5">{notification.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#86909C] hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
