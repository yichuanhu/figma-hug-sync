## 重构目标

将"开发中心 > 流程发布 / 发布审批"原型从旧的"流程版本发布状态"模型重构为"发布单 + 审批实例 + 版本生命周期"三层模型，所有展示均以发布单为核心。

---

## 一、统一状态模型（贯穿全部页面与 Mock）

### 1. 发布单业务状态 `publish_status`
仅四值：
- `PENDING_APPROVAL` → 待审批
- `SUCCESS` → 已发布
- `REJECTED` → 已拒绝
- `FAILED` → 发布失败 / 已失效（细分由 `failure_code` 区分）

**移除 `PUBLISHING / 发布中`**。

### 2. 审批实例状态 `audit_status`（独立于发布状态）
- `PENDING`
- `APPROVED`
- `REJECTED`
- 无审批流程时该字段为 `null`，详情显示"无需审批"

### 3. 流程版本生命周期 `version_lifecycle`
- `DRAFT` / `PUBLISHED` / `ARCHIVED`
- 仅用于流程版本本身，**不再把审批/发布状态写到版本上**。

### 4. 失败/失效细分 `failure_code`
- `PROCESS_ARCHIVED_BEFORE_PUBLISH`：审批通过后流程被归档 → 展示"审批已通过，发布申请已失效 / 流程已归档"
- 其他值（执行错误）→ 展示"发布失败"+ 失败原因

### 5. 业务状态展示规则表

| publish_status | audit_status | failure_code | 文案 | Tag 颜色 |
|---|---|---|---|---|
| PENDING_APPROVAL | PENDING | - | 待审批 | blue |
| SUCCESS | APPROVED 或 null | - | 已发布 | green |
| REJECTED | REJECTED | - | 已拒绝 | red |
| FAILED | APPROVED | PROCESS_ARCHIVED_BEFORE_PUBLISH | 已失效 | grey |
| FAILED | * | 其他 | 发布失败 | red |

---

## 二、文件改动清单

### A. 类型与 Mock
**`src/api/index.ts`**
- 将 `ReleaseStatus` 改为 `'PENDING_APPROVAL' \| 'SUCCESS' \| 'REJECTED' \| 'FAILED'`（移除 `PUBLISHING`）。
- `LYReleaseResponse` 新增字段：
  - `audit_status?: 'PENDING' \| 'APPROVED' \| 'REJECTED' \| null`
  - `failure_code?: 'PROCESS_ARCHIVED_BEFORE_PUBLISH' \| 'EXECUTION_ERROR' \| null`
  - `failure_reason?: string \| null`
  - `reject_reason?: string \| null`
  - `current_approval_level / total_approval_levels / current_approver_label`
  - `approval_records: ReleaseApprovalRecord[]`（提升为正式字段）

**`src/pages/Development/ReleaseManagement/ReleaseListPage/index.tsx`**
- 移除 `ReleaseApprovalStatus` 8 项枚举与 `RELEASE_APPROVAL_STATUS_TAG`，改为依据上述展示规则表渲染单一业务状态 Tag。
- Mock 生成器按新枚举铺数据：覆盖 `PENDING_APPROVAL`、`SUCCESS`、`REJECTED`、`FAILED(EXECUTION_ERROR)`、`FAILED(PROCESS_ARCHIVED_BEFORE_PUBLISH)` 五种典型样本。

**`public/i18n/zh-CN.json`**
- `release.publishStatus`：删除 `PUBLISHING`，新增 `PENDING_APPROVAL / REJECTED / INVALIDATED`。
- 新增 `release.detail.publishContent`、`release.detail.failureReason`、`release.detail.rejectReason`、`release.detail.noApprovalNeeded`、`release.detail.archivedBeforePublish`。

### B. 普通"流程发布"列表 `ReleaseListPage`
列顺序（**只有一个业务状态列**）：
1. 发布编号 `release_id`（180）
2. 发布类型 Tag（120）
3. 发布内容摘要（取 contents[0].process_name + "等 N 个流程"，ellipsis）
4. 流程数量（90 居中）
5. 业务状态 Tag（按规则表，120）
6. 发布人 `UserNameWithCard`（130）
7. 所属部门（160）
8. 提交/更新时间（170）
9. 操作（60）

筛选项 `publish_status` 同步为新四值（"已失效"在 UI 上作为 FAILED 的子筛选可暂不细分，先按 FAILED 一项处理）。

