## 目标
让「发布审批详情」与「停用审批详情」抽屉与「需求审批详情」抽屉保持完全一致的版式与交互模式，让用户在不同审批场景间获得一致体验。

参照对象：`src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/index.tsx`（左 Tabs + 右属性面板 + 「审批流程」Tab 内联审批操作）。

## 统一版式
两侧布局（与 `.requirement-detail-layout` 同款，复用现有 LESS 视觉规则）：

- **左侧 Tabs**：
  1. `概览`：基本信息 + 业务相关内容（发布单：发布内容；停用：依赖检查快照）
  2. `审批流程`：Timeline 形式的审批节点 / 历史；若当前用户是当前级审批人，在底部内联渲染「审批意见 TextArea + 通过/拒绝」按钮（拒绝必须填写原因）
- **右侧属性面板**（`.requirement-detail-property-panel` 同款）：
  - 状态（`StatusDot`，颜色取自 `getReleaseStatusDisplay` / `OFFLINE_STATUS_TAG`）
  - 类型 / 优先级（发布单显示「发布类型」Tag；停用申请显示当前级数）
  - 所属部门
  - 创建/申请人（`UserNameWithCard`）
  - 创建时间 / 提交时间
  - 下线时间 / 完成时间（仅在有值时）
  - 与原版一致的 `requirement-detail-property-divider` 分隔

抽屉顶部 `extraActions` **不再放「通过/拒绝」按钮**，统一移入「审批流程」Tab 底部，与需求审批的 `ApprovalSection` 一致。

## 改动清单

### 1. ReleaseDetailDrawer（`src/pages/Development/ReleaseManagement/components/ReleaseDetailDrawer/index.tsx`）
- 重写返回 JSX：`DetailDrawerWrapper` → `requirement-detail-layout` 两栏。
- 左侧 Tabs：`概览` / `审批流程`，删除原「基本信息 / 审批过程 / 发布内容」三 Tab，将基本信息浓缩到右侧属性面板，发布内容并入概览。
- 概览内容：拒绝/失败/失效 Banner + 描述（ExpandableText）+ 当前「发布内容」分组（流程卡 + 资源卡，保留原有 `release-detail-drawer-process-card` / `release-detail-drawer-resource-card` 样式）。
- 审批流程内容：保留原 Timeline；若 `extraActions` 中传入的「approve/reject」上下文存在（改成传 `pendingApprovalContext` prop），在底部渲染 `TextArea + 通过/拒绝` 按钮（沿用原 `handleApprove/submitReject` 逻辑，由父组件提供回调）。
- 新增 `ReleasePropertyPanel` 内联组件，渲染右侧字段。
- 头部 `extraActions` 接口保留但默认为空（兼容外部传入的「编辑」等按钮）。
- LESS：在 `index.less` 中追加 `.release-detail-layout` / `.release-detail-left` / `.release-detail-right` / `.release-detail-property-*` 规则，复制需求详情抽屉的尺寸（左 flex:7、右 flex:3、border-right、property panel divider 等）。

### 2. PublishApprovals 列表（`src/pages/Development/PublishApprovals/index.tsx`）
- 不再向 `ReleaseDetailDrawer` 传 `extraActions={<通过/拒绝>}`；改传 `approvalContext={ canAct: isMyTurn(selected), onApprove, onReject }`。
- 原 `Modal.confirm` / `rejectVisible` 模态保留作为「拒绝原因」弹窗，但触发入口改由抽屉内 Tab 底部按钮触发。

### 3. OfflineApprovalDetailDrawer（`src/pages/Development/OfflineApprovals/components/DetailDrawer/index.tsx`）
- 同样改为左 Tabs + 右属性面板布局。
- 概览：基本信息（停用原因 ExpandableText、执行错误）+ 依赖检查快照。
- 审批流程：现有 Timeline + 底部内联「通过 / 拒绝 / 重试」按钮（按 `isPending && !reviewedByMe` 与 `EXECUTION_FAILED` 条件渲染，复用原 `handleApprove/submitReject/handleRetry`）。
- 右侧属性面板：状态、当前级 `第 X / Y 级`、所属部门、申请人、提交时间、下线时间（可选）、执行错误简述（可选）。
- 移除原 `extraActions={通过/拒绝/重试}`，title 简化为「停用申请详情」+状态 Tag。
- LESS 增补同 ReleaseDetailDrawer 的两栏样式。

### 4. OfflineApprovals 列表（`src/pages/Development/OfflineApprovals/index.tsx`）
- 不需要改动调用方式（详情仍由该抽屉自管 Modal + Toast）。仅校对 props 兼容性。

## 不改动
- 业务数据结构、Mock 接口、列表页 Tabs/筛选/翻页、审批 API 调用顺序与文案。
- 需求审批详情自身（仅作参照）。
- DetailDrawerWrapper、UserNameWithCard、StatusDot 等通用组件。

## 验证
- 进入「发布审批 → 任意发布单」，确认：顶部仅抽屉标题与导航；左侧两 Tab，右侧属性面板与需求审批视觉一致；待我审批时「审批流程」Tab 底部出现意见输入与「通过 / 拒绝」按钮。
- 进入「停用审批 → 任意停用申请」，确认：同样的两栏版式；底部按状态出现「通过/拒绝」或「重试执行」。
- 与「需求审批」详情对比，左列宽度、Tab 间距、右属性面板字段排版肉眼一致。