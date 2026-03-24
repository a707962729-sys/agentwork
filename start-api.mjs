#!/usr/bin/env node
import { createServer } from './dist/api/server.js';

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // 不要退出，继续运行
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // 不要退出，继续运行
});

const server = createServer(3000);

server.start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.stop().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down (SIGTERM)...');
  server.stop().then(() => process.exit(0));
});