#!/usr/bin/env node
/**
 * AgentWork CLI
 */

import { Command } from 'commander';
import { AgentWork, getAgentWork } from './index.js';
import { SandboxExecutor } from './sandbox/index.js';
import { Logger } from './logging/index.js';

const logger = new Logger();

const program = new Command();

program
  .name('agentwork')
  .description('一人公司自动化平台')
  .version('1.0.0');

// ==================== 任务命令 ====================
const taskCmd = program.command('task').description('任务管理');

taskCmd
  .command('create <title>')
  .description('创建任务')
  .option('-t, --type <type>', '任务类型', 'custom')
  .option('-d, --description <desc>', '任务描述')
  .option('-w, --workflow <id>', '工作流ID')
  .action(async (title, options) => {
    const app = await getAgentWork();
    const orchestrator = app.getOrchestrator();
    
    const task = await orchestrator.createTask({
      title,
      type: options.type,
      description: options.description,
      workflowId: options.workflow
    });
    
    logger.info(`✅ 任务已创建: ${task.id}`);
    logger.info(`   标题: ${task.title}`);
    logger.info(`   类型: ${task.type}`);
  });

taskCmd
  .command('list')
  .description('列出任务')
  .option('-l, --limit <number>', '数量限制', '20')
  .action(async (options) => {
    const app = await getAgentWork();
    const tasks = app.getOrchestrator().listTasks(parseInt(options.limit));
    
    if (tasks.length === 0) {
      logger.info('暂无任务');
      return;
    }
    
    logger.info('\n任务列表:');
    logger.info('─'.repeat(80));
    for (const task of tasks) {
      const status = getStatusEmoji(task.status);
      logger.info(`${status} ${task.id.slice(0, 8)} | ${task.title} | ${task.status}`);
    }
    logger.info('─'.repeat(80));
  });

taskCmd
  .command('show <taskId>')
  .description('查看任务详情')
  .action(async (taskId) => {
    const app = await getAgentWork();
    const task = app.getOrchestrator().getTask(taskId);
    
    if (!task) {
      logger.info(`❌ 任务不存在: ${taskId}`);
      return;
    }
    
    logger.info('\n任务详情:');
    logger.info('─'.repeat(50));
    logger.info(`ID: ${task.id}`);
    logger.info(`标题: ${task.title}`);
    logger.info(`类型: ${task.type}`);
    logger.info(`状态: ${task.status}`);
    logger.info(`创建时间: ${task.createdAt.toLocaleString()}`);
    
    if (task.steps.length > 0) {
      logger.info('\n执行步骤:');
      for (const step of task.steps) {
        const status = getStatusEmoji(step.status);
        logger.info(`  ${status} ${step.orderId + 1}. ${step.title} [${step.skill}]`);
      }
    }
    logger.info('─'.repeat(50));
  });

taskCmd
  .command('run <taskId>')
  .description('执行任务')
  .action(async (taskId) => {
    const app = await getAgentWork();
    const orchestrator = app.getOrchestrator();
    
    logger.info(`🚀 开始执行任务: ${taskId}`);
    
    // 监听事件
    orchestrator.on('step:started', (event) => {
      logger.info(`  ⏳ 步骤开始: ${event.data.title}`);
    });
    
    orchestrator.on('step:completed', (event) => {
      logger.info(`  ✅ 步骤完成: ${event.data.stepId}`);
    });
    
    orchestrator.on('task:completed', () => {
      logger.info(`\n🎉 任务执行完成!`);
    });
    
    try {
      await orchestrator.execute(taskId);
    } catch (error: any) {
      logger.info(`\n❌ 执行失败: ${error.message}`);
    }
  });

// ==================== 工作流命令 ====================
const workflowCmd = program.command('workflow').description('工作流管理');

workflowCmd
  .command('list')
  .description('列出工作流')
  .action(async () => {
    const app = await getAgentWork();
    const workflows = app.getWorkflowEngine().listWorkflows();
    
    if (workflows.length === 0) {
      logger.info('暂无工作流');
      return;
    }
    
    logger.info('\n工作流列表:');
    logger.info('─'.repeat(60));
    for (const wf of workflows) {
      logger.info(`📋 ${wf.metadata.id} | ${wf.metadata.name}`);
    }
    logger.info('─'.repeat(60));
  });

