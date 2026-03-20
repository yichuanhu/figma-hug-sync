

## 侧边栏拖拽调整宽度功能

### 概述
在侧边栏展开状态下，允许用户通过拖拽右边缘来调整详细菜单面板的宽度，类似飞书的交互体验。

### 实现方案

**1. AppLayout 添加拖拽宽度状态**
- 新增 `sidebarWidth` state（默认 220px，即当前 detail panel 宽度）
- 设置最小宽度 160px，最大宽度 400px
- 将宽度通过 props 传递给 Sidebar 组件

**2. Sidebar 组件添加拖拽手柄**
- 在 `sidebar-detail-panel` 右边缘添加一个 4px 宽的拖拽区域
- 鼠标悬停时显示 `col-resize` 光标
- 悬停时显示一条细线作为视觉提示

**3. 拖拽交互逻辑**
- `mousedown` 启动拖拽，记录起始位置
- `mousemove` 计算宽度差值，实时更新面板宽度（clamp 在 min/max 范围内）
- `mouseup` 结束拖拽
- 拖拽期间给 body 添加 `user-select: none` 防止文字选中

**4. 样式调整**
- `sidebar-detail-panel` 宽度改为动态值（通过 inline style）
- 添加拖拽手柄样式（`.sidebar-resize-handle`）
- 拖拽手柄定位在面板右边缘，hover 时显示蓝色竖线

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/components/layout/AppLayout/index.tsx` | 添加 `sidebarWidth` state，传递给 Sidebar |
| `src/components/layout/Sidebar/index.tsx` | 接收 `panelWidth` prop，添加拖拽手柄和 mousedown/move/up 逻辑 |
| `src/components/layout/Sidebar/index.less` | 添加 `.sidebar-resize-handle` 样式，`sidebar-detail-panel` 宽度改为可变 |

