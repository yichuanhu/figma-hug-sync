

# MIXED 协作者展示优化 — 直接分配 + 继承权限双重展示及低权限提醒

## 问题

1. MIXED 协作者（同时拥有直接分配和继承权限）在列表中只显示继承来源，缺少直接分配角色的展示
2. 当用户将直接分配角色设为低于继承角色时（如直接分配观察者，但继承了管理者），final_role 仍为继承角色（MAX 取高），用户修改角色后看不到任何效果，容易困惑

## 交互设计

### 1. MIXED 协作者来源展示

在继承来源列表顶部增加一行"直接分配 → 角色名"，与继承来源视觉一致。MAX 计算说明同时包含直接分配角色。

```text
示例展示：
  直接分配 → 观察者
  继承自流程「订单处理」 → 管理者
  MAX(观察者, 管理者) = 管理者
```

### 2. 低权限提醒交互

当 MIXED 协作者的直接分配角色（`record.role`）低于继承角色（即 `final_role` 由继承决定而非直接分配决定）时：

- 角色下拉框**可正常操作**（修改直接分配角色）
- 角色下拉框下方显示一行**橙色警告提示**："当前直接分配角色低于继承角色，实际生效角色为 {final_role}"
- 用户修改角色后，如果新选的角色仍低于继承角色，提示继续保留；如果新角色高于或等于继承角色，提示消失

这样用户可以清晰看到：修改生效了（直接分配角色确实变了），但最终权限没变（因为 MAX 取的是继承的高权限）。

## 文件变更

| 文件 | 变更 |
|------|------|
| `src/components/CollaboratorManager/CollaboratorTab/index.tsx` | 1. `renderSource` 增加 MIXED 时的直接分配行展示及 MAX 计算包含直接角色；2. 角色列对 MIXED 且直接角色 < 继承角色时，显示橙色警告文案 |
| `src/components/CollaboratorManager/CollaboratorTab/index.less` | 添加警告提示样式 `.collaborator-tab-role-warning` |
| `public/i18n/zh-CN.json` | 新增词条：`collaborator.source.directRole`（"直接分配"）、`collaborator.roleLowerThanInherited`（"当前直接分配角色低于继承角色，实际生效角色为{{role}}"） |
| `public/i18n/en.json` | 对应英文词条 |

## 技术细节

### renderSource 改造

```text
renderSource(record):
  sources = record.inheritance_sources || []
  isMixed = record.source === 'MIXED'

  // MIXED 时即使 sources 为空也要展示直接分配行
  if (sources.length === 0 && !isMixed) return null

  allItems = []
  if (isMixed):
    allItems.push({ label: "直接分配", role: record.role })  // record.role = 直接分配角色
  allItems.push(...sources)  // 继承来源

  // MAX 计算文案：将所有角色（含直接分配）都纳入
  if (allItems.length > 1):
    maxText = MAX(所有角色名) = final_role
```

### 角色列低权限警告逻辑

```text
// 在角色列 render 中，MIXED 协作者额外判断：
if (record.source === 'MIXED'):
  inheritedMaxRole = MAX(inheritance_sources 中所有 role)
  if (PRIORITY[record.role] < PRIORITY[inheritedMaxRole]):
    // 在 Select 下方渲染橙色警告文字
    显示: "当前直接分配角色低于继承角色，实际生效角色为 {final_role}"
```

警告使用 `var(--semi-color-warning)` 颜色，字号 12px，限制最大宽度 200px 以避免撑开列宽。

