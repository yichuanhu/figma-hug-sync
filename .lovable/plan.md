

# 继承来源名称：智能 Tooltip + 角色紧跟布局优化

## 问题

1. 当列宽足够、来源名称已完整展示时，hover 仍弹出 Tooltip，体验冗余
2. 角色字段（→ 管理者）被 `flex-shrink: 0` + `flex: none` 强制右对齐，名称短时中间留白

## 方案

### 1. 智能 Tooltip（仅截断时显示）

将手动 `<Tooltip>` 包裹改为 Semi UI Typography 自带的 `ellipsis={{ showTooltip: true }}`，仅在文字被截断时才自动弹出 Tooltip，未截断时不弹出。

### 2. 角色字段紧跟名称

移除 CSS 中 `.semi-typography:last-child` 的 `flex: none`，改为自然流式排列。角色文字直接跟在来源名称后面，不再撑满右侧。

## 文件变更

| 文件 | 变更 |
|------|------|
| `CollaboratorTab/index.tsx` | 移除外层 `<Tooltip>` 包裹，改用 `<Text ellipsis={{ showTooltip: true }}>` 自带智能 Tooltip；角色 Text 不变 |
| `CollaboratorTab/index.less` | `.&-source-detail-item .semi-typography:last-child` 移除 `flex: none`，保留 `flex-shrink: 0` |

### 技术细节

**TSX 改造（第227-237行）**：
```text
// 改前：手动 Tooltip 包裹
<Tooltip content={sourceName}><Text ellipsis={{ showTooltip: false }}>...</Text></Tooltip>
<Text>→ 角色</Text>

// 改后：Typography 自带 ellipsis tooltip
<Text ellipsis={{ showTooltip: true }}>来源名称</Text>
<Text>→ 角色</Text>
```

**LESS 改造（第92-95行）**：
```less
// 改前
&:last-child {
  flex-shrink: 0;
  flex: none;
}

// 改后
&:last-child {
  flex-shrink: 0;
}
```

这样角色文字不会撑满剩余空间，而是紧跟在来源名称后方。

