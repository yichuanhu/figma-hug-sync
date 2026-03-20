

# 运营中心开发计划（使用 ECharts）

## 概述

基于已批准的运营中心开发计划，将图表库从 `recharts` 改为 `echarts` + `echarts-for-react`。其余架构、组件拆分、页面结构不变。

## 依赖变更

- 安装 `echarts` + `echarts-for-react`（替代 recharts）

## 实施内容不变

与之前批准的计划完全一致，共 4 个步骤：

1. **基础架构**：更新菜单结构（6个新模块）、路由、i18n、类型定义、Mock 数据
2. **总览看板**：筛选栏 + 核心指标卡片 + 资源概览 + 需求概览 + ROI趋势图（ECharts 组合图）+ 部门/需求 ROI 排行
3. **其余5个页面占位**：ROIAnalysis、ResourceEfficiency、BusinessOutcomes、CostManagement、PlatformOperations
4. **清理旧页面**：删除 ExecutionReport、PerformanceAnalysis、TargetManagement、ReportExport

## 图表实现方式

使用 `echarts-for-react` 的 `ReactECharts` 组件，通过 `option` prop 传入 ECharts 配置：

- **ROI趋势图**：使用 ECharts 组合图（折线 + 柱状），xAxis 为月份，双 yAxis（ROI% / 金额）
- **后续页面**：资源效能用仪表盘(gauge)、业务成果用饼图/雷达图等，ECharts 均原生支持

## 技术细节

文件变更清单与之前计划完全一致（见上次批准的计划），唯一区别是图表组件内部使用 `ReactECharts` 而非 recharts 组件。

