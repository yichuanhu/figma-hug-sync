## 背景

运营中心已先后移除 ROI 深度分析、成本管理两个模块。现需清理仍残留于 mock 数据和 i18n 词条中、不再被任何代码引用的死代码。

## 审查结论

### 1. `src/pages/Operations/mockData.ts` 死导出
仅被本文件内部声明、外部无任何引用：
- `mockResourceOverview`
- `mockRequirementOverview`
- `mockRoiTrend`
- `mockDepartmentRoi`
- `mockRequirementRoi`

以及文件顶部对应的 type-only import：`ResourceOverviewData / RequirementOverviewData / RoiTrendPoint / DepartmentRoiItem / RequirementRoiItem`。

### 2. `src/pages/Operations/types.ts` 死类型
外部无引用，可删除：
- `ResourceOverviewData`
- `RequirementOverviewData`
- `RoiTrendPoint`
- `DepartmentRoiItem`
- `RequirementRoiItem`
- `DashboardFilter`

保留：`ResourceEfficiencyData / ResourceEfficiencyFilter / BusinessOutcomesData / BusinessOutcomesFilter / RobotDetail / TaskExecutionStats / UtilizationTrendPoint / GroupUtilization / SuccessRateTrendPoint / Funnel/DevCapacity/Requirement* 等业务成果看板相关类型`（仍在使用）。

### 3. i18n 词条死键（`public/i18n/zh-CN.json` 与 `public/i18n/en.json` 同步处理）

- `operations.comingSoon`：全代码库无引用，删除。
- `operations.dashboard.*`：仅以下子键仍被使用，其余删除：
  - 保留：`timeRange / department / selectAll / thisMonth / lastMonth / thisQuarter / thisYear / allTime / count / todayTasks / totalTasks / todayRuntime / totalRuntime / hours / minutes`
  - 删除：`title / project / coreMetrics / totalSavedCost / robotUtilization / activeRequirements / totalAutomationHours / totalInvestmentCost / resourceOverview / interactiveRobot / unattendedRobot / onlineAuth / tenThousandHours / requirementOverview / requirementDeveloping / requirementCompleted / requirementRunning / requirementTotal / roiTrend / roiPercent / investmentCostLabel / savedCostLabel / amountUnit / tenThousandUnit / deptRoiRanking / reqRoiRanking / rank / departmentName / requirementName / trendLabel / statusRunning / statusCompleted / statusDeveloping`

> 备注：`sidebar.roiAnalysis`、`sidebar.costManagement` 在上轮已删除，无残留。`operations.dashboard` 本身因仍有引用而保留为节点，仅删除其无用子键。

### 4. 验证
- 构建无报错（类型导入也已同步收敛）
- `rg "mockRoiTrend|mockDepartmentRoi|mockRequirementRoi|mockResourceOverview|mockRequirementOverview|DashboardFilter|operations\.comingSoon"` 应无残留
- 资源效能、业务成果看板、平台运营、指标配置页面文案完整显示