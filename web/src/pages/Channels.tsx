import { useState, useEffect } from 'react'

interface ChannelConfig {
  webhook?: string
  appKey?: string
  appSecret?: string
  corpId?: string
  agentId?: string
  appId?: string
  enabled?: boolean
}

interface Channel {
  id: string
  name: string
  emoji: string
  status: 'online' | 'offline' | 'configuring'
  type: 'qq' | 'discord' | 'telegram' | 'slack' | 'dingtalk' | 'wechatwork' | 'feishu'
  config?: ChannelConfig
}

const STORAGE_KEY = 'agentwork_channel_configs'

function loadChannelsFromStorage(): Channel[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function saveChannelsToStorage(channels: Channel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(channels))
}

const defaultChannels: Channel[] = [
  { id: 'qq', name: 'QQ 机器人', emoji: '🐧', status: 'configuring', type: 'qq' },
  { id: 'discord', name: 'Discord', emoji: '🎮', status: 'offline', type: 'discord' },
  { id: 'telegram', name: 'Telegram', emoji: '✈️', status: 'offline', type: 'telegram' },
  { id: 'slack', name: 'Slack', emoji: '💬', status: 'offline', type: 'slack' },
  { id: 'dingtalk', name: '钉钉', emoji: '🔔', status: 'offline', type: 'dingtalk' },
  { id: 'wechatwork', name: '企业微信', emoji: '💬', status: 'offline', type: 'wechatwork' },
  { id: 'feishu', name: '飞书', emoji: '📋', status: 'offline', type: 'feishu' },
]

const channelFields: Record<string, { label: string; key: keyof ChannelConfig; type: string; placeholder: string }[]> = {
  qq: [
    { label: 'Webhook URL', key: 'webhook', type: 'text', placeholder: 'https://oapi.dingtalk.com/robot/send?access_token=...' },
  ],
  discord: [
    { label: 'Webhook URL', key: 'webhook', type: 'text', placeholder: 'https://discord.com/api/webhooks/...' },
    { label: 'Bot Token', key: 'appKey', type: 'password', placeholder: 'Bot Token' },
  ],
  telegram: [
    { label: 'Bot Token', key: 'appKey', type: 'password', placeholder: '123456:ABC-DEF...' },
  ],
  slack: [
    { label: 'Webhook URL', key: 'webhook', type: 'text', placeholder: 'https://hooks.slack.com/services/...' },
    { label: 'Bot Token', key: 'appKey', type: 'password', placeholder: 'xoxb-...' },
  ],
  dingtalk: [
    { label: 'Webhook URL', key: 'webhook', type: 'text', placeholder: 'https://oapi.dingtalk.com/robot/send?access_token=...' },
    { label: 'App Key', key: 'appKey', type: 'text', placeholder: 'dingXXXXXXXX' },
    { label: 'App Secret', key: 'appSecret', type: 'password', placeholder: 'App Secret' },
  ],
  wechatwork: [
    { label: 'Webhook URL', key: 'webhook', type: 'text', placeholder: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...' },
    { label: 'Corp ID', key: 'corpId', type: 'text', placeholder: 'wwxxxxxxxxxxxxx' },
    { label: 'Agent ID', key: 'agentId', type: 'text', placeholder: '1000001' },
  ],
  feishu: [
    { label: 'Webhook URL', key: 'webhook', type: 'text', placeholder: 'https://open.feishu.cn/open-apis/bot/v2/hook/...' },
    { label: 'App ID', key: 'appId', type: 'text', placeholder: 'cli_xxxxxxxx' },
    { label: 'App Secret', key: 'appSecret', type: 'password', placeholder: 'App Secret' },
  ],
}

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>(() => {
    const stored = loadChannelsFromStorage()
    if (stored.length > 0) {
      // Merge stored config into defaults
      return defaultChannels.map(def => {
        const saved = stored.find(s => s.id === def.id)
        return saved ? { ...def, config: saved.config, status: saved.status } : def
      })
    }
    return defaultChannels
  })
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<ChannelConfig>({})

  useEffect(() => {
    saveChannelsToStorage(channels)
  }, [channels])

  const openConfig = (channel: Channel) => {
    setSelectedChannel(channel)
    setFormData({
      webhook: channel.config?.webhook || '',
      appKey: channel.config?.appKey || '',
      appSecret: channel.config?.appSecret || '',
      corpId: channel.config?.corpId || '',
      agentId: channel.config?.agentId || '',
      appId: channel.config?.appId || '',
      enabled: channel.config?.enabled || false,
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!selectedChannel) return
    setChannels(prev =>
      prev.map(ch =>
        ch.id === selectedChannel.id
          ? { ...ch, config: formData, status: formData.enabled ? 'online' : 'offline' as const }
          : ch
      )
    )
    setShowModal(false)
  }

  const getStatusBadge = (status: Channel['status']) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            在线
          </span>
        )
      case 'configuring':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full border border-amber-500/20">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            配置中
          </span>
        )
      case 'offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 text-slate-400 text-xs font-medium rounded-full border border-slate-500/20">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
            离线
          </span>
        )
    }
  }

  const fields = selectedChannel ? channelFields[selectedChannel.type] || [] : []

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">渠道配置</h1>
          <p className="text-sm text-muted-foreground mt-0.5">管理消息渠道和机器人集成</p>
        </div>
      </div>

      {/* 渠道列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border shadow-lg shadow-black/10 hover:border-dark-border/80 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-dark-bg/80 flex items-center justify-center text-2xl border border-dark-border">
                  {channel.emoji}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{channel.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{channel.type}</p>
                </div>
              </div>
              {getStatusBadge(channel.status)}
            </div>

            <div className="space-y-2 text-xs text-slate-500 mb-4">
              {channel.config?.webhook && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="truncate max-w-[160px]">{channel.config.webhook}</span>
                </div>
              )}
              {channel.config?.appKey && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Key 已配置</span>
                </div>
              )}
              {!channel.config?.webhook && !channel.config?.appKey && (
                <p className="text-slate-600 italic">尚未配置</p>
              )}
            </div>

            <button
              onClick={() => openConfig(channel)}
              className="w-full px-4 py-2 bg-dark-bg/80 text-slate-300 rounded-lg hover:bg-dark-border hover:text-white transition-all font-medium text-xs border border-dark-border"
            >
              配置
            </button>
          </div>
        ))}
      </div>

      {/* 渠道详情弹窗 */}
      {showModal && selectedChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-[#1E2128] rounded-2xl border border-dark-border shadow-2xl">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-5 border-b border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-bg/80 flex items-center justify-center text-xl border border-dark-border">
                  {selectedChannel.emoji}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{selectedChannel.name} 配置</h3>
                  <p className="text-xs text-slate-500">{selectedChannel.name} 渠道设置</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg bg-dark-bg/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-border transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-5 space-y-4">
              {fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={(formData[field.key] as string) || ''}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-dark-bg/80 border border-dark-border rounded-xl text-foreground placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all text-sm"
                  />
                </div>
              ))}

              {/* 启用开关 */}
              <div className="flex items-center justify-between py-3 border-t border-dark-border">
                <div>
                  <p className="font-medium text-foreground text-sm">启用渠道</p>
                  <p className="text-xs text-slate-500 mt-0.5">开启后自动接收消息</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formData.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.enabled ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="flex gap-3 p-5 border-t border-dark-border">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-dark-bg/80 text-slate-300 rounded-xl hover:bg-dark-border transition-colors font-medium text-sm border border-dark-border"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all font-medium text-sm shadow-lg shadow-cyan-500/25"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
