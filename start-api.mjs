#!/usr/bin/env node
import { createServer } from './dist/api/server.js';

const server = createServer(3000);
server.start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.stop().then(() => process.exit(0));
});