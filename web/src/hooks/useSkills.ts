import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skillApi } from '../services/api'
import { useAppStore } from '../store/appStore'

export const useSkills = () => {
  const queryClient = useQueryClient()
  const { setSkills } = useAppStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillApi.getAll().then(res => res.data),
  })

  // ✅ 修复：移到 useEffect 里，避免无限循环
  useEffect(() => {
    if (data?.skills) {
      setSkills(data.skills)
    }
  }, [data, setSkills])

  const installMutation = useMutation({
    mutationFn: skillApi.install,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    },
  })

  const uninstallMutation = useMutation({
    mutationFn: skillApi.uninstall,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
    },
  })

  return {
    skills: data?.skills || [],
    isLoading,
    error,
    installSkill: installMutation.mutate,
    uninstallSkill: uninstallMutation.mutate,
    isInstalling: installMutation.isPending,
    isUninstalling: uninstallMutation.isPending,
  }
}

export const useSkillDetails = (name: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['skill', name],
    queryFn: () => skillApi.getDetails(name).then(res => res.data),
    enabled: !!name,
  })

  return {
    skill: data?.skill,
    isLoading,
    error,
  }
}
