

# 背景色变量统一修改计划

将菜单面板和内容卡片的背景色从 `var(--semi-color-bg-0)` 改为 `var(--semi-color-default)`。

## 变更内容

### 1. 侧边栏菜单面板 (`src/components/layout/Sidebar/index.less`)
- **第229行** `.sidebar-floating-menu`：`var(--semi-color-bg-0)` → `var(--semi-color-default)`
- **第271行** `.sidebar-detail-panel`：`var(--semi-color-bg-0)` → `var(--semi-color-default)`

### 2. 内容卡片 (`src/components/layout/AppLayout/index.less`)
- **第40行** `.app-layout-content-card`：`var(--semi-color-bg-0)` → `var(--semi-color-default)`

共修改 2 个文件、3 处。

