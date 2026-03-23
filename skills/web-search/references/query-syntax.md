# 高级查询语法

## 搜索引擎通用语法

### 基础语法

```
关键词          # 普通搜索
"精确短语"      # 精确匹配
关键词1 OR 关键词2  # 任一匹配
关键词1 AND 关键词2 # 同时匹配
-排除词         # 排除
```

### 高级语法

```
site:domain.com        # 限定网站
filetype:pdf           # 限定文件类型
intitle:关键词         # 标题包含
inurl:关键词           # URL包含
before:2024-01-01      # 时间上限
after:2023-01-01       # 时间下限
```

---

## 各搜索引擎差异

| 功能 | Google | Bing | 百度 |
|------|--------|------|------|
| site: | ✅ | ✅ | ✅ |
| filetype: | ✅ | ✅ | ✅ |
| intitle: | ✅ | ✅ | ✅ |
| before/after | ✅ | ❌ | ❌ |
| 书名号《》 | ❌ | ❌ | ✅ |

---

## 实战示例

### 查找官方文档
```
site:docs.python.org "async" filetype:html
```

### 查找开源项目
```
site:github.com "AI agent" language:Python stars:>100
```

### 查找学术论文
```
site:arxiv.org "large language model" filetype:pdf
```

### 查找行业报告
```
"2024年" "行业报告" filetype:pdf site:iresearch.cn
```

### 排除特定来源
```
Python教程 -site:csdn.net -site:jianshu.com
```