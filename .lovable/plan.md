

# ROI Analysis 页面布局优化：图表一排 + 表格一排

## 当前问题

各区块内图表和表格左右混排，信息层次不清晰。

## 优化方案

每个维度区块内改为**上方图表横排、下方表格全宽**的结构，保持现有三个区块纵向堆叠不变。

```text
需求维度 ROI
┌──────────────────┬──────────────────┐
│ ROI Distribution │ Invest vs Saved  │
│ (Pie)            │ (Scatter)        │
└──────────────────┴──────────────────┘
┌─────────────────────────────────────┐
│ Requirement Ranking Table (全宽)    │
└─────────────────────────────────────┘

部门维度 ROI
┌──────────────────┬──────────────────┐
│ Dept Comparison  │ Dept ROI Trend   │
│ (Bar)            │ (Multi-line)     │
└──────────────────┴──────────────────┘
┌─────────────────────────────────────┐
│ Department Detail Table (全宽)      │
└─────────────────────────────────────┘

项目维度 ROI
┌─────────────────────────────────────┐
│ Project ROI Table (全宽，无图表)     │
└─────────────────────────────────────┘
```

## 改动文件

### 1. RequirementRoiSection
- **index.tsx**：将 JSX 结构改为先渲染图表行（两个图表并排），再渲染全宽表格
- **index.less**：`.requirement-roi-content` 改为 `flex-direction: column`；新增 `.requirement-roi-charts-row` 用 `grid-template-columns: 1fr 1fr` 横排两图表；表格全宽

### 2. DepartmentRoiSection
- **index.tsx**：将柱状图和趋势图放在一个横排容器中，表格独立放在下方全宽
- **index.less**：`.department-roi-content` 改为 `flex-direction: column`；新增 `.department-roi-charts-row` 两列网格；表格全宽

### 3. ProjectRoiSection
- 无变化（已是全宽表格）

### 4. 响应式
所有图表横排在 `@media (max-width: 1200px)` 时切换为 `grid-template-columns: 1fr` 纵向堆叠。