### C. 发布单详情 `ReleaseDetailDrawer`
- 抽屉标题改为"发布单详情"。
- Tab 顺序：
  1. **基本信息** — 含发布编号、类型、业务状态、发布人、提交时间、说明；当 `publish_status=REJECTED` 显示"拒绝原因"区块；当 `FAILED + PROCESS_ARCHIVED_BEFORE_PUBLISH` 显示"失效原因：流程已归档"灰色提示；其他 `FAILED` 显示"失败原因"红色提示。
  2. **审批过程** — 有 `audit_status` 时复用现有 Timeline；为空时显示"无需审批"占位。
  3. **发布内容**（原"已发布流程和资源"Tab 重命名为 `release.detail.publishContent` → "发布内容"）。
- 流程跳转分流（`handleProcessClick`）：
  - `publish_status=SUCCESS` → `/scheduling-center/automation-process?processId=...`（生产侧）
  - `PENDING_APPROVAL / REJECTED / FAILED(非归档)` → `/dev-center/automation-process?processId=...`（开发中心）
  - `FAILED + PROCESS_ARCHIVED_BEFORE_PUBLISH` → 行内不可点击，显示"发布申请已失效/流程已归档"。

### D. 发布审批列表 `PublishApprovals`
重写为以**发布单**为单位（不再以单个 ProcessVersion 为审批单核心），数据来源切换至 `ReleaseListPage` 的 mock 生成器（导出 `generateMockReleaseResponse`）。

列：
1. 发布编号
2. 发布类型
3. 流程名称/版本摘要（取首个 + "等 N 个"）
4. 流程数量
5. 发布人
6. 所属部门
7. 提交时间
8. 审批进度（第 X / Y 级）
9. 审批状态/发布结果（双 Tag：`audit_status` 主，`publish_status` 副）
10. 操作：审批 / 查看详情

Tab 维持 `待我审批 / 我审批过的 / 全部`，过滤条件改为基于发布单 + 审批记录。

详情抽屉直接复用 `ReleaseDetailDrawer`（替换原 `PublishApprovalDetailDrawer`），通过 `extraActions` 注入"通过 / 拒绝"按钮。删除旧的 `PublishApprovalDetailDrawer` 文件，以及 `processVersionApproval.ts` 中与版本审批耦合的部分（保留可被发布单审批调用的 mock 方法重命名为 `approveRelease / rejectRelease`）。

### E. 新建发布 `CreateReleasePage / ProcessSelectionStep`
重写"可选流程"判定逻辑：
```
canSelect(process) =
  !process.is_archived
  && process.latest_version.lifecycle === 'DRAFT'
  && !process.latest_version.has_pending_release
  && !process.latest_version.has_blocking_rejected_release
```
- 移除"只看 `is_published` 取反"分支。
- 版本下拉只展示 `lifecycle === 'DRAFT'` 的最新版本；`PUBLISHED / ARCHIVED` 版本灰显且禁用。
- 历史 `DRAFT` 版本（非最新）禁用并提示"需先以最新版本提交"。
- Mock 数据补充 `lifecycle / has_pending_release / has_blocking_rejected_release` 字段，覆盖各分支。

### F. 直发逻辑（无需审批场景）
`CreateReleasePage` 提交入口：
```
submit():
  preflight = validateAllProcessesPublishable(selected)
  if (preflight.hasUnpublishable) {
    Toast.error("部分流程已归档或不可发布，请重新选择")
    return  // 不创建发布单
  }
  if (needApproval) createReleaseAsPendingApproval()
  else createReleaseAndPublishImmediately()  // 全部成功才标记 SUCCESS
```
不允许部分发布；任一失败整体回滚为不创建。

---

## 三、技术细节

- 所有 Tag 颜色统一走上文规则表，新增工具函数 `getReleaseStatusDisplay(release): { color, text }` 放在 `ReleaseListPage/index.tsx` 顶部并 export，详情抽屉 / 审批列表均复用。
- 旧 `ReleaseApplicantExtension` 中的 `approval_status` 8 项废弃，改为 `audit_status` + `publish_status` 双字段组合派生展示。
- `processVersionApproval.ts` 中 `VersionStatus = 'UPLOADED' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED'` 不再用于审批列表，仅保留给版本生命周期展示（映射到新 `version_lifecycle`）。
- i18n 键全部保留中文文案，英文 key 不变以兼容现有调用点。

---

## 四、不改动的部分

- `DetailDrawerWrapper`、`UserNameWithCard`、`ExpandableText`、`FilterPopover` 等公共组件不动。
- 路由结构不动（`/dev-center/release-management`、`/dev-center/publish-approvals`）。
- "发布内容" Tab 内的资源分组渲染逻辑保留。

实施完成后将以截图自检发布列表 / 审批列表 / 发布单详情三类页面的状态展示是否符合规则表。
