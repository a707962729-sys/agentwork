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
    <div className="p-4 bg-dark-card rounded-lg border border-dark-border hover:border-primary-500/50 transition-all animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base text-foreground">
              {skill.name}
            </h3>
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-dark-bg rounded">
              v{skill.version}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {skill.description}
          </p>
        </div>
        <StatusBadge status={skill.installed ? 'active' : 'inactive'} size="sm" />
      </div>

      {skill.location && (
        <div className="mb-3">
          <code className="text-xs text-muted-foreground bg-dark-bg px-2 py-1 rounded block truncate">
            {skill.location}
          </code>
        </div>
      )}

      <div className="flex items-center gap-2">
        {skill.installed ? (
          <>
            <button
              onClick={onViewDetails}
              className="flex-1 px-3 py-1.5 text-sm bg-primary-500/20 text-primary-400 rounded hover:bg-primary-500/30 transition-colors"
            >
              查看详情
            </button>
            <button
              onClick={onUninstall}
              className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              卸载
            </button>
          </>
        ) : (
          <button
            onClick={onInstall}
            className="flex-1 px-3 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
          >
            安装
          </button>
        )}
      </div>
    </div>
  )
}
