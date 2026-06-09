## 目标

把所有详情页（详情抽屉 Drawer）的"所属部门"字段，从只展示叶子节点名称（如 `Frontend Development Team`），改为展示从根到该部门的完整链路（如 `Laiye Technology / R&D Center / APA Product Division / Frontend Development Team`）。

## 方案

### 1. 在 `src/mocks/departmentData.ts` 新增工具

- 新增 `getDepartmentPath(id, options?)`：基于 `departmentTree` 计算 id 到根的祖先链路，返回 `string[]`。
- 新增 `formatDepartmentPath(id, { separator = ' / ', includeRoot = true })`：返回拼好的字符串，找不到时回退到 `getDepartmentName(id)`。
- 内部用一次 DFS 建立 `id -> ancestors[]` 缓存，避免每次遍历。

### 2. 新增展示组件 `src/components/DepartmentPath/index.tsx`

- Props：`departmentId?: string | null`、`separator?: string`（默认 ` / `）、`includeRoot?: boolean`（默认 `true`，可按后续需要关掉最顶层"来也科技"）。
- 渲染：
  - 单行展示，使用 `Typography.Text ellipsis={{ showTooltip: { opts: { content: <完整链路> } } }}`，遵循[Smart Tooltip Standard]，避免抽屉宽度不够时换行。
  - 分隔符以 `var(--semi-color-text-2)` 弱化，叶子节点用主色。
- 找不到部门时回退到 `getDepartmentName` 的原值。

### 3. 替换所有详情抽屉里的部门展示

将以下详情抽屉中"所属部门" `Descriptions.Item` 的 value，由 `getDepartmentName(xxx.owning_department_id)` 替换为 `<DepartmentPath departmentId={xxx.owning_department_id} />`：

- `ProcessManagement/.../ProcessDetailDrawer`
- `QueueManagement/.../QueueDetailDrawer`
- `CredentialManagement/.../CredentialDetailDrawer`
- `ParameterManagement/.../ParameterDetailDrawer`
- `FileManagement/.../FileDetailDrawer`
- `Scheduling/WorkerManagement/.../WorkerDetailDrawer`
- `Scheduling/WorkerManagement/WorkerGroupManagement/.../WorkerGroupDetailDrawer`
- `Scheduling/TaskManagement/.../TaskDetailDrawer`
- `Scheduling/TemplateManagement/.../TemplateDetailDrawer`
- `Scheduling/AutoExecutionPolicy/.../TimeTriggerDetailDrawer`
- `Scheduling/AutoExecutionPolicy/.../QueueTriggerDetailDrawer`
- `Requirements/ApprovalConfig/.../ApprovalFlowDetailDrawer`
- `Requirements/RequirementsScheme/.../SchemeDetailDrawer`

### 4. 不修改的位置（保持现状）

- 表单/选择器中的部门字段（`DepartmentSelect`、`OwnerSelect`、`DepartmentPicker`）：已有 TreeSelect 带层级，不需要再叠加链路。
- 列表 Table 中的"所属部门"列：默认仍展示叶子名（链路过长不适合表格列）。如后续需要再单独处理。
- mock 文件（`processVersionApproval.ts`、`processOfflineApproval.ts`）中用于审批文本的拼接：保持不变。

如需把表格列也改成链路展示，请在确认后追加。

## 技术细节

```ts
// departmentData.ts
const pathCache = new Map<string, string[]>();

function buildCache() {
  const walk = (nodes: DeptTreeNode[], trail: string[]) => {
    for (const n of nodes) {
      const next = [...trail, n.label];
      pathCache.set(n.value, next);
      if (n.children) walk(n.children, next);
    }
  };
  walk(departmentTree, []);
}
buildCache();

export const getDepartmentPath = (id?: string | null): string[] => {
  if (!id) return [];
  return pathCache.get(id) ?? [departmentNameMap[id] ?? id];
};

export const formatDepartmentPath = (
  id?: string | null,
  opts: { separator?: string; includeRoot?: boolean } = {},
) => {
  const { separator = ' / ', includeRoot = true } = opts;
  const path = getDepartmentPath(id);
  const arr = includeRoot ? path : path.slice(1);
  return arr.length ? arr.join(separator) : '-';
};
```

```tsx
// DepartmentPath/index.tsx
const DepartmentPath = ({ departmentId, separator = ' / ', includeRoot = true }) => {
  const text = formatDepartmentPath(departmentId, { separator, includeRoot });
  return (
    <Typography.Text ellipsis={{ showTooltip: { opts: { content: text } } }}>
      {text}
    </Typography.Text>
  );
};
```

## 待确认

1. 最顶层 "Laiye Technology" 是否需要展示？默认会展示。
2. 分隔符使用 ` / `，是否需要改为 ` > ` 或 ` · `？
