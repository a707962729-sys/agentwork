import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi } from '../services/api'
import { useAppStore } from '../store/appStore'

export const useTasks = (filters?: { status?: string }) => {
  const queryClient = useQueryClient()
  const { setTasks, updateTask } = useAppStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.getAll(filters).then(res => res.data),
    refetchInterval: 5000, // 每 5 秒刷新一次
  })

  // 同步到 Zustand store
  if (data) {
    setTasks(data.tasks || [])
  }

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
    refetchInterval: 2000, // 详情页刷新更频繁
  })

  // 同步到 Zustand store
  if (data?.task) {
    setCurrentTask(data.task)
  }

  return {
    task: data?.task,
    isLoading,
    error,
  }
}
