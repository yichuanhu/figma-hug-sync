
## 状态闭环（Status Lifecycle Closure）

为让需求中心的 9 状态生命周期形成可演示的闭环，约定以下产品逻辑（与现有 mock/逻辑保持一致）：

### 1. 历史版本（historyVersions）的来源
触发"快照入 historyVersions"的三类动作：
- **重新提交（resubmit）**：`REJECTED → PENDING_APPROVAL`，旧版本入历史。
- **审批通过后再次编辑发布**：`APPROVED/LAUNCHED` 状态下二次编辑形成新版本。
- **撤回后重新发起**：`WITHDRAWN/DRAFT → PENDING_APPROVAL`，旧版本入历史。

每条历史版本字段：`version` / `snapshot`（标题/描述/优先级/状态/评估/成本）/ `actorId` / `actorName` / `createdAt` / `summary`。

### 2. 被驳回（REJECTED）处置路径
```
PENDING_APPROVAL ──reject──▶ REJECTED
                                │
       creator 编辑 ────────────┤
                                ├─▶ resubmit ──▶ PENDING_APPROVAL（旧版入 historyVersions）
                                └─▶ 放弃（保持 REJECTED，可后续删除/归档）
```
- 仅 creator 可见「重新提交」按钮（`MOCK_CURRENT_USER_ID` 校验）。
- 重新提交时审批流重置到 L1，原审批历史保留在 `approvalHistory`。

### 3. 撤回（WITHDRAWN）处置路径
```
PENDING_APPROVAL ──creator withdraw──▶ DRAFT/WITHDRAWN
                                          │
                       creator 编辑 ──────┤
                                          ├─▶ 重新提交 ──▶ PENDING_APPROVAL
                                          └─▶ 删除
```
- `withdrawRequirement` 仅 PENDING_APPROVAL + creator 可调用，写入 `approvalHistory.action='withdraw'`。

### 4. 闭环演示数据（mockData.ts › applyClosureDemoData）
为覆盖以下场景，在生成 mock 后做后处理（不破坏其它 mock）：
| 标题 | 状态 | 用途 |
|---|---|---|
| Financial Report Auto-Aggregation | PENDING_APPROVAL | 「待我审批」L1 含当前用户 |
| Customer Ticket Smart Classification | PENDING_APPROVAL | L1 已通过，L2 当前用户 |
| Invoice OCR Data Capture | PENDING_ASSESSMENT | 「待我评估」可见 |
| Contract Approval Workflow | REJECTED · creator=当前用户 | 可重新提交 + 1 条历史版本 |
| Inventory Audit Robot | WITHDRAWN · creator=当前用户 | withdraw/resubmit/withdraw 闭环 + 2 条历史版本 |
| Month-End Reconciliation Automation | LAUNCHED | 3 条历史版本演进 |

并将「需求中心列表」筛选项从旧 7 状态切换为新 9 状态（含 WITHDRAWN）。

---

## 领域边界说明（活动记录 vs 需求内容）

为后续「把活动统一收敛为独立 Tab」等改动建立共识基线，本次仅以文档/类型注释方式澄清边界，未改动任何运行时逻辑或 UI。

### 边界
- **需求内容（Requirement Content）**：描述需求"是什么"。包括基本信息、归属、优先级/状态、动态表单数据（form_data / baselineFormData）、评估结果（value_score / complexity_score / detailedAssessment）、成本估算（cost_estimation / costEstimate）、关联实体（linked_entities / linkedProcesses）。
- **活动记录（Activity / Audit Trail）**：描述"谁在何时对需求做了什么"。包括 `approvals` / `approvalHistory` / `assessments` / `versions` / `historyVersions` / `ActivityRecord`。这些不属于需求本体，仅用于追溯与时间线展示。

### 落地
1. `types.ts` 文件头部新增「领域边界说明」注释块。
2. 在以下类型/字段上追加 `[活动记录]` 前缀的 JSDoc：`ApprovalRecord` / `ApprovalHistoryEntry` / `AssessmentRecord` / `RequirementVersion` / `VersionSnapshot` / `ActivityRecord` / `ActivityType`，以及 `RequirementItem` 中对应的 5 个字段。
3. UI 后续演进约束：活动记录类数据应承载在「动态/历史」类容器中，避免混入主表单或概览主区域。

---

## 历史：审批流飞书风格改造（已完成）

（保留供回溯）将需求详情抽屉「概览」Tab 中的 `ApprovalFlowProgress` 改造为飞书审批流风格的垂直时间线，含收起/展开两态、节点状态图标与连接线、审批人列表与评论气泡、当前节点高亮。仅修改组件 `index.tsx` 与 `index.less`。