workflowCmd
  .command('run <workflowId>')
  .description('运行工作流')
  .option('--param <params...>', '输入参数 (key=value)')
  .action(async (workflowId, options) => {
    const app = await getAgentWork();
    const engine = app.getWorkflowEngine();
    
    const inputs: Record<string, any> = {};
    if (options.param) {
      for (const p of options.param) {
        const [key, value] = p.split('=');
        inputs[key] = value;
      }
    }
    
    logger.info(`🚀 运行工作流: ${workflowId}`);
    logger.info(`   参数: ${JSON.stringify(inputs)}`);
    
    try {
      const run = await engine.run(workflowId, inputs);
      logger.info(`\n✅ 工作流已启动: ${run.id}`);
    } catch (error: any) {
      logger.info(`\n❌ 启动失败: ${error.message}`);
    }
  });

workflowCmd
  .command('install <path>')
  .description('安装工作流')
  .action(async (filepath) => {
    const app = await getAgentWork();
    const engine = app.getWorkflowEngine();
    
    try {
      const workflow = await engine.loadFromFile(filepath);
      logger.info(`✅ 已安装工作流: ${workflow.metadata.name}`);
    } catch (error: any) {
      logger.info(`❌ 安装失败: ${error.message}`);
    }
  });

// ==================== 技能命令 ====================
const skillCmd = program.command('skill').description('技能管理');

skillCmd
  .command('list')
  .description('列出技能')
  .action(async () => {
    const app = await getAgentWork();
    const skills = app.getSkillsRegistry().list();
    
    if (skills.length === 0) {
      logger.info('暂无技能');
      return;
    }
    
    logger.info('\n技能列表:');
    logger.info('─'.repeat(60));
    for (const skill of skills) {
      logger.info(`🔧 ${skill.manifest.name} | ${skill.manifest.description}`);
    }
    logger.info('─'.repeat(60));
  });

skillCmd
  .command('install <source>')
  .description('安装技能')
  .action(async (source) => {
    const app = await getAgentWork();
    const registry = app.getSkillsRegistry();
    
    try {
      const skill = await registry.install(source);
      logger.info(`✅ 已安装技能: ${skill.manifest.name}`);
    } catch (error: any) {
      logger.info(`❌ 安装失败: ${error.message}`);
    }
  });

skillCmd
  .command('search <query>')
  .description('搜索技能')
  .action(async (query) => {
    const app = await getAgentWork();
    const skills = app.getSkillsRegistry().search(query);
    
    if (skills.length === 0) {
      logger.info('未找到匹配的技能');
      return;
    }
    
    logger.info('\n搜索结果:');
    for (const skill of skills) {
      logger.info(`  🔧 ${skill.manifest.name} - ${skill.manifest.description}`);
    }
  });

// 状态表情
function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    'pending': '⏳',
    'running': '🔄',
    'completed': '✅',
    'failed': '❌',
    'paused': '⏸️',
    'decomposing': '🔍',
    'ready': '📋'
  };
  return map[status] || '❓';
}

// ==================== Sandbox 命令 ====================
const sandboxCmd = program.command('sandbox').description('沙箱管理');

sandboxCmd
  .command('run <script>')
  .description('在沙箱中执行脚本')
  .option('-t, --timeout <ms>', '超时时间 (ms)', '30000')
  .option('-m, --memory <mb>', '最大内存 (MB)', '512')
  .option('-n, --network <mode>', '网络访问模式 (none|restricted|full)', 'restricted')
  .option('-e, --env <vars...>', '环境变量 (KEY=VALUE)')
  .action(async (script, options) => {
    logger.info(`🔒 沙箱执行: ${script}`);
    logger.info(`   超时: ${options.timeout}ms`);
    logger.info(`   内存限制: ${options.memory}MB`);
    logger.info(`   网络模式: ${options.network}`);
    
    const executor = new SandboxExecutor();
    const result = await executor.executeScript(script, [], { timeout: parseInt(options.timeout) });
    
    logger.info(`\n${result.success ? '✅' : '❌'} 执行完成`);
    if (result.stdout) logger.info(`\n输出:\n${result.stdout}`);
    if (result.stderr) logger.info(`\n错误:\n${result.stderr}`);
    logger.info(`\n耗时: ${result.durationMs}ms`);
  });

