import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowApi } from '../services/api'
import WorkflowCard from '../components/WorkflowCard'
import StatusBadge from '../components/StatusBadge'

export default function Workflows() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowApi.getAll().then(res => res.data),
  })

  const executeMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params?: any }) => 
      workflowApi.execute(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      workflowApi.toggleStatus(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflowApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })

  const workflows = data?.data || []

  // 搜索和筛选
  const filteredWorkflows = workflows.filter((workflow: any) => {
    const matchesSearch = !searchQuery || 
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'enabled' && workflow.enabled) ||
      (filterStatus === 'disabled' && !workflow.enabled)
    return matchesSearch && matchesStatus
  })

  const handleExecute = (workflowId: string) => {
    executeMutation.mutate({ id: workflowId })
  }

  const handleToggleStatus = (workflow: any, newStatus: boolean) => {
    toggleStatusMutation.mutate({ id: workflow.id, enabled: newStatus })
  }

  const handleEdit = (workflow: any) => {
    setSelectedWorkflow(workflow)
    setShowEditDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个工作流吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSaveEdit = () => {
    // TODO: 实现保存逻辑
    setShowEditDialog(false)
   refetch()
  }

  useEffect(() => {
    if (executeMutation.isSuccess || toggleStatusMutation.isSuccess || deleteMutation.isSuccess) {
      refetch()
    }
  }, [executeMutation.isSuccess, toggleStatusMutation.isSuccess, deleteMutation.isSuccess, refetch])

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">工作流管理</h1>
          <p className="text-sm text-muted-foreground">创建和执行自动化工作流</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          创建工作流
        </button>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 状态筛选 */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { value: 'all', label: '全部' },
            { value: 'enabled', label: '已启用' },
            { value: 'disabled', label: '已禁用' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilterStatus(item.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === item.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-card text-muted-foreground hover:bg-dark-border'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="flex-1 md:max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索工作流..."
              className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <svg 
              className="absolute right-3 top-2.5 w-5 h-5 text-muted-foreground"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 工作流列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 bg-dark-card rounded-lg border border-dark-border animate-pulse">
              <div className="h-4 bg-dark-bg rounded w-3/4 mb-3" />
              <div className="h-3 bg-dark-bg rounded w-full mb-2" />
              <div className="h-3 bg-dark-bg rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredWorkflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map((workflow: any) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onExecute={() => handleExecute(workflow.id)}
              onEdit={() => handleEdit(workflow)}
              onDelete={() => handleDelete(workflow.id)}
            >
              {/* 自定义卡片内容 */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">状态：</span>
                  <StatusBadge status={workflow.enabled ? 'active' : 'inactive'} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleStatus(workflow, !workflow.enabled)
                    }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      workflow.enabled
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                    }`}
                  >
                    {workflow.enabled ? '禁用' : '启用'}
                  </button>
                </div>
              </div>
            </WorkflowCard>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery || filterStatus !== 'all' ? '没有找到匹配的工作流' : '暂无工作流'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterStatus !== 'all' 
              ? '尝试调整搜索条件或筛选器' 
              : '创建你的第一个自动化工作流'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              创建工作流
            </button>
          )}
        </div>
      )}

      {/* 创建工作流对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-lg border border-dark-border w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">创建工作流</h2>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="p-1 hover:bg-dark-bg rounded"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">工作流编辑器开发中...</p>
              <p className="text-sm text-muted-foreground">
                请稍后使用 CLI 或 API 创建工作流
              </p>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="mt-6 px-4 py-2 bg-dark-bg text-foreground rounded-lg hover:bg-dark-border transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑工作流对话框 */}
      {showEditDialog && selectedWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-lg border border-dark-border w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">编辑工作流</h2>
              <button
                onClick={() => setShowEditDialog(false)}
                className="p-1 hover:bg-dark-bg rounded"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">名称</label>
                <input
                  type="text"
                  value={selectedWorkflow.name || ''}
                  onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, name: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">描述</label>
                <textarea
                  value={selectedWorkflow.description || ''}
                  onChange={(e) => setSelectedWorkflow({ ...selectedWorkflow, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1 px-4 py-2 bg-dark-bg text-foreground rounded-lg hover:bg-dark-border transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
