import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '../store/appStore'

type WebSocketMessage = 
  | { type: 'task:update'; data: any }
  | { type: 'task:created'; data: any }
  | { type: 'task:completed'; data: any }
  | { type: 'agent:status'; data: any }
  | { type: 'notification'; data: { type: string; title: string; message: string } }
  | { type: 'system:event'; data: any }

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleMessage = useCallback((message: WebSocketMessage) => {
    const { updateTask, updateAgent, addNotification, setTasks } = useAppStore.getState()

    switch (message.type) {
      case 'task:update':
        updateTask(message.data)
        break
      
      case 'task:created':
        const tasks = useAppStore.getState().tasks
        setTasks([message.data, ...tasks])
        addNotification({
          type: 'info',
          title: '新任务',
          message: `任务 "${message.data.title}" 已创建`,
          timestamp: new Date().toISOString(),
        })
        break
      
      case 'task:completed':
        updateTask(message.data)
        addNotification({
          type: 'success',
          title: '任务完成',
          message: `任务 "${message.data.title}" 已完成`,
          timestamp: new Date().toISOString(),
        })
        break
      
      case 'agent:status':
        updateAgent(message.data)
        break
      
      case 'notification':
        addNotification({
          type: message.data.type as any,
          title: message.data.title,
          message: message.data.message,
          timestamp: new Date().toISOString(),
        })
        break
      
      case 'system:event':
        console.log('System event:', message.data)
        break
    }
  }, [])

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`)
      
      reconnectTimeout.current = setTimeout(() => {
        connect()
      }, delay)
    } else {
      const { addNotification } = useAppStore.getState()
      addNotification({
        type: 'error',
        title: '连接失败',
        message: '无法连接到实时通信服务，请检查后端服务',
        timestamp: new Date().toISOString(),
      })
    }
  }, [])

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }

    try {
      const wsUrl = `http://${window.location.host}`
      socketRef.current = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        reconnectionAttempts: maxReconnectAttempts,
      })

      socketRef.current.on('connect', () => {
        console.log('Socket.io connected')
        reconnectAttempts.current = 0
        const { addNotification } = useAppStore.getState()
        addNotification({
          type: 'success',
          title: '连接成功',
          message: '已连接到实时通信服务',
          timestamp: new Date().toISOString(),
        })
      })

      socketRef.current.on('task:created', (data: any) => {
        handleMessage({ type: 'task:created', data })
      })

      socketRef.current.on('task:updated', (data: any) => {
        handleMessage({ type: 'task:update', data })
      })

      socketRef.current.on('task:completed', (data: any) => {
        handleMessage({ type: 'task:completed', data })
      })

      socketRef.current.on('agent:status', (data: any) => {
        handleMessage({ type: 'agent:status', data })
      })

      socketRef.current.on('notification', (data: any) => {
        handleMessage({ type: 'notification', data })
      })

      socketRef.current.on('disconnect', () => {
        console.log('Socket.io disconnected')
        attemptReconnect()
      })

      socketRef.current.on('connect_error', (error: any) => {
        console.error('Socket.io connection error:', error)
      })
    } catch (error) {
      console.error('Failed to connect Socket.io:', error)
      attemptReconnect()
    }
  }, [handleMessage, attemptReconnect])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [connect])

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  const send = useCallback((data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', data)
    } else {
      console.warn('Socket.io not connected, message not sent:', data)
    }
  }, [])

  return { connect, disconnect, send }
}
