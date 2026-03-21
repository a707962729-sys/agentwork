#!/usr/bin/env bun
/**
 * Boss直聘简历搜索 CLI 入口
 * 
 * 使用方法:
 *   bun run main.ts "前端工程师" --city "北京" --experience "3-5年"
 * 
 * 参数:
 *   keywords           搜索关键词 (必需)
 *   --city, -c         城市名称
 *   --experience, -e   工作经验
 *   --education, -edu  学历要求
 *   --salary, -s       薪资范围
 *   --output-dir, -o   导出目录
 *   --format, -f       导出格式 (markdown/json/csv)
 *   --limit, -l        最大导出数量
 *   --export-all       导出当前页全部结果
 *   --headless         无头模式（不推荐）
 */

import { searchResumes } from './search';
import { CLIArgs, ExportFormat } from './lib/types';

// 显示欢迎信息
function showWelcome(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║            Boss直聘简历搜索工具 v1.0.0                        ║
╠══════════════════════════════════════════════════════════════╣
║  使用真实 Chrome 浏览器，支持多条件筛选和批量导出             ║
║  ⚠️  请确保您持有有效的 Boss直聘企业账号                      ║
╚══════════════════════════════════════════════════════════════╝
`);
}

// 显示警告
function showWarning(): boolean {
  console.log(`
⚠️  重要提示

本技能仅供辅助搜索和整理简历信息，请遵守以下规则:

1. 您需要持有有效的 Boss直聘企业账号
2. 请勿用于大规模批量采集
3. 请勿绕过平台付费功能
4. 打招呼和联系候选人请人工确认
5. 使用本技能的一切后果由您自行承担

继续使用即表示您已阅读并同意以上条款。
`);

  // 在非交互模式下直接返回 true
  // 实际使用时可以添加用户确认逻辑
  return true;
}

// 显示帮助
function showHelp(): void {
  console.log(`
使用方法:
  bun run main.ts "关键词" [选项]

示例:
  # 基础搜索
  bun run main.ts "前端工程师"

  # 带筛选条件
  bun run main.ts "前端工程师" --city "北京" --experience "3-5年" --education "本科"

  # 导出到指定目录
  bun run main.ts "产品经理" --output-dir ./resumes/pm/

选项:
  --city, -c <city>         城市 (北京/上海/广州/深圳/杭州等)
  --experience, -e <exp>    工作经验 (应届生/1-3年/3-5年/5-10年/10年以上)
  --education, -edu <edu>   学历要求 (大专/本科/硕士/博士)
  --salary, -s <salary>    薪资范围 (如 20k-40k)
  --output-dir, -o <dir>    导出目录 (默认: ./resumes/)
  --format, -f <format>     导出格式 (markdown/json/csv, 默认: markdown)
  --limit, -l <num>         最大导出数量 (默认: 20)
  --export-all              导出当前页全部结果
  --headless                无头模式运行（不推荐，可能导致登录失败）
  --help, -h                显示帮助信息

支持的城市:
  北京 上海 广州 深圳 杭州 成都 南京 武汉 西安 重庆
  苏州 天津 郑州 长沙 厦门

注意:
  - 首次使用需要在浏览器中登录 Boss直聘
  - 建议使用非 headless 模式运行，便于人工干预
  - 搜索过程中遇到验证码需要手动处理
`);
}

// 解析命令行参数
function parseArgs(args: string[]): CLIArgs {
  const result: CLIArgs = {
    keywords: '',
    city: undefined,
    experience: undefined,
    education: undefined,
    salary: undefined,
    outputDir: undefined,
    format: 'markdown',
    limit: 20,
    headless: false,
    exportAll: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
    
    if (arg === '--city' || arg === '-c') {
      result.city = args[++i];
    } else if (arg === '--experience' || arg === '-e') {
      result.experience = args[++i];
    } else if (arg === '--education' || arg === '-edu') {
      result.education = args[++i];
    } else if (arg === '--salary' || arg === '-s') {
      result.salary = args[++i];
    } else if (arg === '--output-dir' || arg === '-o') {
      result.outputDir = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      result.format = args[++i] as ExportFormat;
    } else if (arg === '--limit' || arg === '-l') {
      result.limit = parseInt(args[++i], 10);
    } else if (arg === '--headless') {
      result.headless = true;
    } else if (arg === '--export-all') {
      result.exportAll = true;
    } else if (!arg.startsWith('-') && !result.keywords) {
      result.keywords = arg;
    }
  }

  return result;
}

// 主函数
async function main(): Promise<void> {
  showWelcome();

  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const cliArgs = parseArgs(args);

  if (!cliArgs.keywords) {
    console.error('❌ 请提供搜索关键词');
    console.log('示例: bun run main.ts "前端工程师"');
    process.exit(1);
  }

  showWarning();

  // 构建搜索选项
  const options = {
    keywords: cliArgs.keywords,
    city: cliArgs.city,
    experience: cliArgs.experience,
    education: cliArgs.education,
    salary: cliArgs.salary,
    limit: cliArgs.limit,
    outputDir: cliArgs.outputDir || './resumes',
    headless: cliArgs.headless,
  };

  console.log('\n📋 搜索参数:');
  console.log(`   关键词: ${options.keywords}`);
  if (options.city) console.log(`   城市: ${options.city}`);
  if (options.experience) console.log(`   经验: ${options.experience}`);
  if (options.education) console.log(`   学历: ${options.education}`);
  if (options.salary) console.log(`   薪资: ${options.salary}`);
  console.log(`   最大数量: ${options.limit}`);
  console.log(`   导出目录: ${options.outputDir}`);
  console.log('');

  try {
    const result = await searchResumes(options);

    if (result.success) {
      console.log('\n✅ 搜索完成!');
      console.log(`   共导出: ${result.exported} 份简历`);
      console.log(`   输出目录: ${result.outputDir}`);
    } else if (result.needLogin) {
      console.log('\n⚠️ 需要登录');
      console.log('   请在浏览器中手动登录 Boss直聘后重试');
      if (result.screenshot) {
        console.log(`   截图已保存: ${result.screenshot}`);
      }
    } else {
      console.log('\n❌ 搜索失败');
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
      if (result.screenshot) {
        console.log(`   截图已保存: ${result.screenshot}`);
      }
    }
  } catch (error: any) {
    console.error('\n❌ 发生错误:', error.message);
    process.exit(1);
  }
}

// 运行
main();