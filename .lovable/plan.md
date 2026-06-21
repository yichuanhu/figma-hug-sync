
# 补齐未实现项 — 实施计划

按用户确认，分四块补齐。所有改动遵循既有内存规范（Drawer 900px、Modal 520px、表格 size="small"、外置分页、Lucide 图标）。

## 1. 修复 hint 深链 + 清理废弃 i18n

**`src/components/ProcessManagement/ProcessManagementContent/index.tsx`**

- 重写 `handleOpenApprovalProgress(hint, record)`：不再 `setDetailInitialTab('approval')`，改为：
  - `hint.kind === 'publish'` → `navigate('/dev-center/release-management/' + hint.requestId)`
  - 否则 → `navigate('/dev-center/offline-requests/' + hint.requestId)`
- 删除已无用的 `detailInitialTab='approval'` 相关分支与 state（若仅此处使用则整体移除）

**`src/components/ProcessManagement/ProcessManagementContent/hooks/useProcessApprovalHints.ts`**

- 确认 `ApprovalHint` 含 `requestId`；若缺，从 mock 中补出。

**`public/i18n/zh-CN.json` 与 `en.json`**

- 删除 `approvalProgress.titlePublish`、`approvalProgress.titleOffline` 及仅该 Tab 引用的 `publishPending`、`offlinePending`（如有引用则保留对应在 ApprovalHintCell 用到的 key，仅清理无引用项）
- 用 `rg` 二次校验：删除前确认无引用，避免悬挂。

## 2. 补齐流程发布申请人详情

**`src/pages/Development/ReleaseManagement/components/ReleaseDetailDrawer/index.tsx`**

- 新增 Tab：
  - 「审批流程」：Timeline，节点字段 `level / approver / action(APPROVE/REJECT/PENDING) / time / comment`，与下线申请详情同套视觉（抽出共享 `<ApprovalTimeline />` 复用组件至 `src/components/shared/ApprovalTimeline/`）
  - 「执行结果」：执行状态 Tag + 执行时间 + 失败原因（ExpandableText）
- 基本信息 Tab 保留现状，仅新增「当前审批节点」字段

**`src/pages/Development/ReleaseManagement/ReleaseListPage/index.tsx`**

- 表格新增列：
  - 「申请状态」（PENDING_APPROVAL / APPROVING / APPROVED / REJECTED / EXECUTING / SUCCESS / FAILED / CANCELLED）— 复用统一 STATUS_TAG 配色
  - 「当前审批节点」（如 "L2 · 张三"）
- 接入 `useParams<{ id?: string }>()`：路由命中 `:id` 时自动 setSelectedReleaseId 并打开抽屉；关闭抽屉时 `navigate('/dev-center/release-management')` 清除参数

**`src/App.tsx`**

- 新增路由 `/dev-center/release-management/:id` → `ReleaseListPage`

**i18n**

- `release.detail.approvalProcess` / `release.detail.executionResult` / `release.list.columns.approvalStatus` / `release.list.columns.currentLevel` 等中英文

## 3. 补齐流程下线列表细节

**`src/pages/Development/OfflineRequests/index.tsx`**

- 列补齐：版本（`process_version`）、申请原因（截断 + Popover 显示完整内容，与现有 ExpandableText 行为一致）、申请时间
- 状态枚举对齐 8 项：`PENDING_APPROVAL / APPROVING / APPROVED / REJECTED / EXECUTING / EXECUTION_SUCCESS / EXECUTION_FAILED / CANCELLED`；统一 STATUS_TAG 配色（待审批/审批中=blue，已通过/执行成功=green，已拒绝/执行失败=red，执行中=blue，已撤销=grey）
- 顶部筛选区新增时间筛选（DatePicker range，复用 release 列表同款）

## 4. 重构 mock 为类型化 API

**`src/mocks/processOfflineApproval.ts`** 扩展为分组导出，符合 `mem://tech-stack/api-interface-specification-v2`：

```ts
export const offlineRequestApi = {
  listApplicantOfflineRequests(params: ListApplicantOfflineRequestsParams): Promise<LYListResponse<OfflineRequest>>,
  getOfflineRequestDetail(id: string): Promise<OfflineRequestDetail>,
  checkCurrentOfflineRequest(processId: string): Promise<{ hasActive: boolean; existingRequestId?: string }>,
  checkOfflineDependencies(processId: string): Promise<{ blockers: DependencyGroup[]; passed: boolean }>,
  submitOfflineRequest(payload: SubmitOfflineRequestPayload): Promise<{ requestId: string }>,
};
```

- 所有 mock 字段使用英文 + 中文混合（流程名等业务文案保持中文，与既有 mock 风格一致）
- ID 规范：`offline-req-001` 等
- 内部数据池基于 8 个状态分布生成；申请人列表按当前 mock 用户过滤
- `OfflineRequestsPage`、`CreateOfflineRequestModal`、`ApplicantDetailDrawer` 切换到新 API

## 实施顺序

1. mock 类型化重构（其他模块依赖）
2. hint 深链 + i18n 清理（最小，立即修复点击空白 bug）
3. 下线列表细节
4. 发布申请人详情（含共享 ApprovalTimeline 抽取）

## 验证

- 流程列表点击 publish / offline hint → 跳转到对应申请详情抽屉
- 直接访问 `/dev-center/release-management/<id>` / `/dev-center/offline-requests/<id>` → 自动打开详情
- `rg "approvalProgress\\.(titlePublish|titleOffline)"` 无残留引用
- 8 个状态在下线申请列表、筛选、Tag 均能正确渲染
