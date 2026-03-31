

## 方案：修复重复图标 + 飞书风格菜单样式精调

### 问题

1. **图标重复**：`renderIconMenuItem` 中第489-490行，`sidebar-center-icon` 渲染了两次 `{item.icon}`
2. **展开/收起样式与飞书不一致**：间距、高度、选中样式需要精确对齐飞书截图

### 改动

#### 1. 删除重复图标 — `Sidebar/index.tsx`（第490行）

删除第490行 `<span className="sidebar-center-icon">{item.icon}</span>`，仅保留第489行的一个。

#### 2. 飞书风格样式精调 — `Sidebar/index.less`

参照截图（image-104），对展开态和收起态进行精确调整：

**展开态 `.sidebar-icon-btn`**：
| 属性 | 当前值 | 飞书风格 |
|------|--------|----------|
| min-height | 40px | 36px |
| padding | 10px 12px | 8px 12px |
| gap | 10px | 8px |
| margin-bottom | 2px | 0 |
| border-radius | 6px | 8px |

**展开态 `.sidebar-icon-btn-label`**：
- font-size: 14px（不变）
- font-weight: 400（普通态），选中态 500

**展开态选中态 `.sidebar-icon-btn.active`**：
| 属性 | 当前值 | 飞书风格 |
|------|--------|----------|
| background | primary-light-default | `rgba(31, 35, 41, 0.08)` 浅灰底 |
| label color | primary 蓝色 | `var(--semi-color-text-0)` 黑色 |
| font-weight | 600 | 500 |
| 左侧指示条 | 无 | 3px 蓝色竖条（左边缘） |

飞书选中态使用左侧蓝色竖条指示，而非蓝色背景+蓝字。通过 `::before` 伪元素实现：
```less
&.active {
  background-color: var(--semi-color-fill-0);
  position: relative;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6px;
    bottom: 6px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background-color: var(--semi-color-primary);
  }
  .sidebar-icon-btn-label {
    color: var(--semi-color-text-0);
    font-weight: 500;
  }
}
```

**收起态 `.sidebar-icon-bar.collapsed .sidebar-icon-btn`**：
| 属性 | 当前值 | 飞书风格 |
|------|--------|----------|
| width | 52px | 56px |
| padding | 6px 4px 4px | 8px 4px 4px |
| gap | 2px | 2px（不变） |
| border-radius | 6px（继承） | 8px |

收起态选中项同样用左侧蓝色竖条（或底部短横条），不用蓝色背景。

**图标颜色统一**：
- 普通态：`var(--semi-color-text-2)` 灰色
- 选中态：`var(--semi-color-text-0)` 深色（飞书选中图标不变蓝）

### 文件变更

| 文件 | 改动 |
|------|------|
| `Sidebar/index.tsx` | 删除第490行重复的 `sidebar-center-icon` |
| `Sidebar/index.less` | 调整展开/收起态间距、选中样式为飞书风格（灰底+蓝色左侧指示条） |

