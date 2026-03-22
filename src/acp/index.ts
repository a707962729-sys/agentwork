/**
 * ACP (Agent Client Protocol) 模块入口
 * 实现编辑器集成协议
 */

export { ACPServer, default as ACPServerDefault } from './server.js';
export {
  AgentWorkACPAdapter,
  createACPAdapter,
  default as AgentWorkACPAdapterDefault
} from './adapter.js';

export type {
  ACPMessageType,
  ACPRequest,
  ACPResponse,
  ACPError,
  ACPNotification,
  ACPSession,
  ACPMessage,
  ACPCapabilities,
  ACPServerConfig,
  ACPTool,
  ACPSkill,
  ACPSubAgent,
  ACPInitializeResult,
  ACPTaskStatus,
  ACPTask
} from './types.js';

export type { AgentWorkACPAdapterConfig } from './adapter.js';