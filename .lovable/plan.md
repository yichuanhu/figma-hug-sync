

# 修复依赖资源来源显示：名称固定宽度截断，角色始终可见

## 问题

当前在 CollaboratorPanel 中，来源名称和角色被合并在单个 `<Text>` 元素内（L663-664），当名称过长被截断时，角色文字（如 `→ 使用者`）也被一起截断不可见。CollaboratorTab 中虽然分成两个元素，但 flex 7:3 比例在窄空间下角色仍可能被挤压。

## 方案

将来源名称和角色拆分为两个独立元素，名称用固定宽度+ellipsis+tooltip，角色用 `flex-shrink: 0` 保证始终显示。

### 改动

**1. `CollaboratorPanel/index.tsx`（L662-665）**

将合并的单个 `<Text>` 拆为两个：

```tsx
<div key={idx} className="collaborator-panel-source-detail-item">
  <Text size="small" type="tertiary" ellipsis={{ showTooltip: true }} className="source-name">
    {sourceName}
  </Text>
  <Text size="small" type="tertiary" className="source-role">
    → {t(`collaborator.roles.${src.role}`)}
  </Text>
</div>
```

同样处理直接分配行（L651-654）。

**2. `CollaboratorPanel/index.less`（source-detail-item 样式）**

```less
&-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 18px;
  min-width: 0;

  .source-name {
    flex: 1;
    min-width: 0; // 允许 ellipsis 生效
  }
  .source-role {
    flex-shrink: 0;
    white-space: nowrap;
  }
}
```

**3. `CollaboratorTab/index.tsx`（L224-232）**

已是两个元素，保持不变，仅确认 CSS 中 `:last-child` 的 `flex-shrink: 0` 已生效。

**4. `CollaboratorTab/index.less`（L79-99）**

将 `flex: 7` / `flex: 3` 改为：
```less
&:first-child {
  flex: 1;
  min-width: 0;
}
&:last-child {
  flex-shrink: 0;
  white-space: nowrap;
}
```

| 文件 | 改动 |
|------|------|
| `CollaboratorPanel/index.tsx` | 拆分来源名称与角色为独立元素 |
| `CollaboratorPanel/index.less` | 添加 flex 布局，名称可截断，角色不缩 |
| `CollaboratorTab/index.less` | flex 7:3 改为 flex:1 + shrink:0 |

