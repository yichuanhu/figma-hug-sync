# 流程下线申请人详情抽屉标题调整

## 目标
将 `ApplicantDetailDrawer` 的标题从「流程名 + 的下线申请」简化为「申请详情」，并把状态 Tag 移入基本信息卡片内。

## 具体改动
1. **`src/pages/Development/OfflineRequests/components/ApplicantDetailDrawer/index.tsx`**
   - `title` 由 `<Space><span>流程名的下线申请</span><Tag>...</Tag></Space>` 改为纯文本 `"申请详情"`。
   - 在「基本信息」Card 内，在申请人、部门等信息之前，新增一行「状态」字段，渲染原 `STATUS_TAG[data.status]` 的 Tag。

2. **英文 i18n**
   - 若当前抽屉标题使用了 `t('...')`，同步补充 `en.json` 中对应 key 为 `"Application Details"`。

## 备注
- 不涉及路由、列表、创建弹窗等其他模块。
- 审批进度 Timeline、依赖快照等 Tab 保持不动。