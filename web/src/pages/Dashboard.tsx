import { useEffect, useState } from 'react'
import Dashboard from '../components/Dashboard'
import { systemApi, taskApi, agentApi } from '../services/api'

interface DashboardData {
  stats: any
  recentTasks: any[]
  taskTrend: any[]
  taskDistribution: any[]
  agentActivity: any[]
  timelineEvents: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    stats: {
      todayTasks: 0,
      runningTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      successRate: 0,
      activeAgents: 0,
      totalAgents: 0,
      systemUptime: '0h',
      todayOutputs: 0,
    },
    recentTasks: [],
    taskTrend: [],
    taskDistribution: [],
    agentActivity: [],
    timelineEvents: [],
  })

  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const [statsRes, recentTasksRes, agentsRes] = await Promise.all([
        systemApi.getStats(),
        taskApi.getAll({ limit: 10 }),
        agentApi.getAll(),
      ])

      // 模拟任务趋势数据（最近 7 天）
      const taskTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return {
          date: date.getMonth() + 1 + '/' + date.getDate(),
          count: Math.floor(Math.random() * 50) + 10,
        }
      })

      // 模拟任务分布数据
      const taskDistribution = [
        { name: '文本生成', value: Math.floor(Math.random() * 100) + 20 },
        { name: '数据分析', value: Math.floor(Math.random() * 100) + 20 },
        { name: '图片生成', value: Math.floor(Math.random() * 100) + 20 },
        { name: '文件处理', value: Math.floor(Math.random() * 100) + 20 },
        { name: 'API 调用', value: Math.floor(Math.random() * 100) + 20 },
      ]

      // 模拟 Agent 活跃度数据
      const agents = agentsRes.data?.agents || []
      const agentActivity = agents.slice(0, 10).map((agent: any) => ({
        name: agent.name,
        value: Math.floor(Math.random() * 100),
      }))

      // 模拟时间线事件
      const timelineEvents = [
        {
          id: '1',
          title: '任务生成报告',
          time: '10:30',
          status: 'completed',
          description: 'GenAI Agent 完成数据分析',
          type: 'task',
        },
        {
          id: '2',
          title: '需要确认方案',
          time: '11:00',
          status: 'pending',
          description: '营销策略方案需要审核',
          type: 'decision',
        },
        {
          id: '3',
          title: '系统清理完成',
          time: '09:00',
          status: 'completed',
          description: '自动清理 7 天前的临时文件',
          type: 'system',
        },
        {
          id: '4',
          title: '任务创建成功',
          time: '11:15',
          status: 'running',
          description: '新任务已启动执行',
          type: 'task',
        },
      ]

      setData({
        stats: statsRes.data?.stats || {
          todayTasks: 12,
          runningTasks: 3,
          completedTasks: 8,
          failedTasks: 1,
          successRate: 94.7,
          activeAgents: 5,
          totalAgents: 8,
          systemUptime: '24h',
          todayOutputs: 15,
        },
        recentTasks: recentTasksRes.data?.tasks || [],
        taskTrend,
        taskDistribution,
        agentActivity,
        timelineEvents,
      })

      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    const interval = setInterval(() => {
      // 仅刷新部分数据
      fetchDashboardData().catch(console.error)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  return <Dashboard data={data} />
}
