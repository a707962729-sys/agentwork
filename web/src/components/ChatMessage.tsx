import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface Attachment {
  name: string
  type: 'image' | 'document'
  url?: string
}

interface ChatMessageProps {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  attachments?: Attachment[]
}

export default function ChatMessage({ role, content, timestamp, attachments }: ChatMessageProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border-cyan-500/30 ml-auto max-w-[85%]'
      case 'assistant':
        return 'bg-dark-card/90 border-dark-border/80 mr-auto max-w-[85%]'
      case 'system':
        return 'bg-amber-500/10 border-amber-500/30 mx-auto max-w-[90%]'
      default:
        return 'bg-dark-card/90 border-dark-border/80'
    }
  }

  if (role === 'system') {
    return (
      <div className={`p-3 rounded-xl border ${getRoleStyles(role)} my-3`}>
        <p className="text-sm text-slate-400 text-center">{content}</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${role === 'user' ? 'items-end' : 'items-start'} mb-4`}>
      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <div className={`flex flex-wrap gap-2 mb-2 ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {attachments.map((att, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-bg/60 border border-dark-border text-sm ${role === 'user' ? 'order-1' : ''}`}>
              {att.type === 'image' && att.url ? (
                <img src={att.url} alt={att.name} className="w-16 h-16 object-cover rounded" />
              ) : (
                <svg className="w-5 h-5 text-[#86909C] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className="text-xs text-[#86909C]">{att.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`p-4 rounded-2xl border backdrop-blur-sm ${getRoleStyles(role)}`}>
        <div className="markdown-body text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      <span className="text-xs text-slate-500 mt-1.5 px-2">
        {formatTime(timestamp)}
      </span>
    </div>
  )
}
