## 计划

### 1. 修复词条显示原始 key 的问题
- 词条已存在 JSON 中（已验证），出现原始 key 通常是 i18n 资源未刷新。
- 排查 `public/i18n/*.json` 中是否有同级键冲突：当前 `sharing.market.detail.attachments`（字符串）与新增的 `sharing.market.detail.attachment`（对象）共存，i18next 在某些初始化下会因 `attachment` 前缀截断查找失败。
- 处理：将 `AssetDetail` 中使用的 `detail.attachment.title` / `detail.attachment.download` 改为复用已有的字符串键（`detail.attachments` / `detail.downloadZip`），或将 JSON 中的命名归一为 `detail.attachmentSection.title` / `download` 避免与同级字符串冲突；同步更新引用处与 `check-i18n-market.mjs`。
- 验证：浏览器实际打开「资产上架」抽屉 + 资产详情页，确认所有相关词条正常渲染。

### 2. 状态展示参考需求中心改为 StatusDot
- 将 `src/pages/SharingCenter/MyShared/index.tsx` 中的状态列由当前 `Tag color={STATUS_TAG_COLOR[ds]}` 改为通用 `StatusDot`（`@/components/StatusDot`）。
- 新增统一映射（参考 `src/components/sharing/StatusTag` 与需求中心 `statusConfigV2`）：
  - DRAFT → grey
  - PENDING_APPROVAL → orange
  - PUBLISHED → green
  - REJECTED → red
  - UNLISTED → light-blue
- 行内仅渲染「色点 + 文本」，与需求中心列表保持一致。
- 同步移除文件顶部不再使用的 `STATUS_TAG_COLOR` 常量。

### 3. 第 2 项（"流程类资产丢失"）
- 用户已确认为误报，不做处理。

### 技术细节
- 文件改动：
  - `src/pages/SharingCenter/MyShared/index.tsx`：状态列渲染改为 StatusDot；清理无用常量。
  - `src/pages/Sharing/Market/AssetDetail/index.tsx`：将 `attachment.title` / `attachment.download` 切换到已有词条，避免与 `attachments` 字符串键冲突。
  - `public/i18n/zh-CN.json` / `public/i18n/en.json`：清理 `detail.attachment` 对象键（如无引用则删除）。
- 构建校验：运行 `node scripts/check-i18n-market.mjs` 确认零缺失。