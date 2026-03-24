# 发布结果模板

## 发布成功

```
✅ 文章发布成功！

标题：我的第一篇文章
链接：https://mp.weixin.qq.com/s/xxxxx
发布时间：2024-01-15 20:00
```

---

## 草稿创建

```
✅ 草稿创建成功！

草稿 ID：xxxxx
标题：我的第一篇文章
预览：可在公众号后台预览
编辑：https://mp.weixin.qq.com/cgi-bin/xxxxx
```

---

## JSON 格式

```json
{
  "success": true,
  "mediaId": "xxxxx",
  "url": "https://mp.weixin.qq.com/s/xxxxx",
  "publishedAt": "2024-01-15T20:00:00Z",
  "type": "publish"
}
```

---

## 错误输出

```json
{
  "success": false,
  "error": {
    "code": 40001,
    "message": "invalid credential"
  }
}
```