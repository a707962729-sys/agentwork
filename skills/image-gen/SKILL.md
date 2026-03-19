---
name: image-gen
description: "图片生成技能 - 封面图、配图生成，支持多种风格"
metadata:
  category: content
  triggers: ["图片生成", "封面图", "配图", "生成图片", "image generation", "cover image"]
  author: agentwork
  version: "1.0.0"
---

# 图片生成技能 (image-gen)

## 功能

本技能提供 AI 驱动的图片生成能力，支持多种场景和风格：

1. **封面图生成**
   - 文章封面图
   - 视频封面
   - 社交媒体封面
   - 支持自定义尺寸比例

2. **配图生成**
   - 文章内插图
   - 教程步骤图
   - 信息图表
   - 图标和装饰元素

3. **多种艺术风格**
   - 写实风格 (Photorealistic)
   - 插画风格 (Illustration)
   - 扁平风格 (Flat Design)
   - 水彩风格 (Watercolor)
   - 赛博朋克 (Cyberpunk)
   - 中国风 (Chinese Style)
   - 极简风格 (Minimalist)
   - 3D 渲染 (3D Render)

## 使用方法

### 基本用法

```bash
# 生成封面图
image-gen --type cover --prompt "科技主题，蓝色调，未来感"

# 生成配图
image-gen --type illustration --prompt "团队协作场景"

# 指定风格
image-gen --prompt "产品发布会" --style cyberpunk

# 批量生成
image-gen --prompt "四季风景" --count 4 --variation
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--prompt` | 图片描述提示词 | - |
| `--type` | 图片类型 (cover/illustration/icon/background) | illustration |
| `--style` | 艺术风格 | realistic |
| `--ratio` | 宽高比 (16:9/4:3/1:1/9:16) | 16:9 |
| `--count` | 生成数量 | 1 |
| `--output` | 输出目录 | ./images |
| `--quality` | 质量等级 (standard/hd/ultra) | standard |
| `--seed` | 随机种子（可复现） | random |

### 支持的风格

| 风格 | 描述 | 适用场景 |
|------|------|----------|
| `realistic` | 写实摄影风格 | 产品展示、新闻配图 |
| `illustration` | 手绘插画风格 | 教程、故事配图 |
| `flat` | 扁平化设计 | UI 设计、信息图 |
| `watercolor` | 水彩画风格 | 文艺内容、博客 |
| `cyberpunk` | 赛博朋克风格 | 科技、游戏内容 |
| `chinese` | 中国风 | 传统文化内容 |
| `minimalist` | 极简风格 | 高端品牌、简约设计 |
| `3d` | 3D 渲染风格 | 产品展示、概念图 |

## 输入输出

### 输入

- **提示词 (prompt)**: 描述想要生成的图片内容
- **类型 (type)**: 封面图/插图/图标/背景
- **风格 (style)**: 选择艺术风格
- **尺寸 (ratio)**: 输出图片比例

### 输出

**生成结果：**

```
✅ 图片生成完成！

文件：cover_20240115_001.png
尺寸：1920x1080 (16:9)
风格：cyberpunk
大小：2.3 MB
路径：./images/cover_20240115_001.png

预览：file:///Users/xxx/images/cover_20240115_001.png
```

**批量生成：**

```
✅ 批量生成完成！

共生成 4 张图片：
- variation_001.png (种子：12345)
- variation_002.png (种子：12346)
- variation_003.png (种子：12347)
- variation_004.png (种子：12348)

输出目录：./images/variations/
```

## 示例

### 示例 1：生成文章封面图

```bash
image-gen --type cover --prompt "人工智能主题，蓝色科技背景，抽象神经网络" --style minimalist --ratio 16:9
```

### 示例 2：生成教程插图

```bash
image-gen --type illustration --prompt "程序员在电脑前工作，扁平风格" --style flat
```

### 示例 3：生成中国风配图

```bash
image-gen --prompt "山水画，传统中国风，云雾缭绕" --style chinese --ratio 4:3
```

### 示例 4：批量生成变体

```bash
image-gen --prompt "未来城市" --style cyberpunk --count 4 --variation --output ./city-images
```

### 示例 5：生成社交媒体封面

```bash
image-gen --type cover --prompt "新年庆祝，红色喜庆" --ratio 1:1 --quality hd
```

## 提示词技巧

### 好的提示词结构

```
[主体] + [场景/背景] + [风格] + [色调] + [细节]

示例：
"一只猫 (主体) 坐在窗台上 (场景)，水彩风格 (风格)，暖色调 (色调)，阳光透过窗户 (细节)"
```

### 风格修饰词

- **高质量**: "4k, highly detailed, professional"
- **氛围**: "warm lighting, cinematic, dramatic"
- **构图**: "centered, rule of thirds, wide angle"

## 配置

创建 `~/.image-gen/config.json` 自定义默认设置：

```json
{
  "defaultStyle": "realistic",
  "defaultRatio": "16:9",
  "outputDir": "~/Pictures/image-gen",
  "quality": "hd",
  "preferredModel": "stable-diffusion-xl"
}
```

## 注意事项

1. 提示词越详细，生成效果越好
2. 避免过于复杂的场景描述
3. 批量生成时使用不同种子获得多样性
4. 商业用途请注意版权和授权
