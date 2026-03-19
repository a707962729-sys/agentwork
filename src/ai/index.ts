/**
 * AI 调用适配层 - 统一入口
 * 
 * 提供统一的 AI 调用接口，支持多种 AI 提供商
 */

import { AIProvider } from './provider';
import { OpenAIProvider, type OpenAIConfig } from './providers/openai';
import { AnthropicProvider, type AnthropicConfig } from './providers/anthropic';
import { QwenProvider, type QwenConfig } from './providers/qwen';
import { OllamaProvider, type OllamaConfig } from './providers/ollama';
import { MemoryManager, type MemoryStore, InMemoryStore } from './memory';
import { predefinedTools, createTool, toolFromFunction } from './tools';
import type { Message, ChatOptions, Tool, ToolCall, ProviderConfig } from './types';

/**
 * Provider 注册表
 */
const providerRegistry: Map<string, AIProvider> = new Map();

/**
 * 默认配置
 */
const defaultConfigs: Record<string, any> = {};

/**
 * 获取 AI Provider
 * @param name Provider 名称
 * @param config 可选配置
 * @returns AI Provider 实例
 */
export function getProvider(name: string, config?: any): AIProvider {
  // 如果已注册，返回缓存的实例
  if (providerRegistry.has(name)) {
    return providerRegistry.get(name)!;
  }

  // 创建新的 Provider 实例
  let provider: AIProvider;

  switch (name.toLowerCase()) {
    case 'openai':
      provider = new OpenAIProvider(config || defaultConfigs.openai);
      break;
    case 'anthropic':
    case 'claude':
      provider = new AnthropicProvider(config || defaultConfigs.anthropic);
      break;
    case 'qwen':
    case 'dashscope':
      provider = new QwenProvider(config || defaultConfigs.qwen);
      break;
    case 'ollama':
      provider = new OllamaProvider(config || defaultConfigs.ollama);
      break;
    default:
      throw new Error(`Unknown provider: ${name}. Supported: openai, anthropic, qwen, ollama`);
  }

  // 缓存实例
  providerRegistry.set(name, provider);
  return provider;
}

/**
 * 注册自定义 Provider
 * @param name Provider 名称
 * @param provider Provider 实例
 */
export function registerProvider(name: string, provider: AIProvider): void {
  providerRegistry.set(name, provider);
}

/**
 * 设置默认配置
 * @param name Provider 名称
 * @param config 配置对象
 */
export function setDefaultConfig(name: string, config: any): void {
  defaultConfigs[name] = config;
}

/**
 * 统一对话接口
 * @param provider Provider 名称或实例
 * @param messages 消息历史
 * @param options 对话选项
 * @returns AI 回复内容
 */
export async function chat(
  provider: string | AIProvider,
  messages: Message[],
  options?: ChatOptions
): Promise<string> {
  const prov = typeof provider === 'string' ? getProvider(provider) : provider;
  return prov.chat(messages, options);
}

/**
 * 带工具调用的对话接口
 * @param provider Provider 名称或实例
 * @param messages 消息历史
 * @param tools 可用工具列表
 * @param options 对话选项
 * @returns 工具调用信息
 */
export async function chatWithTools(
  provider: string | AIProvider,
  messages: Message[],
  tools: Tool[],
  options?: ChatOptions
): Promise<ToolCall> {
  const prov = typeof provider === 'string' ? getProvider(provider) : provider;
  return prov.chatWithTools(messages, tools, options);
}

/**
 * 获取嵌入向量
 * @param provider Provider 名称或实例
 * @param text 输入文本
 * @returns 嵌入向量
 */
export async function embed(
  provider: string | AIProvider,
  text: string
): Promise<number[]> {
  const prov = typeof provider === 'string' ? getProvider(provider) : provider;
  return prov.embed(text);
}

/**
 * 快速对话 (使用默认 Provider)
 */
export async function quickChat(
  messages: Message[],
  options?: ChatOptions
): Promise<string> {
  const provider = getProvider('openai');
  return provider.chat(messages, options);
}

/**
 * 流式对话
 * @param provider Provider 名称或实例
 * @param messages 消息历史
 * @param options 对话选项
 * @returns 异步迭代器，逐块返回内容
 */
export async function* chatStream(
  provider: string | AIProvider,
  messages: Message[],
  options?: ChatOptions
): AsyncGenerator<string> {
  const prov = typeof provider === 'string' ? getProvider(provider) : provider;
  
  // 注意：流式实现需要各 Provider 单独支持
  // 这里提供一个基础实现，实际使用建议直接调用 Provider 的流式 API
  const content = await prov.chat(messages, { ...options, stream: true });
  
  // 简单分割返回 (实际应该使用真正的流式 API)
  const chunks = content.split(/(?=[ \n])/);
  for (const chunk of chunks) {
    yield chunk;
  }
}

/**
 * 批量嵌入
 * @param provider Provider 名称或实例
 * @param texts 文本数组
 * @returns 嵌入向量数组
 */
export async function embedBatch(
  provider: string | AIProvider,
  texts: string[]
): Promise<number[][]> {
  const prov = typeof provider === 'string' ? getProvider(provider) : provider;
  return Promise.all(texts.map(text => prov.embed(text)));
}

/**
 * 导出类型
 */
export type {
  Message,
  ChatOptions,
  Tool,
  ToolCall,
  ProviderConfig,
  MemoryStore,
  OpenAIConfig,
  AnthropicConfig,
  QwenConfig,
  OllamaConfig,
};

/**
 * 导出其他模块
 */
export {
  AIProvider,
  MemoryManager,
  InMemoryStore,
  predefinedTools,
  createTool,
  toolFromFunction,
};

/**
 * 默认导出
 */
export default {
  getProvider,
  registerProvider,
  setDefaultConfig,
  chat,
  chatWithTools,
  embed,
  quickChat,
  chatStream,
  embedBatch,
  predefinedTools,
  createTool,
  MemoryManager,
};
