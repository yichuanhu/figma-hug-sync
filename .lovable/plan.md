

# 需求中心未完成功能 - 前端开发与设计文档

## 一、范围与优先级

对照已上传的 8 份 Story 文档，按"先补详情、再补流程、最后补管理"的顺序分三批落地。本批仅产出文档，待确认后实施。

---

## 二、第 1 批：详情抽屉补齐（STORY-007 / 010 / 012）

### 2.1 改造 `RequirementDetailDrawer` 为 Tab 结构

当前抽屉为左右分栏（左信息 + 右属性），不支持评估/成本/版本三块新内容。改造为 **左 Tab 区 + 右属性面板** 保留布局：

```text
┌─────────────────────────────────────────────────────────┐
│ Header: 标题 / 操作（编辑、提交、删除、分享、导航、全屏）│
├──────────────────────────────────┬──────────────────────┤
│ Tabs:                            │  右侧属性面板        │
│  · 概览（描述+附件+关联+活动）   │  - 状态/优先级       │
│  · 技术评估                      │  - 创建人/部门       │
│  · 成本预估                      │  - 时间信息          │
│  · 版本历史                      │  - 提交审批按钮      │
│                                  │  - 审批操作（PENDING）│
│                                  │                      │
└──────────────────────────────────┴──────────────────────┘
```

- Tab 默认 `概览`；切换上下条保留当前 Tab（已有 `tab-persistence` 规范）。
- 右侧属性面板保持不变，沿用现有 `PropertyPanel`。
- 现有 `TechnicalAssessmentSection`（在右侧）下沉到「技术评估」Tab，扩展为完整评分卡。

### 2.2 「技术评估」Tab（STORY-007）

**布局**：
- 顶部：评估状态 Banner（未评估 / 评估中 / 已通过 / 已驳回）+ 评估人 + 评估时间。
- 中部：**两张评分卡** 横向并排（窄屏自动堆叠）：
  - 业务价值卡：3 个维度（战略契合 / 收益规模 / 紧迫性），每个维度 1-5 分单选 + 简述输入框；底部小计。
  - 技术复杂度卡：3 个维度（实现难度 / 依赖复杂度 / 风险），1-5 分；底部小计。
- 底部：**结论区**
  - 总分 = 业务价值 - 技术复杂度（参考 logic-standard 已有 ≥15 Pass 规则；本次按 Story-007 改为净值正向通过）。
  - 推荐结论 Tag（推荐立项 / 谨慎评估 / 不建议）。
  - 「提交评估结论」按钮 → 状态流转到 APPROVED 自动触发 ASSESSING（保留 status-transition-rules）。

**字段**（mock）：见 §五 数据契约。

### 2.3 「成本预估」Tab（STORY-010）

**布局**：上下两段。

```text
─ 估算输入 ────────────────────────
人力（按角色）   产品 1 人 × 5 人天   [+ 添加角色]
                 后端 2 人 × 10 人天
                 前端 1 人 × 8 人天
基础设施费用     ¥ 2000
第三方服务费用   ¥ 0
其他费用         ¥ 500
─ 估算结果（只读，自动计算）─────────
总人天          33 人天
总人力成本      ¥ 49,500
非人力成本      ¥ 2,500
预估总成本      ¥ 52,000
ROI 简评（可选输入）
```

- 角色单价从 mock `costConfig.dailyRateByRole` 读取（产品 1500 / 后端 1800 / 前端 1500 / 测试 1200）。
- 实时计算并以禁用态 Input 展示结果。
- 保存按钮：写回需求 `costEstimate` 字段。
- 仅 APPROVED 之后允许编辑；ASSESSING/DEVELOPING 阶段只读。

### 2.4 「版本历史」Tab（STORY-012）

**布局**：左侧版本时间线 + 右侧详情。

- 版本生成时机：每次 **审批通过 / 评估完成 / 字段修改后再次提交** 自动 snapshot。
- 时间线项：版本号 v1/v2/... + 操作人 + 时间 + 简述。
- 右侧：选中版本展示快照内容（标题 / 描述 / 优先级 / 评估结论 / 成本估算）；提供「与当前版本对比」按钮，对比模式以双列展示，差异行高亮（黄底）。
- 仅查看，不允许回滚（与 Story-012 一致）。

---

## 三、第 2 批：基础设施（STORY-003 / 001）

### 3.1 自动编号 `REQ-YYYY-NNNN`

- 创建草稿时本地序号生成器：读取 mock 列表中当年最大编号 + 1。
- 编号在抽屉标题左侧以 `Tag` 展示（灰色）；列表新增「编号」列（120px，固定第二列）。

