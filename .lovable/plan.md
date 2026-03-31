

## 方案：Logo 区域添加产品名称

### 改动

#### 1. `src/components/layout/Sidebar/index.tsx`（第645-647行）

Logo 区域添加产品名称文字，收起时隐藏：

```tsx
<div className="sidebar-logo">
  <img src={laiyeLogo} alt="Laiye" className="sidebar-logo-img" />
  {!collapsed && <span className="sidebar-logo-title">数字员工平台</span>}
</div>
```

#### 2. `src/components/layout/Sidebar/index.less`

在 `.sidebar-logo` 下新增 `.sidebar-logo-title` 样式：

```less
.sidebar-logo-title {
  margin-left: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--semi-color-text-0);
  white-space: nowrap;
}
```

收起状态下 `.sidebar-logo` 居中显示（已有 `collapsed` 规则，确认 `justify-content: center` 和 `padding: 0`）。

### 影响范围
仅 Logo 区域，不影响菜单逻辑和其他布局。

