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
    <div className="space-y-6 max-w-3xl">
      {/* 头部 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">系统设置</h1>
        <p className="text-sm text-muted-foreground mt-0.5">配置系统参数和偏好设置</p>
      </div>

      {/* 外观设置 */}
      <div className="p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10">
        <h2 className="text-base font-semibold text-foreground mb-4 tracking-tight">外观</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">深色模式</p>
              <p className="text-xs text-slate-500 mt-0.5">切换深色/浅色主题</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                darkMode ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  darkMode ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* API 设置 */}
      <div className="p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10">
        <h2 className="text-base font-semibold text-foreground mb-4 tracking-tight">API 配置</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              API 地址
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg/80 border border-dark-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              WebSocket 地址
            </label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg/80 border border-dark-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10">
        <h2 className="text-base font-semibold text-foreground mb-4 tracking-tight">通知</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">启用通知</p>
              <p className="text-xs text-slate-500 mt-0.5">显示系统通知和提醒</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notificationsEnabled ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 刷新设置 */}
      <div className="p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10">
        <h2 className="text-base font-semibold text-foreground mb-4 tracking-tight">数据刷新</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">自动刷新</p>
              <p className="text-xs text-slate-500 mt-0.5">自动更新任务和数据状态</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoRefresh ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoRefresh ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          {autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                刷新间隔（毫秒）
              </label>
              <input
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                min={1000}
                step={1000}
                className="w-full px-4 py-3 bg-dark-bg/80 border border-dark-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                建议值：5000ms（5 秒），最小值：1000ms
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 关于 */}
      <div className="p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10">
        <h2 className="text-base font-semibold text-foreground mb-4 tracking-tight">关于</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-dark-border/50">
            <span className="text-slate-500 text-sm">版本</span>
            <span className="text-foreground text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dark-border/50">
            <span className="text-slate-500 text-sm">构建时间</span>
            <span className="text-foreground text-sm font-medium">2026-03-19</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500 text-sm">技术栈</span>
            <span className="text-foreground text-sm font-medium">React 18 + TypeScript + Vite</span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-cyan-500/25 font-medium text-sm"
        >
          保存设置
        </button>
        <button
          onClick={handleReset}
          className="px-5 py-2.5 bg-dark-bg/80 text-slate-300 rounded-xl hover:bg-dark-border transition-colors font-medium text-sm border border-dark-border"
        >
          重置设置
        </button>
      </div>
    </div>
  )
}
