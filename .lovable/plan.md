

# ROI 深度分析页面开发计划

## 需求概要

根据设计文档 7.2 节，ROI 深度分析页面需在一个页面内**分区展示三个维度**的 ROI 数据：需求维度、部门维度、项目维度，支持筛选和时间维度切换。

## 页面结构

```text
┌─────────────────────────────────────────────────┐
│ ROI Analysis (Title)                            │
├─────────────────────────────────────────────────┤
│ Filter Bar: TimeRange | Department | Project    │
│             TimeDimension: [All|Today|Week|Month]│
│                                        [Refresh]│
├─────────────────────────────────────────────────┤
│ ▸ Requirement ROI Section                       │
│   ┌─────────────────┬──────────────────────┐    │
│   │ ROI Ranking     │ ROI Distribution     │    │
│   │ Table (Top 10)  │ (Pie) + Scatter      │    │
│   └─────────────────┴──────────────────────┘    │
├─────────────────────────────────────────────────┤
│ ▸ Department ROI Section                        │
│   ┌─────────────────┬──────────────────────┐    │
│   │ Dept Comparison │ Dept ROI Trend        │    │
│   │ (Bar + Table)   │ (Multi-line Chart)    │    │
│   └─────────────────┴──────────────────────┘    │
├─────────────────────────────────────────────────┤
│ ▸ Project ROI Section                           │
│   ┌─────────────────────────────────────────┐   │
│   │ Project ROI Ranking Table               │   │
│   └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 实施步骤

### 1. 类型定义与 Mock 数据
在 `src/pages/Operations/types.ts` 新增：
- `RequirementRoiDetail`：需求维度 ROI 详情（id, name, department, roi, investmentCost, savedCost, status）
- `DepartmentRoiDetail`：部门维度（department, investmentCost, savedCost, roi, requirementCount, robotCount, trend[]）
- `ProjectRoiDetail`：项目维度（projectName, status, investmentCost, savedCost, roi, requirementCount）
- `RoiAnalysisFilter`：筛选条件（timeRange, department, project, timeDimension）

在 `src/pages/Operations/mockData.ts` 新增对应 Mock 数据（英文业务数据，10条需求、5个部门、3个项目）。

### 2. 组件开发（文件夹结构）

```text
src/pages/Operations/ROIAnalysis/
├── index.tsx              # 主页面（筛选 + 三区块）
├── index.less
└── components/
    ├── RoiAnalysisFilter/       # 筛选栏（复用 Dashboard 模式）
    │   ├── index.tsx
    │   └── index.less
    ├── RequirementRoiSection/   # 需求维度区块
    │   ├── index.tsx            # Table + 饼图 + 散点图
    │   └── index.less
    ├── DepartmentRoiSection/    # 部门维度区块
    │   ├── index.tsx            # 柱状图 + 表格 + 多线趋势图
    │   └── index.less
    └── ProjectRoiSection/       # 项目维度区块
        ├── index.tsx            # 表格
        └── index.less
```

### 3. 图表实现（ECharts）
- **需求 ROI 分布**：ECharts 饼图，按 ROI 区间分布
- **投入 vs 收益散点图**：ECharts scatter，x=投入成本, y=节约成本，气泡大小=ROI
- **部门 ROI 对比**：ECharts 柱状图（投入/节约并列柱）
- **部门趋势对比**：ECharts 多线折线图（每个部门一条线）

### 4. i18n
在 `zh-CN.json` 和 `en.json` 的 `operations.roiAnalysis` 下新增所有标签翻译（约30个 key）。

### 5. 样式
沿用 Dashboard 的 `.dashboard-card` 样式规范（10px 圆角、20px 内边距、统一阴影），每个维度区块作为一个 card。全部响应式适配（图表与表格在窄屏下纵向堆叠）。

## 技术要点
- 使用 Semi UI `Table` 展示排行数据，`Tag` 展示状态
- 使用 `ReactECharts` 绘制饼图、散点图、柱状图、折线图
- 页面标题使用 `<Title heading={3} />` 与其他模块保持一致
- 页面无额外内边距（父容器已提供）

