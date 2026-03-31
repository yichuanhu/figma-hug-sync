

## 方案：主菜单与子菜单展开收起隔离 + 飞书风格收起样式

### 问题分析

1. **耦合问题**：当前 `collapsed` 状态同时控制主菜单（180px→64px）和右侧子菜单面板（显示/隐藏）。点击子菜单的 LayoutIcon 按钮会触发 `onToggleCollapse`，导致主菜单也一起收起。
2. **收起样式**：参考飞书截图（image-103），收起时每个菜单项应显示为图标+小号文字纵向排列（不是完全隐藏文字）。

### 改动范围

#### 1. 状态隔离 — `AppLayout/index.tsx`

新增独立的 `detailPanelVisible` 状态，与 `collapsed`（主菜单）互不影响：

```text
collapsed        → 控制左侧主菜单宽度（180px ↔ 64px）
detailPanelVisible → 控制右侧子菜单面板（220px 显示/隐藏）
```

- `collapsed` 由拖拽手柄控制
- `detailPanelVisible` 由子菜单面板 header 的 LayoutIcon 按钮控制
- 两者新增独立的 toggle 回调传给 `Sidebar`

#### 2. Sidebar Props 扩展 — `Sidebar/index.tsx`

新增 props：
- `detailPanelVisible: boolean`
- `onToggleDetailPanel?: () => void`

改动逻辑：
- **子菜单面板显示条件**：从 `!collapsed && currentCenterMenu.length > 0` 改为 `detailPanelVisible && currentCenterMenu.length > 0`（不再依赖 collapsed）
- **子菜单 header 的 LayoutIcon**：调用 `onToggleDetailPanel` 而非 `onToggleCollapse`
- **浮动菜单的 LayoutIcon**（收起态 hover）：调用 `onToggleDetailPanel`（展开子菜单面板），不影响主菜单
- **主菜单 center 点击**：移除 `if (collapsed) onToggleCollapse?.()` 逻辑（第452-454行），点击时仅导航，不自动展开主菜单

#### 3. 收起态样式调整 — `Sidebar/index.less`

参考飞书收起态（image-103），`.sidebar-icon-bar.collapsed` 内：

```less
.sidebar-icon-btn {
  width: 52px;
  flex-direction: column;    // 图标在上、文字在下
  justify-content: center;
  align-items: center;
  padding: 6px 4px 4px;
  gap: 2px;
}

.sidebar-icon-btn-label {
  display: block;           // 收起时也显示文字（当前是隐藏的）
  font-size: 11px;
  line-height: 14px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 56px;
}

.sidebar-center-icon {
  margin: 0;
}
```

同时调整 `.sidebar-logo`：收起时居中显示，隐藏产品名称（已有）。

#### 4. AppLayout 宽度适配 — `AppLayout/index.less`

`.app-layout-sidebar` 在主菜单收起但子菜单展开时，宽度需适配：

```less
// 主菜单收起(64px) + 子菜单展开(220px) 的场景
&.collapsed-with-detail {
  width: auto;
}
```

### 文件变更清单

| 文件 | 改动 |
|------|------|
| `AppLayout/index.tsx` | 新增 `detailPanelVisible` 状态和 toggle，传给 Sidebar |
| `Sidebar/index.tsx` | 新增 props，隔离子菜单面板和主菜单的展开/收起逻辑 |
| `Sidebar/index.less` | 收起态 `.sidebar-icon-btn` 改为纵向布局、显示小号文字 |
| `AppLayout/index.less` | 适配 collapsed + detail panel 组合宽度 |

### 交互逻辑总结

```text
拖拽主菜单右边缘 → 仅切换主菜单宽度（180px ↔ 64px）
点击子菜单 LayoutIcon → 仅切换子菜单面板显示/隐藏
点击主菜单中心项 → 导航到对应页面，不改变任何展开/收起状态
收起态 hover 浮动菜单的展开按钮 → 仅展开子菜单面板
```