### 3.2 基于 Scheme 的动态表单

- `RequirementFormModal` 改造：从 mock `activeScheme.custom_fields` 读取字段定义（type / label / required / options / placeholder / maxLength），用 Semi `Form` 动态渲染。
- 内置基础字段（标题 / 部门 / 创建人 / 描述）保持固定，动态字段追加在「描述」之后。
- 类型映射：`text→Input`、`textarea→TextArea`、`select→Select`、`number→InputNumber`、`date→DatePicker`、`user→OwnerSelect`、`dept→DepartmentSelect`。

### 3.3 Scheme 版本管理（STORY-001）轻量版

- 在「需求方案」详情抽屉新增「版本」Tab：列出方案历史版本（mock），仅查看；激活版本以绿色圆点标识（沿用 version-management-v14）。
- YAML schema 校验暂以 mock 校验函数模拟（合法/非法返回）。

---

## 四、第 3 批：流程与生命周期（STORY-006 / 009）

### 4.1 多级 / 会签审批（STORY-006）

- 审批流定义：mock `approvalFlow = [{level:1, mode:'any_one', approvers:[...]}, {level:2, mode:'all', approvers:[...]}]`。
- 抽屉右侧「审批」区块改为 **审批进度条**：
  - 节点：待提交 → 一级审批 → 二级审批 → 通过/驳回。
  - 当前节点高亮蓝；已过节点绿色对勾；驳回节点红色叉。
- 当前用户在审批人列表中时显示「同意 / 驳回 / 转交」按钮。
- 提交人在 PENDING 阶段显示「撤回」按钮 → 回到 DRAFT。

### 4.2 状态聚合（STORY-009）

- `developmentStatus` 由关联流程列表（`linkedProcesses`）聚合：取所有流程中"最差"状态（pessimistic）：`FAILED > PENDING > DEVELOPING > TESTING > ONLINE`。
- 抽屉「关联管理」Section 新增聚合状态展示与逐流程状态列表。

---

## 五、数据契约（mock 扩展）

`src/pages/Requirements/RequirementsWorkbench/types.ts` 新增字段：

```ts
type AssessmentDimension = { key: string; score: 1|2|3|4|5; note?: string };

interface RequirementItem {
  // ... 现有字段
  reqNumber?: string;                  // REQ-2026-0001
  assessment?: {
    valueDimensions: AssessmentDimension[];
    complexityDimensions: AssessmentDimension[];
    conclusion: 'RECOMMEND'|'CAUTION'|'REJECT';
    netScore: number;
    assessorId: string; assessorName: string;
    assessedAt: string;
  };
  costEstimate?: {
    roles: { role: string; people: number; days: number }[];
    infra: number; thirdParty: number; other: number;
    totalPersonDays: number;
    laborCost: number; nonLaborCost: number; totalCost: number;
    roiNote?: string;
  };
  versions?: Array<{
    version: number; createdAt: string; actorName: string;
    summary: string; snapshot: Partial<RequirementItem>;
  }>;
  approvalFlow?: { level:number; mode:'any_one'|'all'|'majority';
                   approvers:{id:string;name:string;status:'PENDING'|'APPROVED'|'REJECTED'}[] }[];
  linkedProcesses?: { id:string; name:string; status:string }[];
}
```

---

## 六、设计规范遵循

- 抽屉宽度 1000px / 最小 800px（保持现状），maskless（drawer/unified-standard-v1）。
- Tab 内容滚动遵循 flex-scroll-standard-v1：`.semi-tabs { display:flex; flex-direction:column }` + `.semi-tabs-pane { overflow-y:auto }`。
- 评分卡 / 成本卡复用 `requirement-assessment-dimension-group` 现有样式（`background: var(--semi-color-fill-0)`，`padding:12px`，`border-radius:6px`）。
- 颜色：评估通过绿、待评估橙、驳回红（沿用 interaction-standard-v2 配色）。
- 图标：Lucide React，stroke=2（评估 ClipboardCheck / 成本 Wallet / 版本 History / 流程节点 CircleCheck）。
- 文案中文优先；i18n 同步补 zh-CN + en 两份。
- mock 数据全英文字段值（mock-data-standard-v5）。

---

## 七、交付方式

- **本次仅文档**，待你确认后再分批 coding。
- 实施时按 §二 / §三 / §四 顺序分三个批次提交，每批完成后做一次自检（QA 截图 + 关键字段检查）再进入下一批。

