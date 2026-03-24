/**
 * 内置工具：web_search
 * 调用网页搜索（使用 Tavily/SerpAPI 兼容接口，或通用 fetch）
 */

import { ToolDefinition, ToolContext, ToolResult } from '../types.js';

interface WebSearchParams {
  query: string;
  count?: number; // 结果数量，默认 5
}

// 简单内置搜索（使用 DuckDuckGo HTML）
// 如有 SERPAPI_KEY / TAVILY_API_KEY 环境变量则优先使用
async function duckduckgoSearch(query: string, count: number): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=wt-wt`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AgentBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed: ${response.status}`);
  }

  const html = await response.text();

  // 简单解析：提取 <a class="result__a"> 链接
  const results: string[] = [];
  const linkMatches = html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)/g);

  let i = 0;
  for (const match of linkMatches) {
    if (i >= count) break;
    results.push(`${match[2].trim()} → ${match[1]}`);
    i++;
  }

  return results.length > 0
    ? results.map((r, idx) => `${idx + 1}. ${r}`).join('\n')
    : '(未找到结果)';
}

export const webSearchTool: ToolDefinition = {
  id: 'executor_web_search',
  name: 'web_search',
  description: '执行网页搜索，返回标题和链接列表。',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词',
      },
      count: {
        type: 'number',
        description: '返回结果数量，默认 5',
      },
    },
    required: ['query'],
  },
  enabled: true,
  async handler(params: WebSearchParams, _context: ToolContext): Promise<ToolResult> {
    try {
      const { query, count = 5 } = params;

      const results = await duckduckgoSearch(query, Math.min(count, 10));

      return {
        success: true,
        output: results,
        metadata: { query, count },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
