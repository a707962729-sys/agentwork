# 图片输出模板

## 标准输出格式

```json
{
  "images": [
    {
      "url": "https://...",
      "localPath": "./images/cover_001.png",
      "width": 1920,
      "height": 1080,
      "format": "png",
      "size": "2.3 MB",
      "style": "cyberpunk",
      "seed": 12345
    }
  ],
  "prompt": "原始提示词",
  "enhancedPrompt": "增强后的提示词",
  "model": "dall-e-3",
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Markdown 输出格式

```markdown
# 图片生成完成！

## 基本信息
- **风格**：cyberpunk
- **尺寸**：1920×1080 (16:9)
- **格式**：PNG
- **大小**：2.3 MB

## 预览
![生成的图片](./images/cover_001.png)

## 提示词
原始：科技主题封面
增强：technology cover, cyberpunk style, neon lights, futuristic city, 4k, highly detailed

## 批量生成
| 编号 | 种子 | 路径 |
|------|------|------|
| 1 | 12345 | ./images/variation_001.png |
| 2 | 12346 | ./images/variation_002.png |
| 3 | 12347 | ./images/variation_003.png |
```

---

## 错误输出格式

```json
{
  "error": true,
  "message": "内容违规",
  "details": "提示词包含敏感内容",
  "suggestion": "请修改提示词后重试"
}
```