---
name: wechat-publish
description: "微信公众号发布技能 - 文章发布、图片上传、草稿管理"
metadata:
  category: content
  triggers: ["公众号发布", "微信发布", "发布文章", "公众号", "wechat publish", "微信公众号"]
  author: agentwork
  version: "1.0.0"
---

# 微信公众号发布技能 (wechat-publish)

## 功能

本技能提供微信公众号内容发布的全流程能力：

1. **文章发布**
   - Markdown 转微信公众号格式
   - 自动排版和样式优化
   - 定时发布支持
   - 群发管理

2. **图片上传**
   - 自动上传图片到微信素材库
   - 图片压缩优化
   - 生成微信图床链接
   - 批量上传支持

3. **草稿管理**
   - 创建/更新草稿
   - 草稿列表查看
   - 草稿预览
   - 草稿转发布

4. **素材管理**
   - 图文素材管理
   - 图片/视频素材
   - 素材库同步
   - 素材复用

## 使用方法

### 基本用法

```bash
# 发布文章
wechat-publish --file article.md --title "文章标题"

# 创建草稿
wechat-publish --file article.md --draft

# 上传图片
wechat-publish --upload-image cover.jpg

# 查看草稿列表
wechat-publish --list-drafts

# 定时发布
wechat-publish --file article.md --schedule "2024-01-15 20:00"
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--file` | Markdown 文件路径 | - |
| `--title` | 文章标题 | 从文件提取 |
| `--draft` | 仅保存草稿 | false |
| `--publish` | 直接发布 | false |
| `--schedule` | 定时发布时间 | - |
| `--upload-image` | 上传图片 | - |
| `--list-drafts` | 列出草稿 | false |
| `--delete-draft` | 删除草稿 ID | - |
| `--preview` | 生成预览链接 | false |

### 命令模式

```bash
# 发布模式
wechat-publish publish --file article.md

# 草稿模式
wechat-publish draft --file article.md --title "标题"

# 素材模式
wechat-publish material --upload cover.jpg

# 管理模式
wechat-publish manage --list-drafts
```

## 输入输出

### 输入

- **Markdown 文件**: 文章内容（支持标准 Markdown 语法）
- **标题**: 文章标题（可选，可从文件提取）
- **封面图**: 可选封面图片路径
- **摘要**: 可选文章摘要

### 输出

**发布成功：**

```
✅ 文章发布成功！

标题：我的第一篇文章
链接：https://mp.weixin.qq.com/s/xxxxx
发布时间：2024-01-15 20:00
阅读量：实时统计中...
```

**草稿创建：**

```
✅ 草稿创建成功！

草稿 ID：xxxxx
标题：我的第一篇文章
预览：可在公众号后台预览
编辑：https://mp.weixin.qq.com/cgi-bin/xxxxx
```

**图片上传：**

```
✅ 图片上传成功！

文件名：cover.jpg
微信 URL：https://mmbiz.qpic.cn/xxxxx
尺寸：1920x1080
大小：256 KB
```

**草稿列表：**

```
📋 草稿列表 (共 3 篇)

1. [草稿] 我的第一篇文章
   ID: xxxxx | 更新于：2024-01-15 10:00

2. [草稿] 技术分享：AI 入门
   ID: xxxxx | 更新于：2024-01-14 15:30

3. [草稿] 产品更新公告
   ID: xxxxx | 更新于：2024-01-13 09:00
```

## 示例

### 示例 1：发布文章

```bash
wechat-publish --file blog-post.md --title "2024 年技术趋势" --publish
```

### 示例 2：创建草稿

```bash
wechat-publish --file article.md --draft --title "新产品发布"
```

### 示例 3：上传封面图

```bash
wechat-publish --upload-image cover.jpg --upload-image img1.jpg --upload-image img2.jpg
```

### 示例 4：定时发布

```bash
wechat-publish --file article.md --schedule "2024-01-20 18:00"
```

### 示例 5：管理草稿

```bash
# 查看草稿
wechat-publish --list-drafts

# 删除草稿
wechat-publish --delete-draft draft_id_xxx

# 预览草稿
wechat-publish --preview-draft draft_id_xxx
```

## Markdown 格式支持

### 支持的语法

```markdown
# 标题
## 二级标题
### 三级标题

**加粗** *斜体* ~~删除线~~

- 列表项
- 列表项

1. 有序列表
2. 有序列表

> 引用内容

[链接](https://example.com)

![图片](image.jpg)

```javascript
// 代码块
console.log("Hello");
```
```

### 微信公众号特殊格式

```markdown
<!-- 摘要 -->
这是文章摘要，会显示在推送列表中

<!-- 封面图 -->
![cover](cover.jpg)

<!-- 作者 -->
作者：张三

<!-- 正文开始 -->
# 正文内容...
```

## 配置

创建 `~/.wechat-publish/config.json` 配置公众号信息：

```json
{
  "appId": "your_app_id",
  "appSecret": "your_app_secret",
  "defaultAuthor": "你的笔名",
  "defaultCoverRatio": "2.35:1",
  "autoCompress": true,
  "outputDir": "~/wechat-publish"
}
```

## 认证方式

### 方式一：扫码登录（推荐）

```bash
wechat-publish login
# 扫描二维码完成认证
```

### 方式二：Token 配置

在配置文件中设置 accessToken（有效期 2 小时，需定期刷新）

## 注意事项

1. 图片建议尺寸：封面图 900x383px，正文图宽度不超过 1080px
2. 文章标题限制：1-64 字
3. 摘要限制：1-120 字
4. 定时发布需提前至少 2 小时设置
5. 群发次数限制：订阅号每天 1 次，服务号每月 4 次
