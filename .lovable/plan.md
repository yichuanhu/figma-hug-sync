## 范围修正

之前对发布列表/详情做了过度补齐（多了 `申请状态` 列 + `执行结果` Tab）。本次按用户要求收敛回最小集。

## 1. 列表：只保留一列"当前审批进度"

**文件**：`src/pages/Development/ReleaseManagement/ReleaseListPage/index.tsx`

- **删除**之前新增的 `申请状态` 列（dataIndex=`approval_status`）。
- **保留并重命名**：`当前审批节点` → `当前审批进度`（dataIndex=`current_approver_label`，宽 160）。
  - 渲染逻辑合并状态信息：
    - 终态（已通过/已拒绝/已撤销/执行成功/执行失败）→ 显示对应 Tag（复用 `RELEASE_APPROVAL_STATUS_TAG`）。
    - 进行中（`PENDING_APPROVAL` / `APPROVING`）→ 显示 `current_approver_label`，无则 `第 X / Y 级`。
- 其它列保持原状。

## 2. 详情：删除"执行结果"Tab，保留"审批流程"Tab

**文件**：`src/pages/Development/ReleaseManagement/components/ReleaseDetailDrawer/index.tsx`

- 删除 `renderExecutionTab` 函数及其 `<TabPane itemKey="execution">`。
- 保留：
  - `基本信息`（含申请状态 + 当前审批节点行 — 仍保留在描述列表中）
  - `审批流程`（Timeline）
  - `已发布的流程和资源`
- 不动 mock 数据结构、不动其它组件。

## 不做

- 不改 `ReleaseApplicantExtension` mock 类型（字段仍然存在，只是不再渲染执行 Tab）。
- 不改流程下线（OfflineRequests）相关文件。
- 不改 i18n。

## 文件清单

- `src/pages/Development/ReleaseManagement/ReleaseListPage/index.tsx`
- `src/pages/Development/ReleaseManagement/components/ReleaseDetailDrawer/index.tsx`
