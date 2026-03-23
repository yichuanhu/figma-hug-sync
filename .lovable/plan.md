

# 资源效能监控页面开发计划

## 需求概要

根据设计文档 7.3 节，资源效能监控页面分区展示**机器人效能**和**任务执行统计**，支持筛选和时间维度切换。

## 页面结构

```text
┌─────────────────────────────────────────────────┐
│ Resource Efficiency (Title)                     │
├─────────────────────────────────────────────────┤
│ Filter: TimeRange | Group | Status   [Refresh]  │
│         TimeDimension: [All|Today|Week|Month]    │
├─────────────────────────────────────────────────┤
│ ▸ Robot Performance Section                     │
│   ┌────────────────┬───────────────────────┐    │
│   │ Utilization    │ Type Distribution     │    │
│   │ Gauge + Stats  │ (Pie)                 │    │
│   └────────────────┴───────────────────────┘    │
│   ┌────────────────┬───────────────────────┐    │
│   │ Utilization    │ Group Utilization      │    │
│   │ Trend (Line)   │ Comparison (Bar)       │    │
│   └────────────────┴───────────────────────┘    │
│   ┌─────────────────────────────────────────┐   │
│   │ Robot Detail Table                      │   │
│   └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│ ▸ Task Execution Section                        │
│   ┌─────────────────────────────────────────┐   │
│   │ Summary Cards: Total|Success|Failed|    │   │
│   │                Running|Timeout          │   │
│   └─────────────────────────────────────────┘   │
│   ┌────────────────┬───────────────────────┐    │
│   │ Today/Cumul.   │ Success Rate Trend    │    │
│   │ Stats Cards    │ (Line Chart)          │    │
│   └────────────────┴───────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## 实施步骤

### 1. 类型定义 (`types.ts`)
新增：
- `RobotDetail`：机器人详情（name, type, group, status, utilization, monthlyTasks, trend[]）
- `TaskExecutionStats`：任务执行汇总（total, success, failed, running, timeout）
- `ResourceEfficiencyData`：聚合数据（overallUtilization, totalRobots, working, idle, offline, maintenance, interactiveOnline/Total, unattendedOnline/Total, robotDetails[], taskStats, todayTasks, totalTasks, todayRunMinutes, totalRunMinutes, successRateToday, successRateTotal）
- `ResourceEfficiencyFilter`：筛选条件（timeRange, group, status, timeDimension）

### 2. Mock 数据 (`mockData.ts`)
新增英文 Mock 数据：8台机器人详情、任务执行汇总、利用率趋势（6个月）、分组利用率对比、成功率趋势。

### 3. 组件结构

```text
src/pages/Operations/ResourceEfficiency/
├── index.tsx              # 主页面
├── index.less
└── components/
    ├── ResourceFilterBar/       # 筛选栏
    │   ├── index.tsx
    │   └── index.less
    ├── RobotPerformance/        # 机器人效能区块
    │   ├── index.tsx            # Gauge + Pie + 趋势线 + 柱状图 + 详细表格
    │   └── index.less
    └── TaskExecutionSection/    # 任务执行统计区块
        ├── index.tsx            # 汇总卡片 + 今日/累计 + 成功率趋势
        └── index.less
```

### 4. 图表实现（ECharts）
- **整体利用率**：ECharts Gauge 仪表盘（显示百分比）
- **机器人类型分布**：ECharts Pie（人机交互 vs 无人值守）
- **利用率趋势**：ECharts Line（月度折线）
- **分组利用率对比**：ECharts Bar（各分组柱状对比）
- **成功率趋势**：ECharts Line（成功率折线）
- **机器人详细表格**：Semi UI Table（含迷你趋势 sparkline）

### 5. i18n
在 `operations.resourceEfficiency` 下新增约 35 个 key（筛选项、区块标题、表格列名、状态标签等），中英文双语。

### 6. 样式
沿用 `.dashboard-card` 规范，响应式 `@media` 断点（1200px/768px），图表区域两列布局在窄屏下堆叠。

