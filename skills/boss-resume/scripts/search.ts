/**
 * Boss直聘简历搜索逻辑
 * 使用 Chrome CDP 控制浏览器
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import {
  SearchOptions,
  ResumeCard,
  ResumeDetail,
  SearchResult,
  CITY_CODES,
  EXPERIENCE_CODES,
  EDUCATION_CODES,
  DedupIndex,
} from './lib/types';

const BOSS_RESUME_URL = 'https://www.zhipin.com/web/geek/resume';
const PROFILE_DIR = path.join(process.env.HOME || '', '.openclaw/extensions/agentwork/skills/boss-resume/profile');
const DEDUP_FILE = path.join(process.env.HOME || '', '.openclaw/extensions/agentwork/skills/boss-resume/dedup.json');

/**
 * 人类化延迟
 */
const humanDelay = (min = 1000, max = 3000): Promise<void> => {
  const delay = min + Math.random() * (max - min);
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * 模拟人类滚动
 */
const humanScroll = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100 + Math.random() * 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100 + Math.random() * 200);
    });
  });
};

/**
 * 加载去重索引
 */
const loadDedupIndex = (): DedupIndex => {
  if (fs.existsSync(DEDUP_FILE)) {
    const data = fs.readFileSync(DEDUP_FILE, 'utf8');
    return JSON.parse(data);
  }
  return { resumes: {} };
};

/**
 * 保存去重索引
 */
const saveDedupIndex = (index: DedupIndex): void => {
  fs.writeFileSync(DEDUP_FILE, JSON.stringify(index, null, 2), 'utf8');
};

/**
 * 检查是否重复
 */
const isDuplicate = (index: DedupIndex, resumeId: string): boolean => {
  return resumeId in index.resumes;
};

/**
 * 启动浏览器
 */
const launchBrowser = async (headless = false): Promise<Browser> => {
  // 确保 profile 目录存在
  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless,
    userDataDir: PROFILE_DIR,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [
      '--remote-debugging-port=9222',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
    defaultViewport: {
      width: 1280,
      height: 800,
    },
  });

  // 隐藏 webdriver 特征
  const pages = await browser.pages();
  for (const page of pages) {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      // 覆盖 plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      // 覆盖 languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en'],
      });
    });
  }

  return browser;
};

/**
 * 检查登录状态
 */
