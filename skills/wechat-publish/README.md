# WeChat Publish 技能

微信公众号发布技能，支持文章发布、图片上传、草稿管理。

## 快速开始

```bash
# 登录公众号
wechat-publish login

# 发布文章
wechat-publish --file article.md --title "文章标题" --publish

# 创建草稿
wechat-publish --file article.md --draft

# 上传图片
wechat-publish --upload-image cover.jpg
```

## 功能特性

- 📝 **文章发布** - Markdown 转微信格式，自动排版
- 🖼️ **图片上传** - 自动压缩，生成微信图床链接
- 📋 **草稿管理** - 创建/更新/预览/删除草稿
- ⏰ **定时发布** - 支持定时群发
- 📊 **素材管理** - 图文/图片/视频素材库

## 使用场景

1. **公众号日常运营** - 文章发布、群发管理
2. **批量内容发布** - 多篇草稿批量处理
3. **定时推送** - 预设发布时间
4. **素材复用** - 图片、模板重复使用

## 发布流程

```
1. 准备 Markdown 文件
   ↓
2. 上传图片（可选）
   ↓
3. 创建草稿预览
   ↓
4. 确认并发布 / 定时发布
```

## Markdown 支持

```markdown
# 标题
**加粗** *斜体*
- 列表
> 引用
![图片](url)
```

## 输出示例

```
✅ 文章发布成功！
标题：我的第一篇文章
链接：https://mp.weixin.qq.com/s/xxxxx
发布时间：2024-01-15 20:00
```

## 配置

在 `~/.wechat-publish/config.json` 中配置公众号 AppID 和 Secret。

详见 SKILL.md 获取完整文档。
