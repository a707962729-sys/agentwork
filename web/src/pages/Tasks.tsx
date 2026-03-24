import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import TaskCard from '../components/TaskCard'

export default function Tasks() {
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  
  const { tasks, isLoading, createTask, isCreating } = useTasks()

  const filteredTasks = tasks.filter((task: any) => {
    const matchesFilter = filter === 'all' || task.status === filter
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    
    try {
      await createTask({
        title: newTaskTitle,
        description: newTaskDescription,
      })
      setNewTaskTitle('')
      setNewTaskDescription('')
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const statusFilters = [
    { value: 'all', label: '全部', color: 'bg-slate-500' },
    { value: 'pending', label: '待处理', color: 'bg-amber-500' },
    { value: 'running', label: '进行中', color: 'bg-cyan-500' },
    { value: 'completed', label: '已完成', color: 'bg-emerald-500' },
    { value: 'failed', label: '失败', color: 'bg-rose-500' },
  ]

  // 任务状态统计
  const statusCounts = {
    all: tasks.length,
    pending: tasks.filter((t: any) => t.status === 'pending').length,
    running: tasks.filter((t: any) => t.status === 'running').length,
    completed: tasks.filter((t: any) => t.status === 'completed').length,
    failed: tasks.filter((t: any) => t.status === 'failed').length,
  }

  return (
    <div className="space-y-6">
      {/* 头部操作 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1 tracking-tight">
            任务管理
          </h1>
          <p className="text-sm text-slate-400">管理和监控所有任务执行</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="group relative px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          创建任务
        </button>
      </div>

      {/* 任务状态统计条 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statusFilters.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              filter === item.value
                ? 'bg-slate-700/80 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="text-xs text-slate-400 font-medium">{item.label}</span>
            </div>
            <p className={`text-2xl font-bold ${filter === item.value ? 'text-white' : 'text-slate-300'}`}>
              {statusCounts[item.value as keyof typeof statusCounts]}
            </p>
          </button>
        ))}
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* 搜索框 - 玻璃态效果 */}
        <div className="flex-1 max-w-md">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-30 group-focus-within:opacity-50 transition duration-300" />
            <div className="relative flex items-center bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700/50">
              <svg 
                className="w-5 h-5 text-slate-400 ml-4"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务..."
                className="w-full px-4 py-3 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* 快速筛选标签 */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('running')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'running' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            进行中
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            待处理
          </button>
        </div>
      </div>

      {/* 任务列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="group p-5 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="h-5 bg-slate-700 rounded-lg w-3/4" />
                <div className="h-6 w-20 bg-slate-700 rounded-full" />
              </div>
              <div className="h-2 bg-slate-700 rounded-full w-full mb-3" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((task: any, index: number) => (
            <div 
              key={task.id} 
              className="animate-in"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <TaskCard task={task} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-6">
            <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-200 mb-2">暂无任务</h3>
          <p className="text-slate-400 mb-6">
            {searchQuery ? '没有找到匹配的任务' : '创建你的第一个任务开始自动化之旅'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-cyan-500/25 font-medium"
            >
              创建任务
            </button>
          )}
        </div>
      )}

      {/* 创建任务对话框 - 玻璃态效果 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl blur opacity-20" />
            <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-100">创建新任务</h2>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    任务标题 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="输入任务标题"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    任务描述
                  </label>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="详细描述任务内容（可选）"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newTaskTitle.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isCreating ? '创建中...' : '创建'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
