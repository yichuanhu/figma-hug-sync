# 流程发布审批 — 实施计划

> 范围：FEAT-025（STORY-001/002/003/004）。底层模型复用 FEAT-017 STORY-016 的 `approval_flow_template` + `department_approval_flow_binding`，通过 `business_type` 区分 `REQUIREMENT` 与 `PROCESS_PUBLISH`。本期为前端 mock 实现，对齐现状的需求审批模板交互一致性。

## 1. 数据层（mock）

- `src/pages/Requirements/ApprovalConfig/mockData.ts`：为 `ApprovalFlowTemplate` 增加 `business_type: 'REQUIREMENT' | 'PROCESS_PUBLISH'`，`fetchApprovalFlows` 增加 `business_type` 过滤；现有数据补默认值 `REQUIREMENT`，新增 3 条 `PROCESS_PUBLISH` 模板。
- `src/mocks/departmentApprovalFlowBinding.ts`：在绑定项加 `business_type` 字段（默认 `REQUIREMENT`），`getBindingByDepartment / setBindingsForTemplate / previewBindingsForTemplate / getOccupiedDepartmentMap` 全部按 `business_type` 命名空间隔离，互不影响。
- 新增 `src/mocks/processVersionApproval.ts`：维护 `process_version` 列表（id、process、version、developer、department、status、submitted_at、approval_template snapshot、current_level、records[]）；导出 `fetchPendingPublishApprovals / approve / reject / submitPublishRequest / fetchVersionApprovalDetail`，含订阅广播。
- 新增 `src/mocks/processLifecycleMilestones.ts`：流程级 `development_completed_at` / `deployed_at` 写入与读取。

## 2. 发布审批模板管理（STORY-001）

- 路由：`/dev-center/publish-approval-templates`、`/builder/:id`、`/detail/:id`。
- 直接复用 `ApprovalConfig` 列表页与 `ApprovalFlowBuilder`，通过 `context = 'PROCESS_PUBLISH'` 控制：
  - 列表页 fetch 时按 `business_type` 过滤；新建/复制/激活/停用/删除均传同一 business_type。
  - Builder 头部隐藏「技术评估人配置」「价值/复杂度模型」（assessment 始终 disabled）。
  - 部门占用提示文案改为「该部门已被发布审批模板【X】绑定」。
- 现有 `ApprovalConfigPage` / `ApprovalFlowBuilderPage` 改为接受 `context` prop（可选，默认 `REQUIREMENT`），便于两套页面共用同一组件。

## 3. 发布审批列表（STORY-002）

- 路由：`/dev-center/publish-approvals`。
- 列表列：流程名称、版本号、开发者（UserNameWithCard）、所属部门、提交时间、状态 Tag、操作（审批/查看详情）。
- 顶部过滤：搜索（流程名/开发者）、部门 FilterPopover、状态 Tabs（待审批/已通过/已拒绝/全部）。
- 详情抽屉 `PublishApprovalDetailDrawer`（`DetailDrawerWrapper` 900px）：
  - 概要、版本信息（version/package_size/checksum）、输入/输出参数、依赖资源、当前审批级 Stepper、审批历史 Timeline。
  - 待审批且当前用户为审批人时显示「通过」「拒绝」按钮；拒绝弹 `RejectReasonDialog`（≤500 字）。
- 通过/拒绝调用 mock service，更新 status，多级审批推进 current_level。

## 4. 流程版本状态与发布申请（STORY-003）

- 在 `ReleaseManagement` 体系中扩展 ReleaseStatus → `UPLOADED | PENDING_APPROVAL | PUBLISHED | REJECTED | FAILED`。
- `ReleaseListPage`：
  - 新增"发布版本"概念（version 表），由 mock 生成 `UPLOADED` 版本若干。
  - 操作列：`UPLOADED` → 显示「发起发布申请」；`PENDING_APPROVAL` → 显示「查看审批」（链接到审批详情）；其它沿用。
  - 状态 Tag 颜色：UPLOADED 灰 / PENDING_APPROVAL 蓝 / PUBLISHED 绿 / REJECTED 红。
- `submitPublishRequest(versionId, note)`：
  1. 查询流程部门 → `getBindingByDepartment(deptId, 'PROCESS_PUBLISH')`；
  2. 命中且 `approval_enabled=true` → 创建审批单（快照 template id），状态 `PENDING_APPROVAL`，写入 `development_completed_at`；
  3. 否则 → 状态 `PUBLISHED`，写入 `development_completed_at` + `deployed_at`。
- 弹窗 `PublishRequestModal`：520px，显示模板预览（无审批/将进入 N 级审批）+ 发布说明 textarea。

## 5. 生命周期里程碑（STORY-004）

- 流程详情 / 列表展示 `development_completed_at`、`deployed_at`、最近上线审核人。
- 审批通过最终 PUBLISHED 时写入 `deployed_at`；首次发起申请时写 `development_completed_at`。
- 不实现手工修正 UI（超出页面级 mock 范围，文档备注后续接入）。

## 6. 导航与路由

- `Sidebar` 「发布管理」组下新增：
  - `publishApprovalTemplates` → `/dev-center/publish-approval-templates`
  - `publishApprovals` → `/dev-center/publish-approvals`
- `App.tsx` 注册新路由；i18n key 在 `zh-CN.json` 与 `en.json` 同步。

## 7. 共享与防退回

- 部门绑定 `business_type` 隔离严格执行：需求审批与发布审批可独立绑定同一部门。
- `ApprovalFlowBuilder` 部门占用计算时仅查同业务类型的激活模板，避免跨业务类型互锁。
- 现有 `/requirements/approval-config` 行为不受影响（默认 `REQUIREMENT`）。

## 8. 技术细节

```text
ApprovalFlowTemplate {
  ...existing,
  business_type: 'REQUIREMENT' | 'PROCESS_PUBLISH',
  applicable_department_ids?: string[],
}

DepartmentApprovalFlowBinding {
  department_id, business_type, approval_flow_template_id, ...
}

ProcessVersionApproval {
  id, version_id, process_id, process_name, version,
  developer_id/name, department_id/name,
  status: 'PENDING_APPROVAL'|'PUBLISHED'|'REJECTED',
  submitted_at, current_level, total_levels,
  approval_template_snapshot, records: [{level, approver, action, comment, at}]
}
```

页面组件均按「文件夹 = 组件」（`index.tsx` + `index.less`）规范，列表页 `Table size="small"` + 外置 `.list-pagination`，详情抽屉沿用 `DetailDrawerWrapper`。

## 9. 不在本期范围

- 后端真实接口、UCI 权限点、数据权限过滤（mock 层假设全员可见）。
- Creator 客户端上传交互（仅以 mock 数据呈现 UPLOADED 版本）。
- 生命周期手工修正与审计日志 UI。
- 通知中心实际投递（仅 Toast 提示）。

确认后即开始实施。