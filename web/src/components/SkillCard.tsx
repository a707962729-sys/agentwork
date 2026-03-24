import StatusBadge from './StatusBadge'

interface Skill {
  id: string
  name: string
  description: string
  version: string
  installed: boolean
  location?: string
}

interface SkillCardProps {
  skill: Skill
  onInstall?: () => void
  onUninstall?: () => void
  onViewDetails?: () => void
}

export default function SkillCard({ skill, onInstall, onUninstall, onViewDetails }: SkillCardProps) {
  return (
    <div className="group relative p-5 bg-dark-card/80 backdrop-blur-xl rounded-2xl border border-dark-border hover:border-cyan-500/40 transition-all duration-300 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base text-foreground group-hover:text-cyan-400 transition-colors">
              {skill.name}
            </h3>
            <span className="text-xs text-slate-500 px-2 py-0.5 bg-dark-bg/80 rounded-lg border border-dark-border">
              v{skill.version}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {skill.description}
          </p>
        </div>
        <StatusBadge status={skill.installed ? 'active' : 'inactive'} size="sm" />
      </div>

      {skill.location && (
        <div className="mb-3">
          <code className="text-xs text-slate-500 bg-dark-bg/80 px-2 py-1 rounded-lg border border-dark-border block truncate">
            {skill.location}
          </code>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-dark-border/50">
        {skill.installed ? (
          <>
            <button
              onClick={onViewDetails}
              className="flex-1 px-3 py-2 text-sm bg-cyan-500/15 text-cyan-400 rounded-xl hover:bg-cyan-500/25 border border-cyan-500/30 transition-colors font-medium"
            >
              查看详情
            </button>
            <button
              onClick={onUninstall}
              className="px-3 py-2 text-sm bg-rose-500/15 text-rose-400 rounded-xl hover:bg-rose-500/25 border border-rose-500/30 transition-colors font-medium"
            >
              卸载
            </button>
          </>
        ) : (
          <button
            onClick={onInstall}
            className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-cyan-500/25 font-medium"
          >
            安装
          </button>
        )}
      </div>
    </div>
  )
}
