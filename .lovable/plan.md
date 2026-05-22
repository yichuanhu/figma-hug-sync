## 变更范围

仅修改运营中心-业务成果看板的展示层，不动业务逻辑与 mock 数据生成函数。

### PART-A：删除「趋势分析」分区
`src/pages/Operations/BusinessOutcomes/index.tsx`
- 删除整个 "5. 趋势分析" 区块（第 524-532 行 dashboard-card）
- 删除 `trendAnalysisOption` useMemo（第 217-254 行）
- 移除未使用的 i18n key 引用：`trendAnalysisTitle`、`growthRateSeries`、`hoursSavedSeries`、`growthRateAxis`、`hoursSavedAxis`、`tips.growthVsHours`（保留 i18n 文件中的 key 不动以免影响其他位置；仅停止引用）

### PART-B：精简「节省工时」分区
保留：今日/累计/人年 三个 KPI、累计曲线、部门对比
删除：趋势柱状图

`src/pages/Operations/BusinessOutcomes/index.tsx`
- 重写 `hoursOption`（第 155-188 行）：移除 `bar` 系列与第二 Y 轴、去掉 legend，仅保留累计折线（单 Y 轴、平滑曲线、面积渐变）

### 不变更
- mockData（`growthVsHours`、`timeSavedTrend` 字段可保留，避免类型层连锁修改）
- 漏斗图、需求开发进度、自定义业务指标、部门对比、FEAT-023 开发产能仪表盘、筛选/刷新交互
- i18n 文案文件

### 验证
- 页面无"趋势分析"标题
- 节省工时区只剩累计曲线 + 部门对比两张图
- 无 TS 报错（删除的 option 不再被引用）
