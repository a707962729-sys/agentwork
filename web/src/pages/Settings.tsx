import { useState } from 'react'
import { useAppStore } from '../store/appStore'

export default function Settings() {
  const { darkMode, toggleDarkMode } = useAppStore()
  const [apiUrl, setApiUrl] = useState('http://localhost:3000/api/v1')
  const [wsUrl, setWsUrl] = useState('ws://localhost:3000/ws')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5000)

  const handleSave = () => {
    // 保存设置到 localStorage
    localStorage.setItem('agentwork-settings', JSON.stringify({
      apiUrl,
      wsUrl,
      notificationsEnabled,
      autoRefresh,
      refreshInterval,
    }))
    alert('设置已保存')
  }

  const handleReset = () => {
    if (confirm('确定要重置所有设置吗？')) {
      setApiUrl('http://localhost:3000/api/v1')
      setWsUrl('ws://localhost:3000/ws')
      setNotificationsEnabled(true)
      setAutoRefresh(true)
      setRefreshInterval(5000)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 头部 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">系统设置</h1>
        <p className="text-sm text-muted-foreground">配置系统参数和偏好设置</p>
      </div>

      {/* 外观设置 */}
      <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">外观</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">深色模式</p>
              <p className="text-sm text-muted-foreground">切换深色/浅色主题</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                darkMode ? 'bg-primary-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  darkMode ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* API 设置 */}
      <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">API 配置</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              API 地址
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              WebSocket 地址
            </label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">通知</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">启用通知</p>
              <p className="text-sm text-muted-foreground">显示系统通知和提醒</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-primary-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  notificationsEnabled ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 刷新设置 */}
      <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">数据刷新</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">自动刷新</p>
              <p className="text-sm text-muted-foreground">自动更新任务和数据状态</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                autoRefresh ? 'bg-primary-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  autoRefresh ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>
          {autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                刷新间隔（毫秒）
              </label>
              <input
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                min={1000}
                step={1000}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-muted-foreground mt-1">
                建议值：5000ms（5 秒），最小值：1000ms
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 关于 */}
      <div className="p-4 bg-dark-card rounded-lg border border-dark-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">关于</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">版本</span>
            <span className="text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">构建时间</span>
            <span className="text-foreground">2026-03-19</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">技术栈</span>
            <span className="text-foreground">React 18 + TypeScript + Vite</span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          保存设置
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-dark-bg text-foreground rounded-lg hover:bg-dark-border transition-colors"
        >
          重置设置
        </button>
      </div>
    </div>
  )
}
