// 工作成果资产库页面

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { assetApi } from '../services/api'
import Modal from '../components/Modal'

// Mock 数据
const mockAssets = [
  {
    id: 'asset-1',
    filename: 'Q1销售数据分析报告.xlsx',
    employee: '小智',
    task: 'Q1季度销售数据汇总分析',
    time: '今天 10:32',
    type: 'report' as const,
    isNew: true,
    size: '2.4 MB',
    preview: '本报告分析了2024年第一季度销售数据，总营收达到...',
  },
  {
    id: 'asset-2',
    filename: '产品发布会宣传文案.docx',
    employee: '小文',
    task: '新品发布会新闻稿撰写',
    time: '今天 09:45',
    type: 'document' as const,
    isNew: true,
    size: '156 KB',
    preview: '【新闻稿】今日，我们荣幸地宣布...',
  },
  {
    id: 'asset-3',
    filename: '客户跟进名单.xlsx',
    employee: '小客',
    task: '本周重点客户跟进列表整理',
    time: '今天 09:20',
    type: 'data' as const,
    isNew: true,
    size: '892 KB',
    preview: '本周重点跟进客户名单，共计 45 家...',
  },
  {
    id: 'asset-4',
    filename: '月度销售报表_2月.pdf',
    employee: '小报',
    task: '2月销售数据月度汇总',
    time: '昨天 18:00',
    type: 'report' as const,
    isNew: false,
    size: '3.1 MB',
    preview: '2月份销售数据分析报告...',
  },
  {
    id: 'asset-5',
    filename: '品牌营销方案_v2.docx',
    employee: '小文',
    task: '品牌年度营销方案修订',
    time: '昨天 15:30',
    type: 'document' as const,
    isNew: false,
    size: '234 KB',
    preview: '品牌营销全年规划方案，包含...',
  },
  {
    id: 'asset-6',
    filename: '用户行为数据.xlsx',
    employee: '小智',
    task: '网站用户行为埋点数据分析',
    time: '前天 17:20',
    type: 'data' as const,
    isNew: false,
    size: '1.8 MB',
    preview: '网站用户行为数据统计，总访问量...',
  },
  {
    id: 'asset-7',
    filename: '季度业绩汇总报告.pdf',
    employee: '小报',
    task: 'Q4业绩完成情况汇总',
    time: '03-20 10:00',
    type: 'report' as const,
    isNew: false,
    size: '4.2 MB',
    preview: '第四季度业绩完成情况...',
  },
  {
    id: 'asset-8',
    filename: '竞品分析报告.docx',
    employee: '小文',
    task: '竞品功能对比分析',
    time: '03-19 16:45',
    type: 'document' as const,
    isNew: false,
    size: '567 KB',
    preview: '竞品功能对比分析报告...',
  },
]

const typeConfig = {
  document: { label: '文档类', color: '#165DFF', icon: '📄' },
  data: { label: '数据类', color: '#00B42A', icon: '📊' },
  report: { label: '报表类', color: '#FF7D00', icon: '📈' },
}

interface Asset {
  id: string
  filename: string
  employee: string
  task: string
  time: string
  type: 'document' | 'data' | 'report'
  isNew: boolean
  size?: string
  preview?: string
}

