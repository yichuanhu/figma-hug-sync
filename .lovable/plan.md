

# 优化继承来源展示 — 按角色优先级排序 + 限制前3条 + MAX说明优化

## 变更内容

### 1. 继承来源按角色优先级降序排列

在 `renderSource` 中，对 `inheritance_sources` 按 `COLLABORATOR_ROLE_PRIORITY` 从高到低排序，确保最高权限来源展示在最前面。

### 2. 展示上限为前3条

- 折叠时：显示排序后的第1条（最高权限来源）
- 展开时：显示排序后的前3条
- 超过3条时，底部显示「还有 N 条继承来源」

### 3. MAX 计算文案优化

将 `MAX(使用者, 管理者) = 管理者` 替换为自然语言：

```text
中文：最终生效角色：管理者（取所有来源中的最高权限）
英文：Effective role: Manager (highest permission across all sources)
```

## 文件变更

| 文件 | 变更 |
|------|------|
| `src/components/CollaboratorManager/CollaboratorTab/index.tsx` | `renderSource` 中：1. sources 按 PRIORITY 降序排序；2. 展示上限改为3条；3. maxCalcText 改为自然语言 |
| `public/i18n/zh-CN.json` | 新增 `collaborator.source.effectiveRole`："最终生效角色：{{role}}（取所有来源中的最高权限）"；修改 `collaborator.source.inheritedFromCount` 为 "还有 {{count}} 条继承来源" |
| `public/i18n/en.json` | 对应英文词条 |

## 技术细节

### renderSource 改造

```text
renderSource(record):
  // 1. 按角色优先级降序排序
  sortedSources = [...sources].sort(
    (a, b) => PRIORITY[b.role] - PRIORITY[a.role]
  )

  // 2. 最多展示前3条
  topSources = sortedSources.slice(0, 3)
  remainCount = Math.max(0, sortedSources.length - 3)

  // 3. 折叠/展开逻辑
  inheritedItems = isExpanded ? topSources : topSources.slice(0, 1)

  // 4. 自然语言替代 MAX 公式（多于1个来源时展示）
  effectiveText = t('collaborator.source.effectiveRole', {
    role: t(`collaborator.roles.${record.final_role}`)
  })

  // 5. 展开时底部：
  //    - 若 remainCount > 0: 显示「还有 N 条继承来源」
  //    - 显示 effectiveText
```

### 展开/收起触发条件

当 `topSources.length > 1` 时（即排序后前3条中有多条）才显示展开/收起按钮，与现有交互一致。

