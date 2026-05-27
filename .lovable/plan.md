## 目标

按 `STORY-002-PG-RESPONSIBILITY` 在流程详情抽屉「详情」Tab 的基本信息中新增并维护：开发工程师、代码审核员、最近上线审核人（只读派生），并实现上传新版本后覆盖开发工程师、发布审批通过后回填代码审核员的自动逻辑。

## 范围

- 仅改动 `ProcessDetailDrawer`（详情 Tab 的基本信息区域）及对应 mock 服务。
- 上传版本、发布审批通过两个已有动作旁挂自动写入逻辑。
- 不新增协作者权限、不改变流程访问权限、不修改组织架构数据。

## 详情

### 1. 基本信息字段调整

`ProcessDetailDrawer/index.tsx` `descriptionData` 中，在「负责人」之后追加三行：

- **开发工程师** `developer_ids` — 多人；展示 `UserNameWithCard` 列表（逗号分隔），后面跟一个铅笔图标（Lucide `Pencil` size=14），点击打开编辑弹窗。空值显示 `-` + 添加按钮（同权限点）。
- **代码审核员** `code_reviewer_ids` — 多人；展示 + 编辑入口同上。说明文案 tooltip：「代码审核员可手工维护；若为空且发布审批存在“代码审核”节点，将在该节点审批通过后写入」。
- **最近上线审核人** `last_release_reviewer`（只读派生）— 显示「{用户名} · {版本号} · {审批通过时间}」，无数据显示 `-`；右侧问号 tooltip 解释来源，不可编辑。

所有新增字段按 `useProcessBasicInfoPermission(processId).canView` 控制可见；编辑入口按 `canUpdate` 控制（mock 默认全开，预留 UCI 权限点）。

### 2. 编辑弹窗 `BasicInfoEditModal`

路径：`.../ProcessDetailDrawer/components/BasicInfoEditModal/`

- 基于 `FormModal`，宽 520px，标题随入口动态：`编辑开发工程师` / `编辑代码审核员`。
- 字段：用户多选（`Select multiple filter`，使用现有 `OwnerSelect` 或简单 mock 用户列表 + 去重校验）。复用既有 `mockCreatorInfoMap` 扩充为 8 人左右作为选项。
- 校验：必须为有效用户、不可重复；可为空（按 R-02、R-05）。
- 提交后调用 mock 服务 `updateProcessBasicInfo`，写入本地 store 并 `Toast.success`，触发抽屉局部刷新（通过 `refreshTick`/回调）。

### 3. Mock 数据与服务

新建 `src/mocks/processBasicInfo.ts`：

- 类型 `ProcessBasicInfo { process_id, developer_ids: string[], code_reviewer_ids: string[], last_release_reviewer?: { user_id, user_name, version, approved_at } }`。
- 提供 `getProcessBasicInfo(processId)`、`updateProcessBasicInfo(processId, patch)`、`overrideDevelopersOnVersionUpload(processId, uploaderId)`、`writeCodeReviewerFromApproval(processId, approverId)`、`setLastReleaseReviewer(processId, info)`。
- 内置 in-memory `Map`，按 process 预置 1-2 个开发工程师、0-1 个审核员、一条最近上线审核人样例数据。
- 提供 mock 用户列表（与现有 `mockCreatorInfoMap` 对齐，新增 user-006/007/008）。
- 所有写操作伴随 `console.info('[AUDIT] ...')` 输出，模拟 R-04/R-11 审计日志。

### 4. 自动维护逻辑接线

- **上传新版本覆盖开发工程师 (R-03/R-04, AC-FUNC-03)**：找到 `ProcessDetailDrawer` 内现有「上传新版本」成功回调（versions Tab 内的上传/创建版本逻辑），在成功后调用 `overrideDevelopersOnVersionUpload(processId, currentUserId)` 并刷新基本信息。若现有上传逻辑在外部组件，则通过 `onUploadVersionSuccess` 回调向上暴露，并在抽屉拿到回调后写入。
- **发布审批通过回填代码审核员 (R-05/R-06, AC-FUNC-04)**：在现有发布审批 mock 通过流程（`src/mocks/processVersionApproval.ts` 中标记通过的位置）尾部调用 `writeCodeReviewerFromApproval`，仅在 `code_reviewer_ids` 为空且节点名包含「代码审核」时写入最后一个节点通过人；同时调用 `setLastReleaseReviewer` 更新只读字段（无论代码审核员是否被写入，AC-FUNC-05）。

### 5. 权限 Hook

新建 `src/hooks/useProcessBasicInfoPermission.ts`，导出 `{ canView, canUpdate }`，mock 全返回 true，预留 UCI（`process_basic_info.view` / `process_basic_info.update`）。

### 6. i18n

`public/i18n/zh-CN.json` 与 `en.json` 在 `development.processDevelopment.detail` 下新增：
`basicInfo.developers`、`basicInfo.codeReviewers`、`basicInfo.lastReleaseReviewer`、`basicInfo.lastReleaseReviewerTip`、`basicInfo.codeReviewerTip`、`basicInfo.editDevelopers`、`basicInfo.editCodeReviewers`、`basicInfo.userPlaceholder`、`basicInfo.duplicateUser` 等键。

## 不改动

- 现有「版本/依赖/资料/工时/ROI」Tab 内容与样式。
- 流程访问权限、协作者机制、组织架构数据。
- 路由、Sidebar、发布/停用审批页面 UI（仅在审批通过的 mock 服务里追加回填调用）。

## ASCII 结构

```text
ProcessDetailDrawer › 详情 Tab › 基本信息
├── 流程名 / 描述 / 归属部门 / 关联需求 / 负责人 / 创建人 ...
├── 开发工程师        [张三, 李四] ✎              ← 新增（可编辑）
├── 代码审核员        [王五] ✎ (?)               ← 新增（可编辑 + 说明）
└── 最近上线审核人    赵六 · v1.2.0 · 2026-05-20 (?)  ← 新增（只读派生）

自动维护：
  上传新版本成功 ──▶ overrideDevelopersOnVersionUpload
  发布审批「代码审核」节点通过 ──▶ writeCodeReviewerFromApproval (+ setLastReleaseReviewer)
```
