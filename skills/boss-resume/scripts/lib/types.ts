/**
 * Boss直聘简历搜索 - 类型定义
 */

// 搜索参数
export interface SearchOptions {
  keywords: string;
  city?: string;
  experience?: string;
  salary?: string;
  education?: string;
  limit?: number;
  outputDir?: string;
  headless?: boolean;
  cookieFile?: string | null;
}

// 简历基本信息
export interface ResumeCard {
  id: string;
  name: string;
  position: string;
  company: string;
  experience: string;
  education: string;
  salary: string;
  location: string;
  skills: string[];
  avatar?: string;
  url?: string;
}

// 简历详情
export interface ResumeDetail extends ResumeCard {
  age?: string;
  gender?: string;
  phone?: string;
  email?: string;
  workExperience: WorkExperience[];
  projectExperience: ProjectExperience[];
  educationHistory: EducationHistory[];
  expectedPosition?: string;
  expectedSalary?: string;
  expectedLocation?: string;
  selfIntroduction?: string;
  capturedAt: string;
}

// 工作经历
export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description?: string;
}

// 项目经历
export interface ProjectExperience {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description?: string;
}

// 教育经历
export interface EducationHistory {
  school: string;
  degree: string;
  major?: string;
  startDate: string;
  endDate: string;
}

// 搜索结果
export interface SearchResult {
  success: boolean;
  total?: number;
  exported?: number;
  outputDir?: string;
  resumes?: ResumeDetail[];
  needLogin?: boolean;
  message?: string;
  screenshot?: string;
  error?: string;
}

// 城市代码映射
export const CITY_CODES: Record<string, string> = {
  '北京': '101010100',
  '上海': '101020100',
  '广州': '101280100',
  '深圳': '101280600',
  '杭州': '101210100',
  '成都': '101270100',
  '南京': '101190100',
  '武汉': '101200100',
  '西安': '101110100',
  '重庆': '101040100',
  '苏州': '101190400',
  '天津': '101030100',
  '郑州': '101180100',
  '长沙': '101250100',
  '厦门': '101230200',
};

// 经验代码映射
export const EXPERIENCE_CODES: Record<string, string> = {
  '不限': '',
  '应届生': '1',
  '1年以下': '2',
  '1-3年': '3',
  '3-5年': '4',
  '5-10年': '5',
  '10年以上': '6',
};

// 学历代码映射
export const EDUCATION_CODES: Record<string, string> = {
  '不限': '',
  '大专': '3',
  '本科': '4',
  '硕士': '5',
  '博士': '6',
};

// 去重索引
export interface DedupIndex {
  resumes: Record<string, {
    id: string;
    name: string;
    firstSeen: string;
    lastSeen: string;
    filePath: string;
  }>;
}

// 导出格式
export type ExportFormat = 'markdown' | 'json' | 'csv';

// CLI 参数
export interface CLIArgs {
  keywords: string;
  city?: string;
  experience?: string;
  education?: string;
  salary?: string;
  outputDir?: string;
  format?: ExportFormat;
  limit?: number;
  headless?: boolean;
  exportAll?: boolean;
}