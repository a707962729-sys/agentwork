import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { chatApi } from '../services/api'
import ChatMessage from '../components/ChatMessage'

export default function Chat() {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { data: historyData } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => chatApi.getHistory(50).then(res => res.data),
  })

  const sendMutation = useMutation({
    mutationFn: (msg: string) => chatApi.send(msg),
  })

  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (historyData?.messages) {
      setMessages(historyData.messages)
    }
  }, [historyData])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!message.trim() || sendMutation.isPending) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')

    try {
      const response = await sendMutation.mutateAsync(userMessage.content)
      
      // 添加助手回复
      if (response.data?.reply) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: response.data.reply,
          timestamp: new Date().toISOString(),
        }])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // 添加错误消息
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system' as const,
        content: '发送失败，请检查网络连接',
        timestamp: new Date().toISOString(),
      }])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* 头部 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-1">对话界面</h1>
        <p className="text-sm text-muted-foreground">与 Coordinator 自然语言交互</p>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto mb-4 p-4 bg-dark-card rounded-lg border border-dark-border">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              id={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-foreground mb-2">开始对话</h3>
              <p className="text-muted-foreground max-w-md">
                输入消息与 Coordinator 交流，可以创建任务、查询状态、管理工作流等
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSend} className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Shift+Enter 换行)"
            rows={3}
            className="w-full px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || sendMutation.isPending}
          className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sendMutation.isPending ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              发送中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              发送
            </>
          )}
        </button>
      </form>

      {/* 快捷命令 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setMessage('/tasks list')}
          className="px-3 py-1.5 text-xs bg-dark-card text-muted-foreground rounded hover:bg-dark-border transition-colors"
        >
          /tasks list
        </button>
        <button
          onClick={() => setMessage('/tasks create 新任务')}
          className="px-3 py-1.5 text-xs bg-dark-card text-muted-foreground rounded hover:bg-dark-border transition-colors"
        >
          /tasks create
        </button>
        <button
          onClick={() => setMessage('/status')}
          className="px-3 py-1.5 text-xs bg-dark-card text-muted-foreground rounded hover:bg-dark-border transition-colors"
        >
          /status
        </button>
        <button
          onClick={() => setMessage('/help')}
          className="px-3 py-1.5 text-xs bg-dark-card text-muted-foreground rounded hover:bg-dark-border transition-colors"
        >
          /help
        </button>
      </div>
    </div>
  )
}
