## 运营中心全局审查报告

### 现存模块（健康）
- `ResourceEfficiency` 资源效能监控 → `/operations/resource-efficiency`
- `BusinessOutcomes` 业务成果看板 → `/operations/business-outcomes`
- `MetricsConfig` 业务指标配置 → `/operations/metrics-config`（使用顶层 `metricsConfig.*` 词条，独立完整）
- `PlatformOperations` 平台运营 → `/operations/platform-operations`（i18n 完全匹配，无冗余）
- 侧边栏分组：`dataAnalysis` / `operationsManagement`（均在使用）

### 发现的问题

#### 1. 缺失的 i18n 键（真实 Bug，上一轮 ROI 模块清理时遗留）
`ResourceEfficiency` 代码引用了以下键，但 zh-CN / en 均未声明，导致页面显示原始 key 字符串：

| 引用位置 | 缺失键 |
|---|---|
| `ResourceEfficiency/index.tsx:35` Toast | `operations.resourceEfficiency.refreshed` |
| `components/ResourceFilterBar/index.tsx:70` | `operations.resourceEfficiency.timeDimension` |

需补回：
- zh-CN: `refreshed: "数据已刷新"`, `timeDimension: "时间维度"`
- en: `refreshed: "Data refreshed"`, `timeDimension: "Time Dimension"`

#### 2. 未使用的 i18n 键（死键，可清理）

**`operations.resourceEfficiency` 删除 16 项**：
`avgExecutionTime, busyTopTitle, failedProcessTopTitle, idleTopTitle, interactiveOnlineLicense, minutesUnit, noTask, onlineLicense, rank, robotType, successRateToday, successRateTotal, topN, trendLabel, typeDistribution, unattendedOnlineLicense`

**`operations.businessOutcomes` 删除 33 项**：
`avgCycleDaysProcess, avgCycleDaysRequirement, capacityProcessGroup, capacityRequirementGroup, capacityTitle, capacityTrend, costSaved, departmentTitle, developerCountProcess, developerCountRequirement, growthRateAxis, growthRateSeries, hoursSavedAxis, hoursSavedSeries, hoursTrendTitle, monthlyDeliveredProcess, monthlyDeliveredRequirement, progress, rankEmpty, rankFilterPlaceholder, rankSortAsc, rankSortDesc, requirementCount, runningCount, todayVolume, totalVolume, trendAnalysisTitle, trendProcess, trendRequirement, typeShareTitle, volumeGrowthMoM, volumeRankingTitle, volumeTrendTitle`

> 检索方法：对每个键名做全代码库 `rg` 引用扫描；动态拼接键（如 `status${...}` / `statusWorking`）已计入实际使用。

#### 3. 现状保留项（不动）
- **`src/App.tsx`** 中三条遗留重定向（`/operations/dashboard`、`/operations/roi-analysis`、`/operations/cost-management` → `business-outcomes`）：保留以兼容旧书签链接。
- **`operations.dashboard.*` 命名空间**：虽语义为旧"仪表盘"，但其中 15 个子键被 `ResourceEfficiency` 与 `BusinessOutcomes` 共用（时间范围/今日累计等），属共享词条，不重命名以免大面积改动。
- `mockData.ts` / `types.ts`：上一轮已清理完毕，无残留。

### 实施步骤
1. 修改 `public/i18n/zh-CN.json` 与 `public/i18n/en.json`：
   - 在 `operations.resourceEfficiency` 下新增 `refreshed`、`timeDimension`
   - 删除上文列出的 16 + 33 项未使用键
2. 验证：
   - 资源效能监控页：点击刷新 Toast 文案正确显示；筛选栏"时间维度"标签显示正常
   - `rg "operations\.(resourceEfficiency|businessOutcomes)\."` 与 i18n 文件对账无新增 missing