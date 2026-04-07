

# 优化协作者权限提示交互

## 推荐方案：统一气泡卡片，按时机提示

核心思路：**不做持久化警告展示**，只在用户操作的关键节点通过气泡卡片告知。

### 交互设计

#### 1. 继承协作者「添加为协作者」气泡卡片 — 增加权限说明

在现有的继承协作者 Popover 气泡卡片中（参考用户截图），在"添加为协作者"按钮上方增加一行说明文案：

```text
继承权限不可修改，如需调整角色，请将
此用户直接添加为当前资产的协作者
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
提示：若直接分配的角色低于继承角色，
实际生效角色仍为继承的最高权限
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
      [ 添加为协作者 ]
```

提示行使用次要文字色（tertiary），让用户在添加前就知道权限合并规则。

#### 2. MIXED 协作者修改角色时 — Toast 提示替代持久警告

移除当前角色下拉框下方的橙色持久警告。改为：当用户修改 MIXED 协作者的直接分配角色后，如果新角色仍低于继承角色，通过 **Toast.warning** 提示：

> "直接分配角色已更新为「观察者」，但实际生效角色仍为继承的「管理者」（取最高权限）"

如果新角色高于或等于继承角色，则正常显示 Toast.success。

这样：
- 列表视觉干净，无冗余警告
- 用户在修改时能明确知道修改生效了、但最终权限没变
- 在添加前就已被告知规则，修改后再次确认，形成完整认知闭环

## 文件变更

| 文件 | 变更 |
|------|------|
| `src/components/CollaboratorManager/CollaboratorTab/index.tsx` | 1. 继承协作者 Popover 增加权限合并规则提示文案；2. 移除 MIXED 低权限的持久橙色警告；3. `handleRoleChange` 中增加判断：MIXED 且新角色 < 继承角色时用 Toast.warning 替代 Toast.success |
| `src/components/CollaboratorManager/CollaboratorTab/index.less` | 移除 `.collaborator-tab-role-warning` 样式 |
| `public/i18n/zh-CN.json` | 修改词条：`collaborator.inheritedRoleHint` 增加权限合并提示；新增 `collaborator.roleLowerWarningToast`（"直接分配角色已更新为「{{directRole}}」，但实际生效角色仍为继承的「{{inheritedRole}}」（取最高权限）"） |
| `public/i18n/en.json` | 对应英文词条 |

## 技术细节

### handleRoleChange 改造

```text
handleRoleChange(record, newRole):
  执行角色更新...
  
  if (record.source === 'MIXED'):
    inheritedMaxRole = MAX(inheritance_sources)
    if (PRIORITY[newRole] < PRIORITY[inheritedMaxRole]):
      Toast.warning(t('collaborator.roleLowerWarningToast', {
        directRole: t(roles.newRole),
        inheritedRole: t(roles.inheritedMaxRole)
      }))
      return
  
  Toast.success(正常成功提示)
```

### 角色列渲染简化

移除 `showRoleWarning` 相关逻辑和 `.collaborator-tab-role-warning` 的 JSX 渲染，MIXED 协作者直接返回可编辑的 selectEl。

