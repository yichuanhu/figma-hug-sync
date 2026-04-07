

# 优化「添加为协作者」交互 — 点击后弹出角色选择下拉

## 问题

当前点击"添加为协作者"按钮后，直接以继承的 `final_role` 添加，用户无法选择角色。

## 方案

将"添加为协作者"按钮改为两步交互：点击按钮后，按钮区域替换为角色选择下拉菜单（复用 `CollaboratorRoleSelect`），用户选择角色后执行添加。

### 交互流程

```text
初始状态（Popover 内）:
  继承权限不可修改...
  提示: 若直接分配的角色低于继承角色...
  ┌──────────────────┐
  │   添加为协作者    │
  └──────────────────┘

点击按钮后（Popover 内原地替换）:
  继承权限不可修改...
  提示: 若直接分配的角色低于继承角色...
  ┌─ 请选择角色 ─────┐
  │ 管理者            │  ← 角色下拉自动展开
  │ 编辑者            │
  │ 使用者            │
  │ 观察者            │
  └──────────────────┘
```

### 文件变更

| 文件 | 变更 |
|------|------|
| `CollaboratorTab/index.tsx` | Popover 内增加状态管理，点击按钮后切换为 `CollaboratorRoleSelect`；选择角色后调用 `handleQuickAdd` 并传入所选角色 |

### 技术细节

1. **新增状态** `quickAddingId`：记录当前正在选择角色的协作者 ID，初始为 `null`

2. **Popover 内容改造**（第325-344行）：
   - 当 `quickAddingId !== record.id` 时，显示原按钮
   - 当 `quickAddingId === record.id` 时，将按钮替换为 `CollaboratorRoleSelect`（不传 `value`，使用 `defaultOpen` 自动展开下拉）
   - 选择角色后调用 `handleQuickAdd(record, selectedRole)` 并重置 `quickAddingId`

3. **修改 `handleQuickAdd`**：增加 `role` 参数，不再默认使用 `record.final_role`，改为使用用户选择的角色

4. **Popover 关闭时**：重置 `quickAddingId = null`，确保下次打开回到初始状态

