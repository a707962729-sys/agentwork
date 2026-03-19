import { useState } from 'react'
import { useSkills } from '../hooks/useSkills'
import SkillCard from '../components/SkillCard'

export default function Skills() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [installSource, setInstallSource] = useState<'local' | 'npm' | 'clawhub'>('clawhub')
  const [skillName, setSkillName] = useState('')
  const [skillPath, setSkillPath] = useState('')
  
  const { skills, isLoading, installSkill, uninstallSkill, isInstalling } = useSkills()

  const filteredSkills = skills.filter((skill: any) =>
    !searchQuery || 
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!skillName.trim()) return
    
    try {
      await installSkill({
        name: skillName,
        source: installSource,
        path: installSource === 'local' ? skillPath : undefined,
      })
      setSkillName('')
      setSkillPath('')
      setShowInstallDialog(false)
    } catch (error) {
      console.error('Failed to install skill:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">技能管理</h1>
          <p className="text-sm text-muted-foreground">安装、管理和查看技能</p>
        </div>
        <button
          onClick={() => setShowInstallDialog(true)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          安装技能
        </button>
      </div>

      {/* 搜索 */}
      <div className="max-w-md">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索技能..."
            className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <svg 
            className="absolute right-3 top-2.5 w-5 h-5 text-muted-foreground"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* 技能列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 bg-dark-card rounded-lg border border-dark-border animate-pulse">
              <div className="h-4 bg-dark-bg rounded w-3/4 mb-3" />
              <div className="h-3 bg-dark-bg rounded w-full mb-2" />
              <div className="h-3 bg-dark-bg rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill: any) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onUninstall={() => uninstallSkill(skill.name)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">暂无技能</h3>
          <p className="text-muted-foreground mb-4">安装你的第一个技能</p>
          <button
            onClick={() => setShowInstallDialog(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            安装技能
          </button>
        </div>
      )}

      {/* 安装技能对话框 */}
      {showInstallDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-lg border border-dark-border w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">安装技能</h2>
              <button
                onClick={() => setShowInstallDialog(false)}
                className="p-1 hover:bg-dark-bg rounded"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleInstall} className="space-y-4">
              {/* 来源选择 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  安装来源
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInstallSource('clawhub')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      installSource === 'clawhub'
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-bg text-muted-foreground hover:bg-dark-border'
                    }`}
                  >
                    ClawHub
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallSource('npm')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      installSource === 'npm'
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-bg text-muted-foreground hover:bg-dark-border'
                    }`}
                  >
                    NPM
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstallSource('local')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      installSource === 'local'
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-bg text-muted-foreground hover:bg-dark-border'
                    }`}
                  >
                    本地
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  技能名称 *
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder={installSource === 'npm' ? '@scope/package-name' : 'skill-name'}
                  className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {installSource === 'local' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    本地路径 *
                  </label>
                  <input
                    type="text"
                    value={skillPath}
                    onChange={(e) => setSkillPath(e.target.value)}
                    placeholder="~/path/to/skill"
                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInstallDialog(false)}
                  className="flex-1 px-4 py-2 bg-dark-bg text-foreground rounded-lg hover:bg-dark-border transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isInstalling || !skillName.trim()}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {isInstalling ? '安装中...' : '安装'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
