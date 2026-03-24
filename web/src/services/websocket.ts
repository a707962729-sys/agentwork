import { useAppStore } from '../store/appStore'

type WebSocketMessage = 
  | { type: 'task:update'; data: any }
  | { type: 'task:created'; data: any }
  | { type: 'task:completed'; data: any }
  | { type: 'agent:status'; data: any }
  | { type: 'notification'; data: { type: string; title: string; message: string } }
  | { type: 'system:event'; data: any }

export const useWebSocket = () => {
  const wsUrl = `ws://${window.location.host}/ws`
  let ws: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  let reconnectTimeout: NodeJS.Timeout | null = null

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        reconnectAttempts = 0
        const { addNotification } = useAppStore.getState()
        addNotification({
          type: 'success',
          title: '连接成功',
          message: '已连接到实时通信服务',
          timestamp: new Date().toISOString(),
        })
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        attemptReconnect()
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      attemptReconnect()
    }
  }

  const handleMessage = (message: WebSocketMessage) => {
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
  }

  const attemptReconnect = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
      
      reconnectTimeout = setTimeout(() => {
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
  }

  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
  }

  const send = (data: any) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket not connected, message not sent:', data)
    }
  }

  return { connect, disconnect, send }
}
