import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { chatApi } from '../services/api'
import ChatMessage from '../components/ChatMessage'

interface Attachment {
  id: string
  name: string
  type: 'image' | 'document'
  size: number
  url: string
  file?: File
}

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const DOC_EXTS = ['.pdf', '.docx', '.xlsx', '.txt', '.xls', '.doc']

function getFileType(name: string): 'image' | 'document' {
  const ext = '.' + name.split('.').pop()?.toLowerCase()
  if (IMAGE_EXTS.includes(ext)) return 'image'
  return 'document'
}


function FilePreview({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  return (
    <div className="relative group inline-block">
      {attachment.type === 'image' ? (
        <div className="relative">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-20 h-20 object-cover rounded-lg border border-dark-border"
          />
          <button
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative w-20 h-20 flex flex-col items-center justify-center bg-dark-bg rounded-lg border border-dark-border p-2">
          <svg className="w-8 h-8 text-[#86909C] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs text-[#86909C] text-center truncate w-full">
            {attachment.name.split('.').pop()?.toUpperCase()}
          </span>
          <button
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default function Chat() {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: historyData } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => chatApi.getHistory(50).then(res => res.data),
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newAttachments: Attachment[] = files.map(file => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      type: getFileType(file.name),
      size: file.size,
      url: URL.createObjectURL(file),
      file,
    }))
    setAttachments(prev => [...prev, ...newAttachments])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id)
      if (att) URL.revokeObjectURL(att.url)
      return prev.filter(a => a.id !== id)
    })
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!message.trim() && attachments.length === 0) || sendMutation.isPending) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message.trim(),
      attachments: attachments.map(a => ({ name: a.name, type: a.type, url: a.url })),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setAttachments([])

    try {
      const formData = new FormData()
      formData.append('message', message.trim())
      attachments.forEach(att => {
        if (att.file) formData.append('files', att.file)
      })

      const response: any = await sendMutation.mutateAsync(formData)

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
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system' as const,
        content: '发送失败，请检查网络连接',
        timestamp: new Date().toISOString(),
      }])
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (formData: FormData) => chatApi.sendWithFiles(formData) as any,
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* 头部 */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">对话界面</h1>
        <p className="text-sm text-muted-foreground mt-0.5">与 Coordinator 自然语言交互</p>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto mb-4 p-4 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              id={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              attachments={msg.attachments}
            />
          ))
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-blue-500/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">开始对话</h3>
              <p className="text-slate-400 max-w-md text-sm leading-relaxed">
                输入消息与 Coordinator 交流，可以创建任务、查询状态、管理工作流等
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 附件预览 */}
      {attachments.length > 0 && (
        <div className="mb-3 flex gap-3 flex-wrap flex-shrink-0">
          {attachments.map(att => (
            <FilePreview
              key={att.id}
              attachment={att}
              onRemove={() => removeAttachment(att.id)}
            />
          ))}
        </div>
      )}

      {/* 输入框 */}
      <form onSubmit={handleSend} className="flex gap-3 flex-shrink-0">
        <div className="flex-1 relative">
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20 group-focus-within:opacity-40 transition duration-300" />
            <div className="relative flex items-center bg-dark-card/80 backdrop-blur-xl rounded-xl border border-dark-border">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息... (Shift+Enter 换行)"
                rows={1}
                className="w-full px-4 py-3 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none resize-none rounded-xl text-sm"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
          </div>
        </div>

        {/* 附件按钮 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={IMAGE_EXTS.join(',') + ',' + DOC_EXTS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-3 bg-dark-card/80 backdrop-blur-xl text-slate-400 hover:text-white rounded-xl border border-dark-border hover:border-dark-border/80 transition-all flex items-center gap-2"
          title="添加附件"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* 发送按钮 */}
        <button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || sendMutation.isPending}
          className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg shadow-cyan-500/25 text-sm"
        >
          {sendMutation.isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              发送中
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              发送
            </>
          )}
        </button>
      </form>

      {/* 快捷命令 */}
      <div className="mt-4 flex flex-wrap gap-2 flex-shrink-0">
        <button
          onClick={() => setMessage('/tasks list')}
          className="px-3 py-1.5 text-xs bg-dark-card/80 backdrop-blur-xl text-slate-400 rounded-lg hover:bg-dark-border hover:text-slate-200 transition-all border border-dark-border"
        >
          /tasks list
        </button>
        <button
          onClick={() => setMessage('/tasks create 新任务')}
          className="px-3 py-1.5 text-xs bg-dark-card/80 backdrop-blur-xl text-slate-400 rounded-lg hover:bg-dark-border hover:text-slate-200 transition-all border border-dark-border"
        >
          /tasks create
        </button>
        <button
          onClick={() => setMessage('/status')}
          className="px-3 py-1.5 text-xs bg-dark-card/80 backdrop-blur-xl text-slate-400 rounded-lg hover:bg-dark-border hover:text-slate-200 transition-all border border-dark-border"
        >
          /status
        </button>
        <button
          onClick={() => setMessage('/help')}
          className="px-3 py-1.5 text-xs bg-dark-card/80 backdrop-blur-xl text-slate-400 rounded-lg hover:bg-dark-border hover:text-slate-200 transition-all border border-dark-border"
        >
          /help
        </button>
      </div>
    </div>
  )
}
