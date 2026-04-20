
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
