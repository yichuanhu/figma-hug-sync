

# 需求列表页重构规划（对齐主流需求管理产品）

## 一、现状问题

当前 `/requirements/list` 是传统"信息表格"，所有列等宽呈现编号/标题/部门/状态/价值/复杂度/创建人/时间，信息密度高但缺乏：
- 主次区分（标题不突出、得分埋没）
- 状态可视化（单色 Tag，无生命周期感）
- 优先级 / 归属可视化（无优先级条、无头像）
- 快速浏览能力（无紧凑双行、无空白引导）

主流需求/项目管理产品（Linear / Jira Cloud / 飞书项目 / Asana / PingCode）的共同特征：
1. **左主右辅**：左侧"标题 + 副信息"主导阅读流，右侧紧凑展示状态/负责人/时间
2. **状态点 + 文字**：用彩色圆点/竖条 + 短文字代替大色块 Tag
3. **优先级胶囊 / 图标**：高/中/低用红/橙/灰小图标
4. **头像 + 姓名 hover**：负责人/创建人用圆形头像
5. **编号弱化**：编号小号灰色，附在标题前或后
6. **行高紧凑（44–48px）**，hover 整行高亮
7. **顶部支持视图切换（表格 / 看板 / 分组）**——本期先做表格视图升级

## 二、目标视觉（ASCII 示意）

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ □ │ 优 │ 编号        │ 标题 / 副标题(部门 · 创建人)        │ 状态     │ 价值 │ 复杂度 │ 归属人      │ 创建时间   │ ⋯ │
├──┼───┼─────────────┼──────────────────────────────────────┼──────────┼──────┼───────┼─────────────┼────────────┼───┤
│ □ │ ▲ │ REQ-2026-001│ 财务月结自动化                        │ ● 评估中 │ 4.5  │ 3.2   │ 🟢 张三      │ 03-12 14:20│ ⋯ │
│   │   │             │ 财务部 · 李四创建                     │          │      │       │             │            │   │
└──────────────────────────────────────────────────────────────────────────┘
```

要点：
- 优先级：红▲ / 橙■ / 灰▼ 16px Lucide 图标列（width 40）
- 编号：12px tertiary 文本列（width 120）
- 标题列（主列，flex 自适应）：第一行 14px 主色标题；第二行 12px tertiary "部门 · 创建人"
- 状态列：8px 圆点 + 文字（沿用 statusConfigV2 颜色），width 110
- 价值/复杂度：去掉 Tag 背景，纯数字 + 微型横向进度条（满分 5），width 100
- 归属人：Avatar(20px) + 姓名（UserNameWithCard），width 140
- 创建时间：相对时间 "3 天前"，hover 显示完整时间，width 110
- 操作：Ellipsis Dropdown，width 56
- 行高 56px（双行），hover 背景 `--semi-color-fill-0`
- 选中行（与详情抽屉联动）保留现有 `requirements-workbench-row-selected` 样式

## 三、实现清单

### 1. 新增子组件

```
src/pages/Requirements/RequirementsWorkbench/components/
├── PriorityIndicator/        优先级图标（红▲/橙■/灰▼）+ Tooltip
│   └── index.tsx
├── StatusDot/                8px 圆点 + 文字，颜色取自 statusConfigV2
│   └── index.tsx
├── ScoreBar/                 数字 + 5 分制进度条（价值蓝 / 复杂度紫）
│   └── index.tsx + index.less
└── TitleCell/                双行标题单元格（主标题 + 副信息）
    └── index.tsx + index.less
```

### 2. 重构 `RequirementsWorkbench/index.tsx`

- 替换 `columns` 定义：使用上述新组件渲染
- 移除独立"编号"列改为标题前的小号灰字（更接近 Linear/PingCode），或保留独立列但宽度收窄至 110——本方案采用**保留独立编号列**以满足国内用户对编号检索的强需求
- 表格 props 调整：`size="middle"` 行高更舒展；表头底色改为透明
- 行 hover 由全局 Semi 默认接管，移除自定义 hover

### 3. 样式 `index.less`

新增：
- `.requirements-workbench-row` 行高 56px、垂直居中
- `.requirements-workbench-table .semi-table-tbody .semi-table-row-cell` padding 调整
- ScoreBar / TitleCell 内部样式

### 4. i18n 增量

- `requirements.list.subtitle`（部门 · 创建人 拼接模板）
- `requirements.priority.tooltip.{high,medium,low}`
- `common.time.relative.{justNow,minutesAgo,hoursAgo,daysAgo}`（如未存在）

### 5. 不在本次改动范围

- 看板视图 / 分组视图（后续可选阶段）
- 列自定义显隐、列拖拽排序（后续）
- 详情抽屉、创建/编辑弹窗（阶段 2 统一重构）

## 四、关键交互细节

- 整行可点击打开详情抽屉（保留现有逻辑）
- 标题行点击直接进入详情；副信息中"创建人"点击触发 UserCard（依赖 UserNameWithCard）
- ScoreBar 鼠标悬停显示 `value.toFixed(1) / 5.0`
- 时间相对化使用 dayjs `.fromNow()`（项目已有 dayjs locale 配置）

## 五、验收点

1. 列表行高约 56px，每行呈现"主标题 + 部门·创建人"双行结构
2. 状态以圆点 + 文字呈现，9 种状态颜色与 `statusConfigV2` 一致
3. 价值/复杂度显示数字 + 进度条（5 分制）
4. 优先级以图标形式呈现于最左（在编号之前），高/中/低分别红/橙/灰
5. 归属人显示 Avatar + 姓名，hover 弹出 UserCard
6. 创建时间显示相对时间，hover 显示完整时间
7. 现有筛选、搜索、分页、详情抽屉联动、行选中态全部保持可用

