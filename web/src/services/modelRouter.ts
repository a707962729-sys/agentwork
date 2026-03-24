/**
 * Model Router Service
 * 根据任务/Agent类型选择最合适的模型
 */

export interface ModelConfig {
  id: string
  name: string
  modelId: string
  type: 'openai' | 'anthropic' | 'openai-compatible'
  baseUrl?: string
  apiKey?: string
  isDefault: boolean
  supports: string[]
}

export interface RoutingRule {
  id: string
  name: string
  agentType: string
  taskType: string
  keywords: string[]
  modelId: string
  enabled: boolean
  priority: number
}

let cachedModels: ModelConfig[] = []
let cachedRules: RoutingRule[] = []

export async function loadModelConfig(): Promise<{ models: ModelConfig[]; rules: RoutingRule[] }> {
  try {
    const [modelsRes, rulesRes] = await Promise.all([
      fetch('/api/v1/models'),
      fetch('/api/v1/models/routing'),
    ])
    const modelsData = await modelsRes.json()
    const rulesData = await rulesRes.json()
    cachedModels = modelsData.models || []
    cachedRules = rulesData.rules || []
    return { models: cachedModels, rules: cachedRules }
  } catch {
    return { models: cachedModels, rules: cachedRules }
  }
}

export function selectModel(
  agentType: string,
  taskType: string,
  models: ModelConfig[],
  rules: RoutingRule[]
): ModelConfig | null {
  // 1. 遍历路由规则，匹配第一个
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority)
  for (const rule of sortedRules) {
    if (!rule.enabled) continue

    const agentMatch = !rule.agentType || rule.agentType === agentType || agentType.includes(rule.agentType)
    const taskMatch = !rule.taskType || rule.taskType === taskType || taskType.includes(rule.taskType)

    if (agentMatch && taskMatch) {
      const model = models.find(m => m.id === rule.modelId)
      if (model) return model
    }
  }

  // 2. 无匹配 → 返回默认模型
  const defaultModel = models.find(m => m.isDefault)
  if (defaultModel) return defaultModel

  // 3. 默认模型不可用 → 返回第一个可用模型
  if (models.length > 0) return models[0]

  return null
}

/**
 * 根据任务描述中的关键词匹配路由规则
 */
export function selectModelByContent(
  content: string,
  models: ModelConfig[],
  rules: RoutingRule[]
): ModelConfig | null {
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority)
  for (const rule of sortedRules) {
    if (!rule.enabled) continue
    if (rule.keywords.length === 0) continue

    const keywordMatch = rule.keywords.some(
      kw => content.includes(kw) || content.toLowerCase().includes(kw.toLowerCase())
    )
    if (keywordMatch) {
      const model = models.find(m => m.id === rule.modelId)
      if (model) return model
    }
  }

  // Fallback to default
  const defaultModel = models.find(m => m.isDefault)
  if (defaultModel) return defaultModel
  if (models.length > 0) return models[0]
  return null
}
