# 搜索技巧

## 基本技巧

### 1. 关键词选择
- 使用具体、准确的词汇
- 避免模糊、泛化的词
- 使用专业术语提高精准度

**示例**：
- ❌ "怎么写代码"
- ✅ "Python 异步编程教程"

### 2. 布尔运算符

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `AND` | 同时包含 | `AI AND 医疗` |
| `OR` | 任一包含 | `Python OR JavaScript` |
| `NOT` | 排除 | `Apple NOT 水果` |
| `""` | 精确匹配 | `"人工智能发展报告"` |

### 3. 限定符

| 限定符 | 说明 | 示例 |
|--------|------|------|
| `site:` | 限定网站 | `site:github.com deerflow` |
| `filetype:` | 限定文件类型 | `filetype:pdf AI报告` |
| `intitle:` | 标题包含 | `intitle:教程` |
| `inurl:` | URL包含 | `inurl:blog` |

---

## 高级技巧

### 时间范围
```
# 最新资讯
AI新闻 freshness:day

# 年度报告
AI报告 freshness:year
```

### 组合查询
```
# 精准查找技术文档
site:docs.python.org "async await" filetype:html

# 查找开源项目
site:github.com "language:Python" "web framework"
```

### 排除干扰
```
# 排除商业推广
产品评测 -广告 -推广

# 排除特定网站
Python教程 -site:csdn.net
```

---

## 不同场景的搜索策略

| 场景 | 策略 |
|------|------|
| 技术文档 | `site:官方域名` + `filetype:html/pdf` |
| 学术论文 | `site:scholar.google.com` + 关键词 |
| 开源项目 | `site:github.com` + 语言限定 |
| 新闻资讯 | `freshness:day` + `source:news` |
| 产品评测 | 关键词 + `-广告 -推广` |