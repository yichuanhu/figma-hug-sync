

## 重新设计 成本预估 Tab（按 STORY-010 自动计算模式）

### 一、范围澄清

之前实现错误地把成本预估做成了**用户手填的项目预算估算**（角色×人数×人天 + 基础设施费）。重读 STORY-010 后，正确语义是：

> **基于需求表单基线数据，自动计算"自动化后每月可节省多少"**，用户**不参与编辑**，只查看公式与结果。

### 二、数据契约调整

**1. `RequirementItem` 增加表单基线字段**（来自创建需求时的 `form_data`，第 2 批动态表单会真正落地，本次先在 mock 里造好）：
```ts
formData?: {
  frequency: number;          // 月均执行次数
  durationMinutes: number;    // 单次耗时（分钟）
  automationRatio: number;    // 可自动化比例 0~1
  jobLevel: 'P4'|'P5'|'P6'|'P7'; // 岗位级别
};
```

**2. `Scheme.cost_config` 增加费率表**（mock）：
```ts
costConfig: {
  workingHoursPerDay: 8,
  rateTable: { P4: 800, P5: 1200, P6: 1800, P7: 2600 } // 元/人天
}
```

**3. `CostEstimateData` 重定义为只读计算结果**（不再保存用户输入）：
```ts
interface CostEstimateData {
  // 基线快照
  frequency: number;
  durationMinutes: number;
  automationRatio: number;
  jobLevel: string;
  // 计算参数快照
  workingHoursPerDay: number;
  dailyRate: number;
  // 计算结果
  monthlySavedHours: number;      // 频率 × 时长 × 比例 / 60
  monthlySavedPersonDays: number; // 工时 / 每天工时
  monthlySavedAmount: number;     // 人天 × 单价
  computedAt: string;
}
```

### 三、UI 重构（`CostEstimateTab/index.tsx`）

完全重写为**只读展示卡**，三段式：

**第 1 段：成本基线数据（来自表单）**
- 4 项 read-only Descriptions：执行频率 / 单次时长 / 可自动化比例 / 岗位级别
- 若 `formData` 缺失，展示 EmptyState「该需求尚未填写基线数据」

**第 2 段：预估节省（自动计算结果）**
- 3 个高亮指标卡（沿用现有 `cost-result-cell` 样式）：
  - 月均节省工时（h）
  - 月均节省人天（d）
  - 月均节省金额（¥）—— primary 色加重显示
- 顶部副标题展示参数来源：`基于激活方案 {schemeName} · 岗位 P6 单价 ¥1800/d · 每日 8h`

**第 3 段：计算公式（透明化）**
- 一个浅色 info 卡，使用等宽字体逐行展示：
  ```
  月均节省工时 = 20 次 × 30 分钟 × 80% / 60 = 8.00 h
  月均节省人天 = 8.00 h / 8 h = 1.00 d
  月均节省金额 = 1.00 d × ¥1800/d = ¥1,800
  ```

**移除内容**：
- 角色添加/删除、人数/人天 InputNumber
- infra / thirdParty / other 三项手填
- ROI 备注输入框
- 「保存」按钮、editable / lockedReason 状态分支
- `onSaveCost` prop（详情抽屉同步移除调用与 i18n）

### 四、按部门聚合视图（新增）

需求列表页 `/requirements/list` 顶部新增**"预估节省汇总卡片"**（可折叠或与现有筛选并列）：

- 形态：横向部门小卡片列表，每张展示：
  - 部门名 + 需求数
  - Σ 月均节省金额（¥）
  - Σ 月均节省人天（d）
- 数据源：遍历 `mockRequirements`，按 `department` 聚合 `costEstimate.monthlySavedAmount` / `monthlySavedPersonDays`。
- 仅在「列表」视图展示，看板视图不展示，避免拥挤。

### 五、自动重算时机

在 `mockData.ts` 内新增工具函数 `computeCostEstimate(req, scheme)`，在以下时机调用并写回：
- 创建需求（formData 落库后）
- 编辑表单字段（frequency/duration/ratio/jobLevel 任一变化）
- Scheme cost_config 变更（暂不实现，留 TODO）

### 六、文件改动清单

1. `src/pages/Requirements/RequirementsWorkbench/types.ts` — 重定义 `CostEstimateData`，扩展 `RequirementItem.formData` 与 Scheme `costConfig`
2. `src/pages/Requirements/RequirementsWorkbench/mockData.ts` — 新增 `computeCostEstimate`、为现有 mock 需求补 `formData`、移除 `updateRequirementCost` 暴露方式（改为内部自动重算）
3. `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/CostEstimateTab/index.tsx` — 完全重写为只读展示
4. `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/CostEstimateTab/index.less` — 新增公式块样式 `.cost-formula-block`（等宽字体、浅灰底）
5. `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/index.tsx` — 移除 `handleSaveCost` 调用与 prop 传递
6. `src/pages/Requirements/RequirementsWorkbench/index.tsx` — 列表视图顶部加"按部门节省汇总"卡片
7. `public/i18n/zh-CN.json` + `public/i18n/en.json` — 新增 baseline / savedHours / savedPersonDays / savedAmount / formulaTitle / departmentSummary 等 key，移除旧的 addRole/people/days/infra/thirdParty/other/save/lockedAfterLaunch 等

### 七、设计规范遵循

- 只读 Descriptions 使用 Semi UI `Descriptions` 组件（size="small", row）
- 指标卡复用现有 `.cost-result-grid` / `.cost-result-cell`
- 公式块用 `font-family: 'SF Mono', Menlo, monospace; background: var(--semi-color-fill-0); padding: 12px; border-radius: 6px;`
- 部门汇总卡片复用首页指标卡视觉（`0 1px 3px` 基础阴影、12px 圆角）
- 文案中文优先，i18n 同步中英文

