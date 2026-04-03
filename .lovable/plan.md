

# 为继承协作者添加「快速添加」交互

## 需求

当前继承权限的协作者，Tooltip 提示"请将此用户直接添加为当前资产的协作者"，但没有实际操作入口。需要增加一个快速操作，让用户可以一键将继承协作者添加为当前资产的直接协作者。

## 实现方案

### 交互设计

在继承协作者的角色列，Tooltip 提示文案末尾增加一个可点击的「添加为协作者」链接按钮。点击后：
1. 以继承的 final_role 作为默认角色，直接将该用户添加为当前资产的直接协作者
2. 添加成功后刷新列表，该协作者变为 MIXED 类型（同时拥有直接权限和继承权限），角色下拉变为可编辑
3. 显示成功提示

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/components/CollaboratorManager/CollaboratorTab/index.tsx` | 增加 `handleQuickAdd` 方法；修改继承协作者角色列渲染，将 Tooltip 替换为包含操作链接的交互 |
| `src/components/CollaboratorManager/CollaboratorTab/index.less` | 添加快速添加链接样式 |
| `src/components/CollaboratorManager/mockData.ts` | `addCollaborators` 方法支持将已有继承协作者升级为 MIXED 类型 |
| `public/i18n/zh-CN.json` | 添加词条：`collaborator.actions.quickAdd`（"添加为协作者"）、`collaborator.quickAddSuccess`（"已添加为当前资产的直接协作者"） |
| `public/i18n/en.json` | 对应英文词条 |

### 技术细节

**CollaboratorTab 角色列渲染改造**：对纯继承协作者（`isInherited && !record.is_owner`），在角色 Select 下方渲染一个文字链接「添加为协作者」，点击后调用 `handleQuickAdd`。

**handleQuickAdd 逻辑**：
```text
1. 调用 mockData 的 addCollaborators，传入 collaborator_id/name/type 和 final_role
2. 刷新列表数据
3. Toast 提示成功
```

**mockData 升级处理**：在 `addCollaborators` 中检测如果该用户已存在且为 INHERITED，则将 source 改为 MIXED，增加直接权限记录，重新计算 final_role。

