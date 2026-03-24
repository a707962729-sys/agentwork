import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi } from '../services/api'
import { useAppStore } from '../store/appStore'

export const useTasks = (filters?: { status?: string }) => {
  const queryClient = useQueryClient()
  const { setTasks, updateTask } = useAppStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.getAll(filters).then(res => res.data),
    // 移除 refetchInterval，依赖 WebSocket 实时更新
  })

  // ✅ 修复：移到 useEffect 里，避免无限循环
  useEffect(() => {
    if (data?.tasks) {
      setTasks(data.tasks)
    }
  }, [data, setTasks])

  const createMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taskApi.update(id, data),
    onSuccess: (response) => {
      updateTask(response.data.task)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const controlMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'pause' | 'resume' | 'cancel' }) => 
      taskApi.control(id, action),
    onSuccess: (response) => {
      updateTask(response.data.task)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  return {
    tasks: data?.tasks || [],
    isLoading,
    error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    controlTask: controlMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isControlling: controlMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

export const useTask = (id: string) => {
  const { setCurrentTask } = useAppStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.getById(id).then(res => res.data),
    enabled: !!id,
    // running 的任务每 2 秒轮询一次获取最新状态
    refetchInterval: (query) => {
      const task = query.state.data?.task
      return task?.status === 'running' ? 2000 : false
    },
  })

  // ✅ 修复：移到 useEffect 里，避免无限循环
  useEffect(() => {
    if (data?.task) {
      setCurrentTask(data.task)
    }
  }, [data, setCurrentTask])

  return {
    task: data?.task,
    isLoading,
    error,
  }
}

export { useWebSocket } from '../services/websocket'
