import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowApi } from '../services/api'
import WorkflowCard from '../components/WorkflowCard'

export default function Workflows() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
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

  const workflows = data?.workflows || []

  const handleExecute = (workflowId: string) => {
    executeMutation.mutate({ id: workflowId })
  }

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
      ) : workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow: any) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onExecute={() => handleExecute(workflow.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">暂无工作流</h3>
          <p className="text-muted-foreground mb-4">创建你的第一个自动化工作流</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            创建工作流
          </button>
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
    </div>
  )
}
