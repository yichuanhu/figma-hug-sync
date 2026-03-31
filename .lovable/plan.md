

## 方案：飞书风格菜单选中样式重构 + 头像区域优化

### 问题分析

对比飞书截图与当前实现：

1. **选中样式错误**：当前使用灰色背景 + 左侧蓝色竖条指示器（`::before`），飞书实际是**浅蓝背景 + 蓝色文字/图标**，无任何指示条
2. **收起态选中样式**：当前有底部蓝色横条，飞书同样是浅蓝背景 + 蓝色文字，无横条
3. **头像区域**：需参考飞书的头像 + 右侧按钮布局（展开态并排，收起态上下排列）

### 改动

#### 1. 移除蓝色指示条 + 飞书选中样式 — `index.less`

**展开态 `.sidebar-icon-btn.active`**：
- 删除 `&::before` 伪元素（蓝色左侧竖条）
- 背景改为 `var(--semi-color-primary-light-default)`（浅蓝）
- 文字颜色改为 `var(--semi-color-primary)`（蓝色）
- 图标颜色改为 `var(--semi-color-primary)`（蓝色）
- `font-weight: 600`

**收起态 `.sidebar-icon-bar.collapsed .sidebar-icon-btn.active`**：
- 删除 `&::before` 底部横条样式
- 同样使用浅蓝背景 + 蓝色文字/图标

**普通态**：
- 文字颜色 `var(--semi-color-text-1)`（略深灰），非选中时更轻
- 图标颜色 `var(--semi-color-text-2)`

#### 2. 头像与铃铛区域 — `index.tsx` + `index.less`

参考飞书：展开时头像在左、铃铛在右（已有），确保样式对齐。收起时头像在上、铃铛在下（已有），确认间距。

当前逻辑已基本正确，微调 `.sidebar-bottom-section` 样式使之更贴近飞书：
- 展开态：`padding: 12px`，头像和铃铛垂直居中对齐
- 收起态：居中堆叠，`gap: 8px`

### 具体样式变更（`index.less`）

```less
// 展开态选中
.sidebar-icon-btn {
  &.active {
    background-color: var(--semi-color-primary-light-default);
    // 删除整个 &::before 块

    .sidebar-icon-btn-label {
      color: var(--semi-color-primary);
      font-weight: 600;
    }
    .sidebar-center-icon {
      color: var(--semi-color-primary);
    }
  }
}

// 收起态选中 - 删除 &.active::before 块
.sidebar-icon-bar.collapsed {
  .sidebar-icon-btn {
    // 移除 &.active::before { ... } 整段
  }
}
```

### 文件变更

| 文件 | 改动 |
|------|------|
| `Sidebar/index.less` | 移除 `::before` 指示条，改用飞书风格浅蓝背景+蓝色文字选中态 |

