#!/usr/bin/env node
/**
 * AgentWork CLI
 */

import { Command } from 'commander';
import { AgentWork, getAgentWork } from './index.js';

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
    
    console.log(`✅ 任务已创建: ${task.id}`);
    console.log(`   标题: ${task.title}`);
    console.log(`   类型: ${task.type}`);
  });

taskCmd
  .command('list')
  .description('列出任务')
  .option('-l, --limit <number>', '数量限制', '20')
  .action(async (options) => {
    const app = await getAgentWork();
    const tasks = app.getOrchestrator().listTasks(parseInt(options.limit));
    
    if (tasks.length === 0) {
      console.log('暂无任务');
      return;
    }
    
    console.log('\n任务列表:');
    console.log('─'.repeat(80));
    for (const task of tasks) {
      const status = getStatusEmoji(task.status);
      console.log(`${status} ${task.id.slice(0, 8)} | ${task.title} | ${task.status}`);
    }
    console.log('─'.repeat(80));
  });

taskCmd
  .command('show <taskId>')
  .description('查看任务详情')
  .action(async (taskId) => {
    const app = await getAgentWork();
    const task = app.getOrchestrator().getTask(taskId);
    
    if (!task) {
      console.log(`❌ 任务不存在: ${taskId}`);
      return;
    }
    
    console.log('\n任务详情:');
    console.log('─'.repeat(50));
    console.log(`ID: ${task.id}`);
    console.log(`标题: ${task.title}`);
    console.log(`类型: ${task.type}`);
    console.log(`状态: ${task.status}`);
    console.log(`创建时间: ${task.createdAt.toLocaleString()}`);
    
    if (task.steps.length > 0) {
      console.log('\n执行步骤:');
      for (const step of task.steps) {
        const status = getStatusEmoji(step.status);
        console.log(`  ${status} ${step.orderId + 1}. ${step.title} [${step.skill}]`);
      }
    }
    console.log('─'.repeat(50));
  });

taskCmd
  .command('run <taskId>')
  .description('执行任务')
  .action(async (taskId) => {
    const app = await getAgentWork();
    const orchestrator = app.getOrchestrator();
    
    console.log(`🚀 开始执行任务: ${taskId}`);
    
    // 监听事件
    orchestrator.on('step:started', (event) => {
      console.log(`  ⏳ 步骤开始: ${event.data.title}`);
    });
    
    orchestrator.on('step:completed', (event) => {
      console.log(`  ✅ 步骤完成: ${event.data.stepId}`);
    });
    
    orchestrator.on('task:completed', () => {
      console.log(`\n🎉 任务执行完成!`);
    });
    
    try {
      await orchestrator.execute(taskId);
    } catch (error: any) {
      console.log(`\n❌ 执行失败: ${error.message}`);
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
      console.log('暂无工作流');
      return;
    }
    
    console.log('\n工作流列表:');
    console.log('─'.repeat(60));
    for (const wf of workflows) {
      console.log(`📋 ${wf.metadata.id} | ${wf.metadata.name}`);
    }
    console.log('─'.repeat(60));
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
    
    console.log(`🚀 运行工作流: ${workflowId}`);
    console.log(`   参数: ${JSON.stringify(inputs)}`);
    
    try {
      const run = await engine.run(workflowId, inputs);
      console.log(`\n✅ 工作流已启动: ${run.id}`);
    } catch (error: any) {
      console.log(`\n❌ 启动失败: ${error.message}`);
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
      console.log(`✅ 已安装工作流: ${workflow.metadata.name}`);
    } catch (error: any) {
      console.log(`❌ 安装失败: ${error.message}`);
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
      console.log('暂无技能');
      return;
    }
    
    console.log('\n技能列表:');
    console.log('─'.repeat(60));
    for (const skill of skills) {
      console.log(`🔧 ${skill.manifest.name} | ${skill.manifest.description}`);
    }
    console.log('─'.repeat(60));
  });

skillCmd
  .command('install <source>')
  .description('安装技能')
  .action(async (source) => {
    const app = await getAgentWork();
    const registry = app.getSkillsRegistry();
    
    try {
      const skill = await registry.install(source);
      console.log(`✅ 已安装技能: ${skill.manifest.name}`);
    } catch (error: any) {
      console.log(`❌ 安装失败: ${error.message}`);
    }
  });

skillCmd
  .command('search <query>')
  .description('搜索技能')
  .action(async (query) => {
    const app = await getAgentWork();
    const skills = app.getSkillsRegistry().search(query);
    
    if (skills.length === 0) {
      console.log('未找到匹配的技能');
      return;
    }
    
    console.log('\n搜索结果:');
    for (const skill of skills) {
      console.log(`  🔧 ${skill.manifest.name} - ${skill.manifest.description}`);
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

// 解析命令
program.parse();