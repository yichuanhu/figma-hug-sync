修复 sharing 命名空间下 7 个翻译键缺失/被覆盖问题。

## 改动文件
- `public/i18n/zh-CN.json`
- `public/i18n/en.json`

## 修复内容

1. **合并重复的 `sharing.assetSupply.col`**：删除第二个覆盖块，在保留的 col 中补回 `description`、`reuseCount` 字段（zh / en 同步）。
2. **补 `sharing.market.filter.type`**：zh `"类型"` / en `"Type"`。
3. **补 `sharing.market.detail.videoSectionTitle`**：zh `"演示视频"` / en `"Demo video"`。
4. **在 `sharing.market.detail` 下新增 `hero` 子树**：
   - `publishedAt`：`"发布于 {{date}}"` / `"Published {{date}}"`
   - `reuseCount`：`"{{count}} 次复用"` / `"{{count}} reuses"`
   - `downloadCount`：`"{{count}} 次下载"` / `"{{count}} downloads"`
   - `defaultCover.fallback|workflow|knowledge|skill|snippet`

## 验证
- Python `object_pairs_hook` 重扫两份 JSON，确认无重复键。
- Python 解析 7 个完整 key，确认全部命中。
- 不修改任何业务代码。