function AssetCard({ asset, onClick }: { asset: Asset; onClick: () => void }) {
  const config = typeConfig[asset.type]

  return (
    <div
      onClick={onClick}
      className="bg-[#1E2128] rounded-xl p-4 border border-dark-border hover:border-[#165DFF]/30 transition-colors cursor-pointer"
    >
      {/* 文件信息 */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${config.color}15` }}
        >
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white truncate">{asset.filename}</h3>
            {asset.isNew && (
              <span className="text-[10px] px-1.5 py-0.5 bg-[#165DFF]/10 text-[#165DFF] rounded flex-shrink-0">NEW</span>
            )}
          </div>
          <p className="text-xs text-[#86909C] mt-0.5">
            产出员工：<span className="text-white">{asset.employee}</span>
          </p>
        </div>
      </div>

      {/* 任务说明 */}
      <p className="text-xs text-[#86909C] mb-3 line-clamp-2">{asset.task}</p>

      {/* 底部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#86909C]">{asset.time}</span>
          {asset.size && (
            <span className="text-xs text-[#86909C]">· {asset.size}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ backgroundColor: `${config.color}10`, color: config.color }}
          >
            {config.label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="text-xs px-2 py-1 bg-[#165DFF]/10 text-[#165DFF] rounded hover:bg-[#165DFF]/20 transition-colors"
          >
            预览
          </button>
        </div>
      </div>
    </div>
  )
}

function AssetDetailModal({ asset, isOpen, onClose }: { asset: Asset | null; isOpen: boolean; onClose: () => void }) {
  if (!asset) return null

  const config = typeConfig[asset.type]

  const handleDownload = () => {
    // 模拟下载，实际应该调用 API
    const link = document.createElement('a')
    link.href = '#'
    link.download = asset.filename
    link.click()
  }

  const handleViewSourceTask = () => {
    // 跳转到任务页面
    window.location.href = `/tasks?search=${encodeURIComponent(asset.task)}`
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="成果详情" width="lg">
      <div className="space-y-6">
        {/* 文件信息 */}
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: `${config.color}15` }}
          >
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{asset.filename}</h3>
            <p className="text-sm text-[#86909C] mt-1">
              产出员工：<span className="text-white">{asset.employee}</span>
            </p>
            <p className="text-xs text-[#86909C] mt-0.5">
              {asset.time}
              {asset.size && <span className="ml-2">· {asset.size}</span>}
            </p>
          </div>
        </div>

        {/* 来源任务 */}
        <div className="bg-[#121418] rounded-lg p-4">
          <p className="text-xs text-[#86909C] mb-2">来源任务</p>
          <p className="text-sm text-white">{asset.task}</p>
        </div>

        {/* 预览内容 */}
        {asset.preview && (
          <div>
            <h4 className="text-sm font-medium text-white mb-3">文件预览</h4>
            <div className="bg-[#121418] rounded-lg p-4 max-h-60 overflow-y-auto">
              <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono">{asset.preview}</pre>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2.5 bg-[#165DFF] text-white rounded-lg hover:bg-[#165DFF]/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载文件
          </button>
          <button
            onClick={handleViewSourceTask}
            className="flex-1 px-4 py-2.5 bg-[#00B42A]/10 text-[#00B42A] rounded-lg hover:bg-[#00B42A]/20 transition-colors text-sm font-medium"
          >
            查看来源任务
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function Assets() {
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today')
  const [typeFilter, setTypeFilter] = useState<'all' | 'document' | 'data' | 'report'>('all')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // 获取今日成果
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['assets-today'],
    queryFn: () => assetApi.getToday().then(res => res.data).catch(() => null),
  })

  // 获取全部成果
  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['assets', typeFilter],
    queryFn: () => assetApi.getAll({ type: typeFilter === 'all' ? undefined : typeFilter }).then(res => res.data).catch(() => null),
  })

  // 使用 API 数据或 fallback 到 mock
  const todayAssets: Asset[] = todayData?.assets || mockAssets.filter(a => a.isNew)
  const allAssets: Asset[] = allData?.assets || mockAssets.filter(a => !a.isNew)

  // 根据筛选过滤历史成果
  const filteredHistory = useMemo(() => {
    if (typeFilter === 'all') return allAssets
    return allAssets.filter(a => a.type === typeFilter)
  }, [allAssets, typeFilter])

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold text-white">工作成果资产库</h1>
        <p className="text-sm text-[#86909C] mt-1">统一管理所有数字员工产出成果</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'today'
              ? 'bg-[#165DFF] text-white'
              : 'bg-[#1E2128] text-[#86909C] hover:text-white border border-dark-border'
          }`}
        >
          今日最新
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'all'
              ? 'bg-[#165DFF] text-white'
              : 'bg-[#1E2128] text-[#86909C] hover:text-white border border-dark-border'
          }`}
        >
          全部成果
        </button>
      </div>

      {/* 今日最新成果 */}
      {activeTab === 'today' && (
        <div>
          {todayLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="w-6 h-6 animate-spin text-[#165DFF]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="ml-3 text-[#86909C]">加载中...</span>
            </div>
          ) : (
            <>
              {todayAssets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todayAssets.map(asset => (
                    <AssetCard key={asset.id} asset={asset} onClick={() => handleAssetClick(asset)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#1E2128] rounded-xl border border-dark-border">
                  <p className="text-[#86909C]">今日暂无新成果</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 历史成果归档 */}
      {activeTab === 'all' && (
        <div>
          {/* 分类筛选 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">历史成果归档</h2>
            <div className="flex gap-2">
              {(['all', 'document', 'data', 'report'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    typeFilter === f
                      ? 'bg-[#165DFF] text-white'
                      : 'bg-[#1E2128] text-[#86909C] hover:text-white border border-dark-border'
                  }`}
                >
                  {f === 'all' ? '全部' : typeConfig[f as keyof typeof typeConfig].label}
                </button>
              ))}
            </div>
          </div>

          {allLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="w-6 h-6 animate-spin text-[#165DFF]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="ml-3 text-[#86909C]">加载中...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map(asset => (
                  <AssetCard key={asset.id} asset={asset} onClick={() => handleAssetClick(asset)} />
                ))}
              </div>

              {filteredHistory.length === 0 && (
                <div className="text-center py-12 bg-[#1E2128] rounded-xl border border-dark-border">
                  <p className="text-[#86909C]">没有找到匹配的结果</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 成果详情弹窗 */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedAsset(null)
        }}
      />
    </div>
  )
}
