
# 自定义业务指标（STORY-010）实施方案

## 一、目标

落地 STORY-010 的两块能力：
1. **业务指标配置**：运营中心新增独立菜单与页面，提供 CustomMetric 的完整 CRUD + 历史记录查看。
2. **业务成果看板消费**：用 CustomMetric/MetricSnapshot 数据**替换**现有「业务量统计」区块，按 visible 指标动态渲染 KPI、趋势、排行。

数据全部走前端 mock service（参考既有 `src/mocks/classification/` 模式）。

---

## 二、文件结构

### 新增

```
src/mocks/operationsMetrics/
  types.ts          // CustomMetric / MetricSnapshot / MetricRecord
  mockData.ts       // 预置 5~6 个指标 + 30 天历史
  service.ts        // listMetrics / createMetric / updateMetric / deleteMetric
                    // listMetricRecords / getSnapshots
                    // 含 latency 与可切换 error 模式

src/pages/Operations/MetricsConfig/
  index.tsx         // 列表页（Tab: 全部/可见/隐藏 + Table）
  index.less
  components/
    MetricFormModal/index.tsx       // 520px 新增/编辑（FormModal 封装）
    MetricRecordsDrawer/index.tsx   // 900px 历史记录抽屉（DetailDrawerWrapper）
    MetricRecordsDrawer/index.less

src/pages/Operations/BusinessOutcomes/components/CustomMetricsSection/
  index.tsx         // 替换原"业务量统计"区块
  index.less
```

### 修改

- `src/App.tsx`：注册路由 `/operations/metrics-config`
- `src/components/layout/`（侧边栏配置）：在运营中心组下新增「业务指标配置」菜单项（Lucide `Gauge` 图标）
- `src/pages/Operations/BusinessOutcomes/index.tsx`：删除"业务量统计"卡片（含 todayVolume/totalVolume/MoM、volumeTrend、typeShare 饼图、volumeRanking），替换为 `<CustomMetricsSection filter={filter} />`
- `public/i18n/zh-CN.json` & `en.json`：新增 `operations.metricsConfig.*` 和 `operations.businessOutcomes.customMetrics.*` 文案

---

## 三、数据模型（mock）

```ts
type MetricType = 'COUNTER' | 'ACCUMULATOR' | 'LATEST';
type MetricOperator = 'SET' | 'INCREMENT' | 'ACCUMULATE' | 'LATEST';

interface CustomMetric {
  id: string; code: string; displayName: string;
  metricType: MetricType; unit?: string; description?: string;
  visible: boolean; createdAt: string; updatedAt: string;
  hasRecords: boolean;     // 计算属性，决定 type/unit 是否可改、是否可删
}
interface MetricSnapshot { metricId: string; currentValue: number | string; lastUpdatedAt: string; version: number; }
interface MetricRecord {
  id: string; metricId: string; executionId: string;
  delta: number; value: number | string;
  operator: MetricOperator; timestamp: string;
}
```

预置 6 个指标：`ORDER_COUNT(COUNTER,笔)`、`INVOICE_AMT(ACCUMULATOR,元)`、`CURR_STATUS(LATEST)`、`REFUND_COUNT(COUNTER,笔)`、`COST_SAVED(ACCUMULATOR,元)`、`LAST_BATCH(LATEST)`，配 30 天 MetricRecord 用于趋势。

---

## 四、业务指标配置页

### 页面布局（沿用项目规范）

- `Title heading={3}` 标题 + 顶部操作区：左 Tabs `全部/可见/隐藏`、320px 搜索框（按 code/displayName），右「+ 新增指标」按钮、刷新按钮
- Semi UI `Table size="small"`，列：代码 / 展示名称 / 类型(Tag) / 单位 / 当前值（来自 snapshot）/ 最后更新 / 可见(Switch 直接切换 visible) / 操作（编辑 / 历史 / 删除）
- 删除按钮：若 `hasRecords` 为 true → 禁用 + Tooltip "已有更新明细，不可删除"；否则 `Modal.confirm` 二次确认
- 外置 `.list-pagination` 分页栏

### 新增/编辑弹窗（MetricFormModal，520px）

