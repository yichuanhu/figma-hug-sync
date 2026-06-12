
# 流程列表「审批中」提示 + 只读审批进度抽屉

## 背景与依据

- FEAT-025 BI-F-07 / STORY-003：开发中心流程列表对当前用户可见的 `PENDING_APPROVAL` 发布申请显示「发布审批中」；申请人 / 创建人 / 负责人 / 有流程数据权限者**无需 `process_publish_approval.view`** 也可查看只读进度。
- FEAT-027 BI-F-04 / BI-F-05 / R-17 / R-18 / STORY-002 R-12 / R-13：调度中心流程列表对未结束停用申请显示「下线审批中 / 下线执行中 / 下线失败」；同样**无需 `process_offline_approval.view`** 也可看只读进度。
- 两侧共同规则：提示**不替代**业务状态字段；提示按入口隔离（发布只在开发中心，下线只在调度中心）；**审批通过/拒绝按钮**只在「当前用户是本级审批人 + 拥有对应 approve 权限点」时显示，与只读查看权限解耦。

## 方案

### 1. 列表新增「审批提示」列

放在「状态」列之后，~150px。

| context | 数据源 | 状态 → Tag |
|---|---|---|
| `development` | 发布审批 `fetchProcessVersions` → `status === 'PENDING_APPROVAL'` | 蓝色 `FileUp`「发布审批中」 |
| `scheduling`  | 下线审批 `fetchOfflineApprovals` → `PENDING_APPROVAL` / `APPROVED` / `EXECUTION_FAILED` | 橙「下线审批中」/ 蓝「下线执行中」/ 红「下线失败」 |

无提示渲染 `-`。点击 Tag → **就地打开只读审批进度抽屉**（不跳路由、不依赖审批目录权限）。

### 2. 只读进度抽屉 `ApprovalProgressDrawer`

通用组件，`mode: 'publish' | 'offline'`。基于 `DetailDrawerWrapper`（900px、maskless）。

内容：
- 顶部摘要：流程名 + 版本号（发布）/ 停用原因（下线）+ 申请人、提交时间、当前状态。
- `ApprovalFlowProgress`（复用需求中心组件）渲染多级审批时间线。
- 下线模式额外展示依赖检查快照 + 执行结果（若已执行 / 失败）。
- **底部操作按钮的条件**：
  - 发布：当前用户在本级审批人列表 **且** 具备 `process_publish_approval.approve` → 显示「通过 / 拒绝」。
  - 下线：当前用户在本级审批人列表 **且** 具备 `process_offline_approval.approve` → 显示「通过 / 拒绝」。
  - 否则**纯只读**，不渲染任何动作按钮。
- 数据获取走「无目录权限可见」接口（mock 不校验 view 权限点），与列表 hint hook 共用一份摘要 + 详情查询。

### 3. 列表 hint Hook

`useProcessApprovalHints(context)`：
- 按 context 二选一订阅（`subscribeProcessVersionChange` 或 `subscribeOfflineRequestChange`）。
- 返回 `Map<process_id, hint>`；hint 含 `kind / status / currentLevel / totalLevels / targetId（versionId 或 requestId）`。
- 可见集合（mock 简化）：申请人 / 创建人 / 负责人 / 同部门 → 全量近似为可见，符合 mock 阶段惯例。

### 4. 版本管理 Tab 接入同一抽屉（仅开发中心）

`PENDING_APPROVAL` 版本行追加「查看审批进度」链接 → 打开 `ApprovalProgressDrawer (mode=publish)`，覆盖 STORY-003 主流程 3b。

### 5. mock 接口补齐

`src/mocks/processVersionApproval.ts`：
- `getPublishApprovalStatus(versionId)` → 返回审批快照 + 当前级 + 记录（不校验 view）。
`src/mocks/processOfflineApproval.ts`：
- `getOfflineApprovalStatus(requestId)` → 同上 + 依赖检查 + 执行结果。

### 6. i18n

`public/i18n/zh-CN.json` / `en.json` 新增：
- `process.list.approvalHint.publishPending`
- `process.list.approvalHint.offlinePending` / `offlineExecuting` / `offlineFailed`
- `process.list.approvalHint.levelTooltip`（`{current}/{total}`）
- `process.list.approvalHint.viewProgress`
- `process.approvalProgress.readonlyTip`（提示当前用户为只读视图）

### 7. 不在范围

- 后端数据权限过滤（mock 近似全可见）。
- 发布/下线审批列表页本身（已存在，不改动）。
- 流程业务状态机及流程详情其它 Tab。

## 涉及文件

新增：
- `src/components/ProcessManagement/ProcessManagementContent/hooks/useProcessApprovalHints.ts`
- `src/components/ProcessManagement/ProcessManagementContent/components/ApprovalHintCell/index.tsx`
- `src/components/ProcessManagement/ProcessManagementContent/components/ApprovalProgressDrawer/index.tsx` + `index.less`

修改：
- `src/components/ProcessManagement/ProcessManagementContent/index.tsx`：注入提示列、持有抽屉状态。
- 版本管理 Tab 组件（位于 `ProcessManagementContent/components` 下版本相关文件）：版本行增加「查看审批进度」入口。
- `src/mocks/processVersionApproval.ts`、`src/mocks/processOfflineApproval.ts`：新增 `*ApprovalStatus` 方法。
- `public/i18n/zh-CN.json`、`public/i18n/en.json`：新增词条。

## 验收要点

- 开发中心流程列表：仅在 context=development 出现「发布审批中」Tag；调度中心不出现。
- 调度中心流程列表：仅在 context=scheduling 出现下线相关 Tag；开发中心不出现。
- 无任何审批目录权限的用户（默认 mock 用户即可演示），点 Tag 能打开抽屉看到只读进度，**抽屉底部不渲染通过/拒绝按钮**。
- 业务状态列保持 `DEVELOPING / PUBLISHED / ARCHIVED` 不变。
