

## 方案：完整重构主菜单（sidebar-icon-bar）样式

### 飞书参考样式总结

**展开态（180px）**：
- 菜单项：图标(20px) + 文字(14px) 水平排列，`gap: 8px`
- 内边距：`padding: 8px 12px`，`border-radius: 8px`
- 普通态：文字 `var(--semi-color-text-0)`，图标 `var(--semi-color-text-2)`，`font-weight: 500`
- hover：`var(--semi-color-fill-0)` 背景
- **选中态**：**`var(--semi-color-bg-0)` 白色背景**，文字和图标颜色不变，`font-weight: 600`
- 无任何 `::before` 指示条
- 底部：头像(左) + 铃铛(右) 水平排列

**收起态（64px）**：
- 菜单项：图标在上 + 11px文字在下，纵向排列居中
- 宽度 56px，`padding: 8px 4px 4px`，`border-radius: 8px`
- **选中态**：同样 `var(--semi-color-bg-0)` 白色背景，文字/图标颜色不变
- 底部：**铃铛为白色圆形按钮**（32px直径、`border-radius: 50%`、`var(--semi-color-bg-0)` 背景），位于头像上方，间距 `16px`
- Logo 居中，隐藏产品名称

### 改动

#### 重写 `src/components/layout/Sidebar/index.less`

**1. 展开态选中样式（第 277-288 行）**：

```less
&.active {
  background-color: var(--semi-color-bg-0);

  .sidebar-icon-btn-label {
    font-weight: 600;
    // 不覆盖颜色，继承普通态
  }

  // 移除 .sidebar-center-icon 蓝色覆盖
}
```

**2. 收起态（第 19-67 行）**：

```less
&.collapsed {
  width: 64px;
  padding: 0 4px 12px 4px;
  align-items: center;

  .sidebar-icon-btn {
    width: 56px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 4px 4px;
    gap: 2px;
    border-radius: 8px;

    &.active {
      background-color: var(--semi-color-bg-0);
    }
  }

  .sidebar-icon-btn-label {
    display: block;
    font-size: 11px;
    line-height: 14px;
    text-align: center;
    max-width: 56px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-center-icon { margin: 0; }

  .sidebar-logo {
    width: 64px;
    justify-content: center;
    padding-left: 0;
  }

  .sidebar-bottom-section {
    flex-direction: column;
    align-items: center;
    gap: 16px;

    .sidebar-bottom-bell {
      order: -1;

      .sidebar-icon-btn-small {
        width: 32px;
        height: 32px;
        background-color: var(--semi-color-bg-0);
        border-radius: 50%;
      }
    }
  }
}
```

### 变更汇总

| 属性 | 之前 | 之后 |
|------|------|------|
| 选中态背景 | `var(--semi-color-primary-light-default)` | `var(--semi-color-bg-0)` |
| 选中态文字色 | `var(--semi-color-primary)` 蓝色 | 不变（继承普通态） |
| 选中态图标色 | `var(--semi-color-primary)` 蓝色 | 不变（继承普通态） |
| 收起态底部间距 | `gap: 4px` | `gap: 16px` |
| 收起态铃铛样式 | 方形28px | 圆形白底32px `var(--semi-color-bg-0)` |

### 文件变更

| 文件 | 改动 |
|------|------|
| `Sidebar/index.less` | 重写选中态背景为 `var(--semi-color-bg-0)`、移除蓝色覆盖、收起态铃铛圆形白底、间距16px |

