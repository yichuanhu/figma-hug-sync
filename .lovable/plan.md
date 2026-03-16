

## 视觉优化方案：各中心页面与首页风格统一

### 问题分析
首页使用了丰富的渐变色、毛玻璃风格图标和各中心主题色（蓝、绿、青、紫、金），但进入子页面后，侧边栏菜单图标全部为灰色单色（Lucide 默认），内容区域也是纯白底，视觉上显得单调、缺乏品牌连贯性。

### 改进方案

#### 1. 侧边栏菜单图标着色
为每个中心的二级菜单图标赋予对应的主题色：

| 中心 | 主题色 |
|------|--------|
| 开发中心 | `#4FBE31`（绿） |
| 调度中心 | `#4FC1CE`（青） |
| 运营中心 | `#CA6DFF`（紫） |
| 需求中心 | `#165DFF`（蓝） |
| 运维中心 | `#B1A00F`（金） |

在 `Sidebar/index.less` 中，为 `.sidebar-detail-panel` 添加各中心的修饰类（如 `.center-development`），使 `.sidebar-menu-icon` 继承对应颜色。

#### 2. 选中菜单项的主题色背景
将当前选中项的背景从灰色 `var(--semi-color-fill-1)` 改为对应中心主题色的低透明度底色（如 `rgba(79, 190, 49, 0.10)`），让选中状态更有辨识度。

#### 3. 内容区顶部渐变点缀
在 `AppLayout` 的 `.app-layout-content-card` 顶部添加一条极淡的主题色渐变（通过 `::before` 伪元素），高度约 3px，与侧边栏颜色呼应，增加页面的"温度"。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/layout/Sidebar/index.tsx` | 给 `.sidebar-detail-panel` 添加中心修饰类名 |
| `src/components/layout/Sidebar/index.less` | 添加各中心图标色、选中态背景色规则 |
| `src/components/layout/AppLayout/index.tsx` | 根据当前路由传递中心 CSS 变量 |
| `src/components/layout/AppLayout/index.less` | 添加顶部渐变伪元素样式 |