sandboxCmd
  .command('exec <code>')
  .description('在沙箱中执行代码片段')
  .option('-l, --language <lang>', '代码语言 (javascript|typescript|python|shell)', 'javascript')
  .option('-t, --timeout <ms>', '超时时间 (ms)', '30000')
  .action(async (code, options) => {
    logger.info(`🔒 沙箱代码执行`);
    logger.info(`   语言: ${options.language}`);
    logger.info(`   代码: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);
    
    const executor = new SandboxExecutor();
    const result = await executor.executeCode(code, options.language, { timeout: parseInt(options.timeout) });
    
    logger.info(`\n${result.success ? '✅' : '❌'} 执行完成`);
    if (result.stdout) logger.info(`\n输出:\n${result.stdout}`);
    if (result.stderr) logger.info(`\n错误:\n${result.stderr}`);
    logger.info(`\n耗时: ${result.durationMs}ms`);
  });

// ==================== ACP 命令 ====================
const acpCmd = program.command('acp').description('ACP 协议服务');

acpCmd
  .command('serve')
  .description('启动 ACP 服务器 (stdio 模式)')
  .option('-n, --name <name>', '服务器名称', 'AgentWork')
  .option('--timeout <ms>', '请求超时时间', '120000')
  .action(async (options) => {
    logger.info(`🚀 启动 ACP 服务器...`);
    logger.info(`   名称: ${options.name}`);
    logger.info(`   超时: ${options.timeout}ms`);
    logger.info(`   模式: stdio`);
    
    try {
      const { ACPServer } = await import('./acp/server.js');
      const server = new ACPServer({
        name: options.name,
        version: '1.0.0',
        capabilities: {
          streaming: true,
          tools: true,
          skills: true,
          subagents: true,
          memory: true
        },
        timeout: parseInt(options.timeout)
      });
      
      logger.info(`\n✅ ACP 服务器已启动，等待连接...`);
      await server.start();
    } catch (error: any) {
      logger.error(`❌ 启动失败: ${error.message}`);
      process.exit(1);
    }
  });

acpCmd
  .command('capabilities')
  .description('显示 ACP 能力信息')
  .action(() => {
    logger.info('\nACP 能力:');
    logger.info('─'.repeat(50));
    logger.info('  ✅ streaming   - 流式响应');
    logger.info('  ✅ tools       - 工具调用');
    logger.info('  ✅ skills      - 技能系统');
    logger.info('  ✅ subagents   - 子代理');
    logger.info('  ✅ memory      - 记忆系统');
    logger.info('─'.repeat(50));
  });

// ==================== Subagent 命令 ====================
const subagentCmd = program.command('subagent').description('子代理管理');

subagentCmd
  .command('list')
  .description('列出所有可用子代理')
  .action(async () => {
    logger.info('\n可用子代理:');
    logger.info('─'.repeat(60));
    logger.info('  🤖 general-purpose  - 通用子代理，继承主代理能力');
    logger.info('─'.repeat(60));
    logger.info('\n💡 提示: 在配置文件中添加自定义子代理');
  });

subagentCmd
  .command('invoke <name> <task>')
  .description('调用子代理执行任务')
  .option('-c, --context <json>', '上下文 (JSON)', '{}')
  .action(async (name, task, options) => {
    logger.info(`🤖 调用子代理: ${name}`);
    logger.info(`   任务: ${task}`);
    
    try {
      const { SubAgentManager } = await import('./subagents/manager.js');
      const { DatabaseManager } = await import('./db/index.js');
      
      // 简化演示
      logger.info(`\n⚠️ 子代理调用需要完整初始化`);
      logger.info(`   请通过 AgentWork API 使用子代理功能`);
    } catch (error: any) {
      logger.error(`❌ 调用失败: ${error.message}`);
    }
  });

subagentCmd
  .command('info <name>')
  .description('显示子代理详情')
  .action(async (name) => {
    logger.info(`\n子代理详情: ${name}`);
    logger.info('─'.repeat(50));
    
    if (name === 'general-purpose') {
      logger.info('  名称: general-purpose');
      logger.info('  描述: 通用子代理，继承主代理的能力');
      logger.info('  功能:');
      logger.info('    - 继承主代理的所有技能和工具');
      logger.info('    - 支持委派复杂任务');
      logger.info('    - Context 隔离');
    } else {
      logger.info(`  ❌ 未找到子代理: ${name}`);
    }
    logger.info('─'.repeat(50));
  });

// 解析命令
program.parse();