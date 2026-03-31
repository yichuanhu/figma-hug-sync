

## 方案：侧边栏改版为飞书风格横排布局

### 问题
当前侧边栏图标栏宽度68px，图标在上、文字在下纵向排列，使用彩色渐变SVG图标。需改为飞书风格：图标和文字横排并列，使用线性图标，增加整体宽度。

### 参考分析
飞书左侧菜单特征：
- 宽度约200px，图标+文字水平排列
- 线性（outline）风格图标，统一颜色
- 每项高度约40px，左侧图标+右侧文字，间距约10px
- 选中项背景高亮，文字加粗
- 整体简洁、紧凑

### 改动范围

#### 1. 替换中心图标为 Lucide 线性图标
**文件**：`src/components/layout/Sidebar/index.tsx`

移除7个 `?raw` SVG 导入，改用 Lucide React 图标：

| 中心 | Lucide 图标 |
|------|------------|
| 首页 | `Home` |
| 需求中心 | `ClipboardList` |
| 开发中心 | `Code` |
| 调度中心 | `CalendarClock` |
| 运营中心 | `BarChart3` |
| 共享中心 | `Share2` |
| 运维中心 | `Wrench` |

统一 `size={20} strokeWidth={2}`。

#### 2. 修改图标栏渲染为横排
**文件**：`src/components/layout/Sidebar/index.tsx`

- `renderIconMenuItem` 中移除 Tooltip 包裹（展开时文字已可见），仅收起时保留 Tooltip
- 图标和文字在同一行水平排列
- 使用 `labelKey`（完整名称）替代 `shortLabelKey`

#### 3. 更新样式
**文件**：`src/components/layout/Sidebar/index.less`

关键样式调整：
- `.sidebar-icon-bar`：宽度 `68px` → `200px`，`padding: 8px`
- `.sidebar-logo`：宽度跟随 `100%`
- `.sidebar-icon-btn`：
  - `flex-direction: column` → `row`
  - `width: 100%`，`min-height: 40px`
  - `padding: 8px 12px`，`gap: 10px`
  - 移除 `justify-content: center`，改为 `flex-start`
- `.sidebar-icon-btn-label`：
  - `font-size: 14px`，`font-weight: 500`
  - 移除居中和省略号限制
- `.sidebar-center-icon`：保持 `20px × 20px`

#### 4. 底部菜单项同步调整
通知铃铛和用户头像区域也改为横排风格，与整体一致。

#### 5. 收起状态兼容
收起时（collapsed=true）宽度缩回 `68px`，隐藏文字标签，仅显示图标居中，保留现有浮动菜单逻辑。

### 技术要点
- 不影响右侧详细面板（220px）的逻辑和样式
- 收起/展开切换逻辑不变
- 浮动菜单行为不变
- i18n key 不变

