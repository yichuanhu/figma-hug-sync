## 当前理解

附件 9 个 Story 已部分对齐：
- 方案/审批流模板的「适用部门」字段、部门→方案/审批流绑定表、`round` 字段、`PublishChangePanel`、`ChangeLogTab`、`DevSchemeDocsTab`、分类标签、可见性等关键能力**代码中已存在**。
- 但部分 v3（2026-05-21）/ v5（2026-05-20）的细节交互可能尚未完全落地。

因此本次工作是**系统性差异比对 + 增量修正**，而非从零构建。建议按交付价值分 3 个批次推进，每批结束都可以独立验收。

---

## 批次 1 — 需求创建与方案匹配（STORY-003 v3 / STORY-013 v5）

**目标**：「先选部门 → 自动匹配激活方案 → 渲染表单 / 提示无模板」链路对齐文档。

待核对/调整项：
- `RequirementCreatePage`：当前实现是"基于 `MOCK_CURRENT_USER.department_id`"匹配，需改为**用户在创建页内手动选择 `department_id`** 后再触发方案匹配；切换部门重新匹配；未绑定时阻止进入表单。
- 阻止文案与跳转：保留"所选部门没有生效的需求模板"，按钮文案与文档一致。
- 校验：`department_id` 必填、`owner_id` 可空保存草稿。
- "适用部门"在方案构建器中：**激活时必填，保存草稿可留空**；**已被其它激活方案绑定的部门置灰** + tooltip。
- Toast 文案、错误码 `SCHEME_NO_DEPARTMENT` 与 5.2 R-06 对齐。

---

## 批次 2 — 审批流模板 + 审批/评估跳过链路（STORY-016 v5 / STORY-006 v3 / STORY-007 v3）

**目标**：审批流模板"适用部门"行为对齐；提交时按 `requirement.department_id` 查找绑定，未绑定直接跳到「待开发」。

待核对/调整项：
- `ApprovalFlowBuilder`：「适用部门」激活时必填、被其它激活模板绑定的部门置灰、保存时原子同步 `department_approval_flow_binding`。
- 模板列表「激活」按钮校验：审批级 ≥1 / 评估人 ≥1（启用时） / 适用部门 ≥1，错误提示文案对齐。
- 模板列表删除：被部门绑定的激活模板禁用并 hover 提示「该模板被 N 个部门绑定」。
- 需求提交逻辑（`mockData.ts` 中 `submitRequirement`）：
  - 通过 `requirement.department_id → department_approval_flow_binding` 查找模板；
  - 命中 → 写快照、进入 `PENDING_APPROVAL`；
  - 未命中 → 跳过审批和评估，状态直接置 `PENDING_PROJECT`（待开发）。
- 评估侧：若快照中 `assessment_enabled=false` 或无评估人，自动跳过评估。

---

## 批次 3 — 生命周期 / 双步编辑 / 分类 / 可见性（STORY-009 / 014 / 015 / 017 / 018）

**目标**：补齐已有但 v3/v4 细则未完全跟进的部分，并核对可见性。

待核对/调整项：
- **STORY-009**：「待开发 → 开发中」触发器统一为"从需求详情创建首个流程"。当前 `mockData` 中 `linkProject` 会迁移到开发中，需要确认/补充"创建首个流程"路径同样触发；
- **STORY-014**：发布变更弹窗去除 `INFO_ONLY / DEV_IMPACT` 区分（统一 `CHANGE`），`changed_fields` JSONB，FYI 通知不打红点；
- **STORY-015**：开发方案文档上传/删除权限限定关联工作空间成员；上传成功 FYI 通知文案；
- **STORY-017**：创建/编辑表单底部分类区域；存在适用键时提交必选 ≥1；草稿可空；审批后只读；
- **STORY-018**：列表/详情/变更日志/文档查看统一遵循可见性（部门成员 / 部门管理员 / 工作空间成员 / 创建人）。

---

## 文件涉及面（预估）

```
批次 1：
  src/pages/Requirements/RequirementsWorkbench/components/RequirementCreatePage/index.tsx
  src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx
  src/mocks/departmentSchemeBinding.ts
批次 2：
  src/pages/Requirements/ApprovalConfig/index.tsx
  src/pages/Requirements/ApprovalConfig/components/ApprovalFlowBuilder/index.tsx
  src/pages/Requirements/RequirementsWorkbench/mockData.ts
  src/mocks/departmentApprovalFlowBinding.ts
批次 3：
  src/pages/Requirements/RequirementsWorkbench/components/{PublishChangePanel,ChangeLogTab,DevSchemeDocsTab,RequirementDetailDrawer}/...
  src/pages/Requirements/RequirementsWorkbench/mockData.ts
```

---

## 下一步

确认后我会从**批次 1** 开始，每批完成后停下来由你 review，再开下一批。如果你希望某一批优先（或只做某一批），告诉我即可。