const checkLogin = async (page: Page): Promise<boolean> => {
  try {
    await page.waitForSelector('.nav-figure, .user-nav, [ka="user-nav"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

/**
 * 解析简历卡片列表
 */
const parseResumeList = async (page: Page): Promise<ResumeCard[]> => {
  return await page.evaluate(() => {
    const cards = document.querySelectorAll('.resume-card, .geek-item, [ka="resume-item"]');
    const results: any[] = [];

    cards.forEach((card: any) => {
      try {
        const nameEl = card.querySelector('.name, .geek-name');
        const positionEl = card.querySelector('.job-title, .geek-job');
        const companyEl = card.querySelector('.company, .geek-company');
        const expEl = card.querySelector('.experience, .geek-exp');
        const eduEl = card.querySelector('.education, .geek-edu');
        const salaryEl = card.querySelector('.salary, .geek-salary');
        const avatarEl = card.querySelector('img');
        const linkEl = card.querySelector('a[href*="resume"]');

        results.push({
          id: card.getAttribute('data-geek-id') || card.getAttribute('data-id') || `resume-${Date.now()}-${Math.random()}`,
          name: nameEl?.textContent?.trim() || '未知',
          position: positionEl?.textContent?.trim() || '',
          company: companyEl?.textContent?.trim() || '',
          experience: expEl?.textContent?.trim() || '',
          education: eduEl?.textContent?.trim() || '',
          salary: salaryEl?.textContent?.trim() || '',
          location: '',
          skills: [],
          avatar: avatarEl?.src || undefined,
          url: linkEl?.href || undefined,
        });
      } catch (e) {
        // 跳过解析失败的卡片
      }
    });

    return results;
  });
};

/**
 * 获取简历详情
 */
const getResumeDetail = async (page: Page, card: ResumeCard): Promise<ResumeDetail> => {
  const detail: ResumeDetail = {
    ...card,
    workExperience: [],
    projectExperience: [],
    educationHistory: [],
    capturedAt: new Date().toISOString(),
  };

  try {
    // 如果有详情链接，点击进入
    if (card.url) {
      await page.goto(card.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await humanDelay(2000, 4000);

      // 解析详情页
      const pageData = await page.evaluate(() => {
        const getText = (selector: string): string => {
          const el = document.querySelector(selector);
          return el?.textContent?.trim() || '';
        };

        const getList = (containerSelector: string, itemSelector: string): any[] => {
          const container = document.querySelector(containerSelector);
          if (!container) return [];
          const items = container.querySelectorAll(itemSelector);
          return Array.from(items).map(() => ({}));
        };

        return {
          age: getText('.age, .geek-age'),
          gender: getText('.gender, .geek-gender'),
          selfIntroduction: getText('.self-intro, .geek-intro'),
          skills: Array.from(document.querySelectorAll('.skill-tag, .tag')).map(t => t.textContent?.trim() || ''),
        };
      });

      Object.assign(detail, pageData);
    }
  } catch (e) {
    console.error('获取详情失败:', e);
  }

  return detail;
};

/**
 * 导出简历为 Markdown
 */
const exportResumeMarkdown = (resume: ResumeDetail): string => {
  const frontMatter = `---
id: "${resume.id}"
name: "${resume.name}"
captured_at: "${resume.capturedAt}"
source: "Boss直聘"
---`;

  const sections = [
    frontMatter,
    '',
    `# ${resume.name}`,
    '',
    '## 基本信息',
    `- **职位**: ${resume.position || '未知'}`,
    `- **当前公司**: ${resume.company || '未知'}`,
    `- **学历**: ${resume.education || '未知'}`,
    `- **经验**: ${resume.experience || '未知'}`,
    `- **期望薪资**: ${resume.salary || '面议'}`,
    `- **地点**: ${resume.location || '未知'}`,
    '',
  ];

  if (resume.skills.length > 0) {
    sections.push('## 技能标签', resume.skills.map(s => `- ${s}`).join('\n'), '');
  }

  if (resume.workExperience.length > 0) {
    sections.push('## 工作经历');
    resume.workExperience.forEach(w => {
      sections.push(`- **${w.company}** (${w.startDate} - ${w.endDate})`);
      sections.push(`  - ${w.position}`);
      if (w.description) {
        sections.push(`  - ${w.description}`);
      }
    });
    sections.push('');
  }

  if (resume.selfIntroduction) {
    sections.push('## 自我介绍', resume.selfIntroduction, '');
  }

  sections.push('---', `> 采集时间: ${new Date(resume.capturedAt).toLocaleString('zh-CN')}`, '> 来源: Boss直聘');

  return sections.join('\n');
};

/**
 * 主搜索函数
 */
export async function searchResumes(options: SearchOptions): Promise<SearchResult> {
  const {
    keywords,
    city = '上海',
    experience = '',
    salary = '',
    education = '',
    limit = 20,
    outputDir = './resumes',
    headless = false,
  } = options;

  console.log(`🔍 开始搜索简历: "${keywords}" @ ${city}`);

  // 确保输出目录存在
  const output = path.resolve(outputDir.replace('~', process.env.HOME || ''));
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output, { recursive: true });
  }

  // 获取城市代码
  const cityCode = CITY_CODES[city] || '101020100';

  let browser: Browser | null = null;

  try {
    // 启动浏览器
    browser = await launchBrowser(headless);
    const page = await browser.newPage();

    // 设置 User-Agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 构建搜索 URL
    const searchUrl = `${BOSS_RESUME_URL}?query=${encodeURIComponent(keywords)}&city=${cityCode}`;
    console.log(`📍 访问: ${searchUrl}`);

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await humanDelay(2000, 4000);

    // 检查登录状态
    const isLoggedIn = await checkLogin(page);
    if (!isLoggedIn) {
      console.log('⚠️ 需要登录 Boss直聘');
      
      // 保存截图
      const screenshot = path.join(output, 'login-required.png');
      await page.screenshot({ path: screenshot });

      return {
        success: false,
        needLogin: true,
        message: '需要登录 Boss直聘，请在浏览器中手动登录后重试',
        screenshot,
      };
    }

    console.log('✅ 已登录');

    // 应用筛选条件
    if (experience) {
      const expCode = EXPERIENCE_CODES[experience];
      if (expCode) {
        try {
          await page.click('[ka="search-experience"]').catch(() => {});
          await humanDelay(300, 800);
          await page.click(`[data-value="${expCode}"]`).catch(() => {});
          await humanDelay(1000, 2000);
        } catch (e) {
          console.log('⚠️ 经验筛选失败:', e);
        }
      }
    }

    if (education) {
      const eduCode = EDUCATION_CODES[education];
      if (eduCode) {
        try {
          await page.click('[ka="search-degree"]').catch(() => {});
          await humanDelay(300, 800);
          await page.click(`[data-value="${eduCode}"]`).catch(() => {});
          await humanDelay(1000, 2000);
        } catch (e) {
          console.log('⚠️ 学历筛选失败:', e);
        }
      }
    }

    // 收集简历
    const resumes: ResumeDetail[] = [];
    const dedupIndex = loadDedupIndex();
    let currentPage = 1;
    const maxPages = Math.ceil(limit / 10);

    while (resumes.length < limit && currentPage <= maxPages) {
      console.log(`📄 处理第 ${currentPage} 页...`);

      await humanScroll(page);
      await humanDelay(2000, 4000);

      // 解析简历列表
      const cards = await parseResumeList(page);
      console.log(`  找到 ${cards.length} 张简历卡片`);

      for (const card of cards.slice(0, limit - resumes.length)) {
        // 检查去重
        if (isDuplicate(dedupIndex, card.id)) {
          console.log(`  ⏭️ ${card.name} (已存在，跳过)`);
          continue;
        }

        // 获取详情
        const detail = await getResumeDetail(page, card);
        resumes.push(detail);
        console.log(`  ✅ ${detail.name} - ${detail.position}`);

        // 更新去重索引
        const safeName = detail.name.replace(/[\/\\?%*:|"<>\s]/g, '_');
        const fileName = `${safeName}_${detail.position || '未知'}.md`;
        const filePath = path.join(output, fileName);

        dedupIndex.resumes[detail.id] = {
          id: detail.id,
          name: detail.name,
          firstSeen: detail.capturedAt,
          lastSeen: detail.capturedAt,
          filePath,
        };

        await humanDelay(1000, 2000);
      }

      // 翻页
      if (resumes.length < limit && currentPage < maxPages) {
        try {
          const nextBtn = await page.$('.page-next, [ka="page-next"]');
          if (nextBtn) {
            await nextBtn.click();
            currentPage++;
            await humanDelay(2000, 4000);
          } else {
            break;
          }
        } catch (e) {
          console.log('⚠️ 翻页失败:', e);
          break;
        }
      }
    }

    // 导出简历
    for (const resume of resumes) {
      const safeName = resume.name.replace(/[\/\\?%*:|"<>\s]/g, '_');
      const fileName = `${safeName}_${resume.position || '未知'}.md`;
      const filePath = path.join(output, fileName);
      const content = exportResumeMarkdown(resume);
      fs.writeFileSync(filePath, content, 'utf8');
    }

    // 保存去重索引
    saveDedupIndex(dedupIndex);

    // 生成摘要报告
    const summaryPath = path.join(output, '_summary.md');
    const summaryContent = generateSummary(resumes, keywords, city);
    fs.writeFileSync(summaryPath, summaryContent, 'utf8');

    console.log(`\n✅ 搜索完成！共导出 ${resumes.length} 份简历到 ${output}`);

    return {
      success: true,
      total: resumes.length,
      exported: resumes.length,
      outputDir: output,
      resumes,
    };

  } catch (error: any) {
    console.error('❌ 搜索失败:', error.message);

    // 保存错误截图
    let screenshot: string | undefined;
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        screenshot = path.join(output, 'error.png');
        await page.screenshot({ path: screenshot });
      }
    }

    return {
      success: false,
      error: error.message,
      screenshot,
    };

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 生成摘要报告
 */
function generateSummary(resumes: ResumeDetail[], keywords: string, city: string): string {
  const now = new Date().toLocaleString('zh-CN');
  
  let content = `# 简历搜索报告

## 搜索条件
- **关键词**: ${keywords}
- **城市**: ${city}
- **搜索时间**: ${now}
- **导出数量**: ${resumes.length}

## 候选人列表

| 姓名 | 职位 | 公司 | 经验 | 学历 | 薪资 |
|------|------|------|------|------|------|
`;

  for (const r of resumes) {
    content += `| ${r.name} | ${r.position} | ${r.company} | ${r.experience} | ${r.education} | ${r.salary} |\n`;
  }

  // 技能统计
  const skillCount: Record<string, number> = {};
  for (const r of resumes) {
    for (const skill of r.skills) {
      skillCount[skill] = (skillCount[skill] || 0) + 1;
    }
  }

  const sortedSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  
  content += `
## 技能统计

`;
  for (const [skill, count] of sortedSkills) {
    content += `- **${skill}**: ${count}人\n`;
  }

  content += `
---
*报告生成时间: ${now}*
`;

  return content;
}

export default searchResumes;