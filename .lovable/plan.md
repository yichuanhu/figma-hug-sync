
# 第 4 批正式实施方案

按用户决定，A+B+C+D 全量实现。分三个小批交付，降低单次改动面。

---

## 批次 4.1：Story-A 审批流编辑器 + Story-C 角色解析器（强耦合）

**目标**：方案管理页可视化编辑审批流，新建需求时按方案 + 解析器生成真实审批人。

### 改动文件
- `src/pages/Requirements/RequirementsScheme/components/SchemeEditDrawer/`（或现有编辑入口）新增「审批流」Tab
  - 增删级、上下移序、节点名称、模式（任一/会签/多数）
  - 审批人选择：支持 3 种粒度（用户 / 角色占位符 / 部门占位符）混选
- `src/pages/Requirements/RequirementsWorkbench/types.ts`
  - 恢复 `ApprovalLevelConfig.mode: 'any_one' | 'all' | 'majority'`
  - `approver_type` 扩展为 `'user' | 'role' | 'department'`
- `src/pages/Requirements/RequirementsWorkbench/utils/approverResolver.ts`（新建）
  - `resolveApprovers(level, requirement)` → 真实用户列表
  - 规则：`role-line-manager` 查提交人部门主管；`dept-committee` / `dept-it` 查指定部门成员
  - 解析失败 fallback 到方案预填的兜底审批人
- `src/pages/Requirements/RequirementsWorkbench/mockData.ts`
  - `generateMockApprovalFlow(requirement)` 改为：读取激活方案的 `approval_flow` → 调 `resolveApprovers` → 生成快照
  - 删除硬编码 `APPROVAL_LEVEL_TEMPLATES`
  - 存量需求保持快照不变；仅**新建**需求受方案变更影响
- `schemeConfig.ts`：保留角色占位符不变（已是角色形式）

### 关键约束
- 方案变更只影响新建，存量保留 `approvalFlowConfig` 快照
- 模式语义：`any_one` 任一通过即推进 / `all` 全部通过 / `majority` 过半通过

---

## 批次 4.2：Story-B 关联流程管理

**目标**：详情抽屉关联流程区块支持手动添加/解除 + 跳转流程详情。

### 改动文件
- `src/pages/Requirements/RequirementsWorkbench/components/ManageLinkedProcessesModal/`（重建）
  - 搜索 + 多选项目内现有流程
  - 已关联项展示解除按钮
- `LinkedProcessesSection/index.tsx`
  - 新增「管理」按钮（需求 owner 可见，协作者只读）
  - 流程名变为 `Link` 跳转 `/dev-center/automation-process?processId=xxx`
- `mockData.ts`
  - 恢复 `MOCK_PROCESS_POOL`（项目内可关联流程候选池）
  - 恢复 `addLinkedProcess(reqId, processId)` / `removeLinkedProcess(reqId, processId)`
- `RequirementDetailDrawer/index.tsx`：把 `onChanged` 回调和 owner 判定回传给 Section
- i18n：新增管理/搜索/解除/成功失败提示文案

### 权限约束
- 仅需求 owner（`MOCK_CURRENT_USER_ID === requirement.ownerId`）可管理；协作者只读

---

## 批次 4.3：Story-D 审批历史 + 撤回 + 重新提交

**目标**：审批留痕 + 提交人撤回 / 驳回后重新提交。

### 改动文件
- `types.ts`：新增 `ApprovalHistoryEntry { level, approverId, action: 'approve'|'reject'|'withdraw'|'resubmit', comment?, timestamp }`，挂在 `RequirementItem.approvalHistory`
- `mockData.ts`
  - `advanceApprovalFlow` 每次调用 push 一条 history
  - 新增 `withdrawRequirement(id)`：仅 `PENDING_APPROVAL` + 提交人可调；状态回 `DRAFT`，记录 history
  - 新增 `resubmitRequirement(id)`：`REJECTED` → 重置 flow 到 L1、状态 `PENDING_APPROVAL`，**保留**历史（追加 resubmit 条目）
- `RequirementDetailDrawer/ActivityFeed`（或现有活动流组件）
  - 渲染 history 条目（图标 + 审批人 + 时间 + 评论）
- `RequirementDetailDrawer/ApprovalSection.tsx`
  - 提交人 + `PENDING_APPROVAL` → 显示「撤回」按钮（无需审批人确认，直接回 DRAFT）
  - 提交人 + `REJECTED` → 显示「重新提交」按钮
- i18n：撤回/重新提交/历史相关文案

### 取舍落地
- 撤回**无需**审批人确认（用户裁定取最简方案）
- 重新提交**保留**历史轨迹（审计需要）

---

## 交付顺序与验证

```text
4.1 (A+C) → 自测：编辑方案审批流 → 新建需求 → 进度条按新配置生成
   ↓
4.2 (B)   → 自测：详情抽屉添加/解除流程 → 跳转流程详情
   ↓
4.3 (D)   → 自测：审批留痕 → 提交人撤回 → 驳回后重新提交
```

每批完成后等用户确认再进下一批。

---

## 待用户确认
- 三批顺序与拆分是否 OK？若 OK，回复"开始 4.1"我即进入默认模式从批次 4.1 动手。
