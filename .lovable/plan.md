

## 首页中心卡片 SVG 图标替换方案

### 内容

将上传的 5 个 v6 版本 SVG 文件替换到 `src/assets/icons/` 目录，覆盖现有的同名文件。新 SVG 的 viewBox 为 28x28，CSS 中 `.center-entry-icon-wrapper svg` 已设置为 `28px`，无需调整样式。

### 实施步骤

1. **替换 5 个 SVG 文件**（覆盖写入）：
   - `src/assets/icons/requirements.svg` ← 需求中心-6.svg
   - `src/assets/icons/development.svg` ← 开发中心-6.svg
   - `src/assets/icons/scheduling.svg` ← 调度中心-6.svg
   - `src/assets/icons/operations.svg` ← 运营中心-6.svg
   - `src/assets/icons/maintenance.svg` ← 运维中心-6.svg

2. **无需修改代码**：`CenterEntrySection/index.tsx` 已使用 `?raw` 导入并通过 `dangerouslySetInnerHTML` 渲染，文件覆盖后自动生效。

### 注意

新 SVG 各中心有独立配色（需求蓝 `#165DFF`、开发绿 `#4FBE31`、调度青 `#4FC1CE`、运营紫 `#CA6DFF`、运维黄 `#B1A00F`），与卡片背景渐变色一致。

