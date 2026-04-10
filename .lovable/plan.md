

# 允许重新添加已授权协作者并覆盖角色

## 问题

当前已被授予角色权限的部门和用户，在添加协作者时会被禁用（灰色不可选），无法重新选择。需求是允许重新添加，新角色覆盖旧角色。

## 改动

### 1. CollaboratorAddModal（`src/components/CollaboratorManager/CollaboratorAddModal/index.tsx`）

- 移除 `toggleUser` 中 `if (existingMap.has(user.id)) return` 的拦截逻辑
- 移除 `toggleDept` 中 `if (existingMap.has(dept.id)) return` 的拦截逻辑
- `renderUserItem` 和 `renderDeptItem` 中 `disabled` 改为 `false`，不再根据 `existingMap` 禁用
- 保留已有角色标签作为提示信息（如"已授予: 管理者"），但不阻止选择

### 2. CollaboratorPanel 组织架构视图（`src/components/CollaboratorManager/CollaboratorPanel/index.tsx`）

- 移除 `toggleOrgUser` 中 `if (existingMap.has(user.id)) return` 的拦截
- 移除 `toggleOrgDept` 中 `if (existingMap.has(dept.id)) return` 的拦截
- `renderOrgUserItem` 和 `renderOrgDeptItem` 中 `disabled` 改为 `false`
- 快捷搜索结果中不再过滤已有协作者 ID，使其出现在搜索结果中

### 3. Mock 数据（`src/components/CollaboratorManager/mockData.ts`）

- `searchOrgUsers` 中移除 `!existingCollaboratorIds.includes(u.id)` 过滤，已有协作者可出现在搜索结果中

### 4. 提交逻辑

- `addCollaborators` Mock 函数按 `collaborator_id` 匹配执行 upsert（覆盖），而非拒绝重复

## 改动后行为

- 已授权的用户/部门在添加流程中可正常选择（不再灰色禁用）
- 当前角色仍以标签形式提示（如"已授予: 管理者"）
- 提交后新角色覆盖旧角色

| 文件 | 改动 |
|------|------|
| `CollaboratorAddModal/index.tsx` | 移除禁用逻辑，允许重新选择 |
| `CollaboratorPanel/index.tsx` | 组织架构视图同步移除禁用，搜索不过滤已有协作者 |
| `mockData.ts` | 搜索结果不排除已有协作者，提交逻辑支持覆盖 |

