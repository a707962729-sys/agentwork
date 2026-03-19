import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface ChatMessageProps {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-primary-500/20 border-primary-500/30 ml-auto max-w-[80%]'
      case 'assistant':
        return 'bg-dark-card border-dark-border mr-auto max-w-[80%]'
      case 'system':
        return 'bg-yellow-500/20 border-yellow-500/30 mx-auto max-w-[90%]'
      default:
        return 'bg-dark-card border-dark-border'
    }
  }

  if (role === 'system') {
    return (
      <div className={`p-3 rounded-lg border ${getRoleStyles(role)} my-2`}>
        <p className="text-sm text-foreground">{content}</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${role === 'user' ? 'items-end' : 'items-start'} mb-4`}>
      <div className={`p-4 rounded-lg border ${getRoleStyles(role)}`}>
        <div className="markdown-body text-sm">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1 px-2">
        {formatTime(timestamp)}
      </span>
    </div>
  )
}