字段（顺序）：
1. 指标代码 `code` — Input，正则 `^[A-Z][A-Z0-9_]*$`，长度 2~30。**编辑模式禁用**
2. 展示名称 `displayName` — Input，最长 50，全局唯一
3. 指标类型 `metricType` — Select（COUNTER/ACCUMULATOR/LATEST）。**编辑时若 `hasRecords` 则禁用 + 提示**
4. 单位 `unit` — Input，最长 20。**编辑时若 `hasRecords` 则禁用**；LATEST 类型 unit 可空
5. 描述 `description` — TextArea，最长 500
6. 是否展示 `visible` — Switch，默认 true

Semi UI Form 原生校验（`trigger=['blur','change']`），提交统一走 `service.createMetric / updateMetric`，唯一性冲突时表单标红。

### 历史记录抽屉（MetricRecordsDrawer，900px maskless）

- 顶部展示：指标代码、displayName、type Tag、当前值、最后更新时间
- 上方折线图（ECharts，复用 BusinessOutcomes 调色）：30 天趋势（按天聚合 value）
- 下方 Table：时间 / 操作 / 增量(Counter/Accumulator 显示，Latest 显示 "-") / 更新后值 / 执行ID（可点击占位）
- 外置分页

---

## 五、业务成果看板「自定义指标」区块

### 替换范围

删除 `BusinessOutcomes/index.tsx` 中第 476~552 行的"业务量统计"卡片（含 `volumeOption`、`pieOption`、`volumeRanking` 相关 useMemo 及容器）。

### 新区块（CustomMetricsSection）

```
┌─ 业务指标（自定义） ──── [管理指标 →] ──┐
│ 顶部 KPI 网格（动态列数，最多 4 列/行）  │
│   ┌──────────┐ ┌──────────┐            │
│   │ 处理订单数 │ │ 发票金额  │ ...       │
│   │ 125 笔    │ │ 38,500 元 │           │
│   │ 较昨日+12 │ │ 较昨日+500│           │
│   └──────────┘ └──────────┘            │
│                                         │
│ 详情区（按指标类型）：                   │
│  - COUNTER/ACCUMULATOR：堆叠/折线趋势   │
│  - LATEST：列表展示最新值与时间          │
└─────────────────────────────────────────┘
```

要点：
- 数据源 `service.listMetrics({ visible: true })` + 当前 snapshot + 最近 30 天 record
- 顶部「管理指标 →」按钮直接 `navigate('/operations/metrics-config')`
- 指标为 0 时：EmptyState（复用 `no-data.svg`），文案 "尚未配置业务指标"，CTA 跳转配置页
- 趋势图：COUNTER/ACCUMULATOR 指标合并到一张多系列折线（每指标一条线，单位差异通过 tooltip 区分；超过 4 个指标默认只展示前 4，其余通过 Select 切换）
- LATEST 指标独立卡片列表，展示 displayName / 当前值（字符串）/ lastUpdatedAt
- `filter`（部门/分类/时间维度）仍传入，时间维度影响趋势区间；mock 内忽略 department/classification 过滤但保留入参

---

## 六、路由与导航

- 新增路由：`/operations/metrics-config` → `<MetricsConfig />`
- 侧边栏 `运营中心` 组添加菜单项「业务指标配置」（图标 `Gauge`，置于"业务成果看板"之后）
- i18n key `nav.operations.metricsConfig`

---

## 七、技术细节

- mock service 全部走 `setTimeout` 模拟 300~500ms 延迟
- 唯一性校验：service 内部按 `code` / `displayName` 比对，冲突时 reject `{ code: 'DUPLICATE_CODE' | 'DUPLICATE_NAME' }`，组件按 code 翻译错误
- `Toast.config({ theme: 'light' })`（项目已全局配置）；新增/编辑/删除成功后 Toast.success
- 类型枚举的 Tag 颜色：COUNTER=blue，ACCUMULATOR=violet，LATEST=teal
- 列表 visible 切换：直接调用 updateMetric，乐观更新 + 失败回滚
- 不涉及后端、不涉及命令解析逻辑（文档明确属执行引擎范畴），仅在 mockData 中"伪造"已经被解析后的 snapshot/record

---

## 八、不在本轮范围

- `APA_METRIC.XXX(...)` 命令在 Creator 流程编辑器中的预埋 UI
- 真实的执行引擎命令解析、原子写入、乐观锁
- 指标趋势的分钟级粒度（mock 按天聚合）
- 指标 code 批量导入/导出
- STORY-008/009 文档的废弃标记（属文档维护工作，不在代码侧）

确认后回复"开始实施"即可。
