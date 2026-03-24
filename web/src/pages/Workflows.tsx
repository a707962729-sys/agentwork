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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">工作流管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">创建和执行自动化工作流</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="group relative px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center gap-2 font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          创建工作流
        </button>
      </div>

      {/* 工作流列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border animate-pulse">
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
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-dark-card/50 border border-dark-border/50 mb-6">
            <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">暂无工作流</h3>
          <p className="text-slate-500 mb-4">创建你的第一个自动化工作流</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 shadow-lg shadow-emerald-500/25 font-medium text-sm"
          >
            创建工作流
          </button>
        </div>
      )}

      {/* 创建工作流对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-2xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-2xl blur opacity-20" />
            <div className="relative bg-dark-card/95 backdrop-blur-xl rounded-2xl border border-dark-border p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">创建工作流</h2>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="p-2 hover:bg-dark-bg rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-center py-8">
                <p className="text-slate-400 mb-4">工作流编辑器开发中...</p>
                <p className="text-sm text-slate-500">
                  请稍后使用 CLI 或 API 创建工作流
                </p>
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="mt-6 px-5 py-2.5 bg-dark-bg text-slate-300 rounded-xl hover:bg-dark-border transition-colors font-medium text-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
