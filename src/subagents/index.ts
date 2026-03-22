/**
 * Subagents 模块导出
 * 
 * 提供子代理管理、执行和类型定义
 */

// 类型导出
export type {
  SubAgentDefinition,
  CompiledSubAgent,
  SubAgentMiddleware,
  SubAgentContext,
  SubAgentMessage,
  ToolCallRecord,
  SubAgentResult,
  GeneralPurposeSubAgentConfig,
  SubAgentManagerConfig
} from './types.js';

// 管理器导出
export { SubAgentManager } from './manager.js';

// 执行器导出
export { 
  SubAgentExecutor,
  type ExecutorConfig,
  type ExecutionSummary
} from './executor.js';