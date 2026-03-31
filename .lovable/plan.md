

## 方案：修复消息中心重复图标 + 统一左侧菜单与右侧子菜单样式

### 问题分析

1. **消息中心图标重复**：`bottomMenuItems` 中定义了 `messageCenter`（第255-257行），通过 `renderBottomMenuItem` 渲染了一次铃铛图标；同时在底部区域（第733-740行）又手动渲染了一个 `IconBellStroked` 铃铛图标，导致两个铃铛同时显示。

2. **左侧菜单样式与右侧子菜单不一致**：左侧 `.sidebar-icon-btn` 使用独立样式（较大内边距、不同字体），右侧详细面板 `.sidebar-menu-content` 使用另一套样式（`padding: 10px 12px`、`border-radius: 6px`），视觉上不统一。

### 改动

#### 1. 修复消息铃铛重复 — `index.tsx`

- **移除** 第692-693行 `bottomMenuItems.filter(item => item.key !== 'notifications').map(renderBottomMenuItem)` 整段（因为 filter 条件 `!== 'notifications'` 不匹配 key `messageCenter`，所以铃铛仍被渲染）
- 底部区域仅保留 `sidebar-bottom-section` 中的头像 + 单个铃铛，铃铛从 `bottomMenuItems` 的消息中心项获取 badge 信息

具体做法：删除 `bottomMenuItems` 的 `map(renderBottomMenuItem)` 调用，底部区域只保留 `sidebar-bottom-section` 中手动渲染的头像和铃铛。

#### 2. 统一菜单项样式 — `index.less`

将左侧 `.sidebar-icon-btn` 的视觉表现与右侧 `.sidebar-menu-content` 对齐：

| 属性 | 当前 `.sidebar-icon-btn` | 对齐到 `.sidebar-menu-content` |
|------|------------------------|-------------------------------|
| padding | `8px 12px` | `10px 12px` |
| border-radius | `8px` | `6px` |
| hover 背景 | `var(--semi-color-fill-1)` | `var(--semi-color-fill-0)` |
| active 背景 | `var(--semi-color-fill-1)` | `var(--semi-color-primary-light-default)` |
| 文字颜色 | `var(--semi-color-text-1)` | `var(--semi-color-text-0)` |
| 图标颜色 | `var(--semi-color-text-2)` | `var(--semi-color-tertiary)` |

同步调整：
- `.sidebar-icon-btn` 的 `border-radius` → `6px`
- hover 背景 → `var(--semi-color-fill-0)`
- active 状态背景 → `var(--semi-color-primary-light-default)`
- `.sidebar-icon-btn-label` 颜色 → `var(--semi-color-text-0)`
- `.sidebar-center-icon` 颜色 → `var(--semi-color-tertiary)`

### 文件变更
- `src/components/layout/Sidebar/index.tsx` — 移除重复铃铛渲染
- `src/components/layout/Sidebar/index.less` — 统一菜单项视觉样式

