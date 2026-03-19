/**
 * AI Provider 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';
import { QwenProvider } from '../providers/qwen';
import { OllamaProvider } from '../providers/ollama';
import { MemoryManager, InMemoryStore } from '../memory';
import { createTool, predefinedTools, toolFromFunction } from '../tools';
import type { Message, Tool } from '../types';

// Mock fetch
global.fetch = vi.fn();

describe('AI Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OpenAIProvider', () => {
    it('should create provider with config', () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
        model: 'gpt-4o',
      });
      
      expect(provider.getName()).toBe('openai');
    });

    it('should read API key from environment', () => {
      process.env.OPENAI_API_KEY = 'env-key';
      const provider = new OpenAIProvider();
      expect(provider.getName()).toBe('openai');
      delete process.env.OPENAI_API_KEY;
    });

    it('should throw error without API key', () => {
      expect(() => new OpenAIProvider()).toThrow('OPENAI_API_KEY');
    });

    it('should chat successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: { content: 'Hello!' }
          }]
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      
      const result = await provider.chat(messages);
      
      expect(result).toBe('Hello!');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle chat with tools', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              tool_calls: [{
                id: 'call-1',
                function: {
                  name: 'search',
                  arguments: '{"query":"test"}'
                }
              }]
            }
          }]
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const messages: Message[] = [{ role: 'user', content: 'Search for test' }];
      const tools: Tool[] = [predefinedTools.search];
      
      const result = await provider.chatWithTools(messages, tools);
      
      expect(result.name).toBe('search');
      expect(result.arguments).toEqual({ query: 'test' });
    });

    it('should get embeddings', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const provider = new OpenAIProvider({ apiKey: 'test-key' });
      const result = await provider.embed('test text');
      
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('AnthropicProvider', () => {
    it('should create provider with config', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-sonnet-4-20250514',
      });
      
      expect(provider.getName()).toBe('anthropic');
    });

    it('should read API key from environment', () => {
      process.env.ANTHROPIC_API_KEY = 'env-key';
      const provider = new AnthropicProvider();
      expect(provider.getName()).toBe('anthropic');
      delete process.env.ANTHROPIC_API_KEY;
    });

    it('should chat successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Hello from Claude!' }]
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const provider = new AnthropicProvider({ apiKey: 'test-key' });
      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      
      const result = await provider.chat(messages);
      
      expect(result).toBe('Hello from Claude!');
    });

    it('should handle chat with tools', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          content: [
            { type: 'text', text: 'Let me search...' },
            {
              type: 'tool_use',
              id: 'tool-1',
              name: 'search',
              input: { query: 'test' }
            }
          ]
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const provider = new AnthropicProvider({ apiKey: 'test-key' });
      const messages: Message[] = [{ role: 'user', content: 'Search for test' }];
      const tools: Tool[] = [predefinedTools.search];
      
      const result = await provider.chatWithTools(messages, tools);
      
      expect(result.name).toBe('search');
      expect(result.arguments).toEqual({ query: 'test' });
    });

    it('should throw error for embed (not supported)', async () => {
      const provider = new AnthropicProvider({ apiKey: 'test-key' });
      
      await expect(provider.embed('test')).rejects.toThrow('embedding');
    });
  });

  describe('QwenProvider', () => {
    it('should create provider with config', () => {
      const provider = new QwenProvider({
        apiKey: 'test-key',
        model: 'qwen-plus',
      });
      
      expect(provider.getName()).toBe('qwen');
    });

    it('should read API key from environment', () => {
      process.env.DASHSCOPE_API_KEY = 'env-key';
      const provider = new QwenProvider();
      expect(provider.getName()).toBe('qwen');
      delete process.env.DASHSCOPE_API_KEY;
    });

    it('should chat successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: { content: 'Hello from Qwen!' }
          }]
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const provider = new QwenProvider({ apiKey: 'test-key' });
      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      
      const result = await provider.chat(messages);
      
      expect(result).toBe('Hello from Qwen!');
    });
  });

  describe('OllamaProvider', () => {
    it('should create provider with default config', () => {
      const provider = new OllamaProvider();
      
      expect(provider.getName()).toBe('ollama');
    });

    it('should not require API key', () => {
      const provider = new OllamaProvider();
      expect(() => provider.validateConfig()).not.toThrow();
    });

    it('should chat successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { content: 'Hello from Ollama!' }
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const provider = new OllamaProvider();
      const messages: Message[] = [{ role: 'user', content: 'Hi' }];
      
      const result = await provider.chat(messages);
      
      expect(result).toBe('Hello from Ollama!');
    });
  });
});

describe('MemoryManager', () => {
  let manager: MemoryManager;

  beforeEach(() => {
    manager = new MemoryManager();
  });

  it('should add and retrieve messages', () => {
    const message: Message = { role: 'user', content: 'Hello' };
    manager.addMessage(message);
    
    const history = manager.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].content).toBe('Hello');
  });

  it('should limit history length', () => {
    const manager = new MemoryManager(undefined, 3);
    
    for (let i = 0; i < 5; i++) {
      manager.addMessage({ role: 'user', content: `Message ${i}` });
    }
    
    expect(manager.getHistory().length).toBe(3);
  });

  it('should save and search memories', async () => {
    await manager.saveMemory('Important note about testing', undefined, ['test']);
    await manager.saveMemory('Another memory about AI', undefined, ['ai']);
    
    const results = await manager.searchMemory('testing');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toContain('testing');
  });

  it('should search by embedding', async () => {
    await manager.saveMemory('First memory', [1, 0, 0]);
    await manager.saveMemory('Second memory', [0.9, 0.1, 0]);
    await manager.saveMemory('Third memory', [0, 1, 0]);
    
    const results = await manager.searchByEmbedding([1, 0, 0], 2);
    expect(results.length).toBe(2);
    expect(results[0].content).toBe('First memory');
  });

  it('should clear history', () => {
    manager.addMessage({ role: 'user', content: 'Hello' });
    manager.clearHistory();
    
    expect(manager.getHistory().length).toBe(0);
  });
});

describe('Tools', () => {
  it('should have predefined tools', () => {
    expect(predefinedTools.search).toBeDefined();
    expect(predefinedTools.readFile).toBeDefined();
    expect(predefinedTools.writeFile).toBeDefined();
    expect(predefinedTools.exec).toBeDefined();
    expect(predefinedTools.httpRequest).toBeDefined();
  });

  it('should create custom tool', () => {
    const tool = createTool(
      'customTool',
      'A custom tool',
      {
        type: 'object',
        properties: {
          param1: { type: 'string', description: 'First parameter' },
        },
        required: ['param1'],
      }
    );
    
    expect(tool.function.name).toBe('customTool');
    expect(tool.function.description).toBe('A custom tool');
    expect(tool.function.parameters.required).toContain('param1');
  });

  it('should create tool with handler', () => {
    const handler = vi.fn().mockResolvedValue('result');
    const tool = toolFromFunction(
      'handlerTool',
      'Tool with handler',
      {
        type: 'object',
        properties: {
          input: { type: 'string' },
        },
      },
      handler
    );
    
    expect(tool.handler).toBeDefined();
  });
});

describe('Integration', () => {
  it('should work with multiple providers', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Response' } }]
      }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const openai = new OpenAIProvider({ apiKey: 'test' });
    const qwen = new QwenProvider({ apiKey: 'test' });
    
    const result1 = await openai.chat([{ role: 'user', content: 'Hi' }]);
    const result2 = await qwen.chat([{ role: 'user', content: 'Hi' }]);
    
    expect(result1).toBe('Response');
    expect(result2).toBe('Response');
  });

  it('should manage conversation with memory', async () => {
    const manager = new MemoryManager();
    
    // Add conversation
    manager.addMessage({ role: 'user', content: 'What is testing?' });
    manager.addMessage({ role: 'assistant', content: 'Testing is important' });
    
    // Save to memory
    await manager.saveMemory('Testing is a crucial part of development');
    
    // Get context
    const context = await manager.getContextMessages('testing');
    expect(context.length).toBeGreaterThan(0);
  });
});
