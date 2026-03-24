import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../store/appStore'

interface WebSocketMessage {
  type: string
  task?: any
  tasks?: any[]
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const updateTaskRef = useRef(useAppStore.getState().updateTask)
  const setTasksRef = useRef(useAppStore.getState().setTasks)

  // 保持引用最新
  useEffect(() => {
    updateTaskRef.current = useAppStore.getState().updateTask
    setTasksRef.current = useAppStore.getState().setTasks
  })

  const connect = useCallback(() => {
    // 避免重复连接
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3001/ws'
    
    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket 已连接')
        // 认证/订阅
        wsRef.current?.send(JSON.stringify({ type: 'subscribe', channel: 'tasks' }))
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          switch (message.type) {
            case 'task:created':
              // 新任务由 React Query 处理，WebSocket 只做增量更新
              break
            case 'task:updated':
              if (message.task) {
                updateTaskRef.current(message.task)
              }
              break
            case 'tasks:sync':
              // 全量同步
              if (message.tasks) {
                setTasksRef.current(message.tasks)
              }
              break
            default:
              break
          }
        } catch (e) {
          console.error('WebSocket 消息解析失败:', e)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket 错误:', error)
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket 连接关闭，5秒后重连...')
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }
    } catch (e) {
      console.error('WebSocket 连接失败:', e)
      reconnectTimeoutRef.current = setTimeout(connect, 5000)
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect,
    connect,
  }
}
