

## 方案：为菜单项展开收起添加淡入淡出过渡动画

### 改动

#### 1. `Sidebar/index.less` — 添加过渡动画样式

**文字标签过渡**：为 `.sidebar-icon-btn-label` 添加 `opacity` 和 `max-width` 过渡，展开时淡入，收起时淡出：

```less
.sidebar-icon-btn-label {
  transition: opacity 0.2s ease, max-width 0.2s ease;
  opacity: 1;
  max-width: 120px;
}

// 收起态下标签样式已有独立定义（11px竖排），为其添加淡入效果
.sidebar-icon-bar.collapsed .sidebar-icon-btn-label {
  animation: fadeIn 0.2s ease;
}
```

**Logo 标题过渡**：`.sidebar-logo-title` 添加 `opacity` 过渡，收起时隐藏需淡出。

**底部区域过渡**：`.sidebar-bottom-section` 添加 `transition: all 0.25s ease` 使布局切换（row↔column）时更平滑。

**Detail panel 过渡**：`.sidebar-detail-panel` 添加 `transition: width 0.25s ease, opacity 0.2s ease`。

#### 2. `Sidebar/index.less` — 添加 fadeIn keyframe

```less
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### 3. `Sidebar/index.tsx` — 展开态标签始终渲染

当前 `renderBottomMenuItem` 中用 `{!collapsed && <span>}` 条件渲染标签，改为始终渲染但通过 CSS 控制可见性，以实现过渡动画：

```tsx
// 改为始终渲染，收起态由 CSS 的 .collapsed 样式控制（已有11px竖排样式）
<span className="sidebar-icon-btn-label">{label}</span>
```

### 文件变更

| 文件 | 改动 |
|------|------|
| `Sidebar/index.less` | 添加 fadeIn keyframe、标签/logo/底部区域/detail panel 过渡动画 |
| `Sidebar/index.tsx` | 底部菜单标签改为始终渲染，由 CSS 控制显隐过渡 |

