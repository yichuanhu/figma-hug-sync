# 需求中心 v4 改造执行计划

> 对齐 STORY-001 / 003 / 006 / 007 / 009 / 013 / 016 / 017 / 018 / 019 的 v4 规范。
> 用户已确认：直接改代码 + 预览；独立菜单「部门审批流绑定」；全量重命名「待立项→待开发」。

## 改造范围与对应 Story

| 模块 | 涉及 Story | 当前代码状态 | 改造动作 |
|------|-----------|-------------|---------|
| 状态命名 | 009 | 现有 `PENDING_PROJECT`「待立项」 | i18n + 文案统一为「待开发」；枚举值暂保留 `PENDING_PROJECT` 不动（影响面太大），如需也改下一轮再说 |
| 方案管理 | 001 + 013 | 单激活，方案带 `approval_flow_template_id` | 改为多激活；方案构建器移除审批/评估配置；保留 form 节点；锁定 4 个系统固定字段 |
| 审批流模板 | 016 | `ApprovalConfig` 单激活模板列表 | 改为多激活；新增「绑定部门数」列；移除「绑定到方案」概念；预设模板「默认审批流程」不可删 |
| 部门审批流绑定 | 016 | 不存在 | 新增独立菜单与页面：部门树左 + 当前绑定模板右；business_type=REQUIREMENT |
| 提交与跳过 | 006 | 全局激活模板读取 | 改为按 `requirement.department_id` 查 `department_approval_flow_binding`；三种跳过：未绑定→直接待开发、approval_enabled=false→跳审批、assessment_enabled=false→跳评估 |
| round + resubmit | 006 + 007 | 仅有当前轮记录 | ApprovalRecord/AssessmentRecord 增 `round`；详情页按 round 折叠；resubmit 弹窗强制 `change_reason ≥ 10` 字符 |
| 创建流程入口 | 003 + 009 | 不存在 | 待开发/开发中/已上线/已下线 显示「创建流程」按钮；弹窗填流程名（必填）+ 开发者姓名（可选）；首个流程触发 待开发→开发中 |
| 分类标签 | 017 | 已存在 ClassificationTagsField | 提交时校验「至少 1 个标签」（已存在校验需要核对） |
| 可见性 | 018 | Mock 当前直接返回全量 | mock 层加入部门/工作空间/创建人 三层过滤 |
| 跨模块 | 019 | Process 实体无 developer_name | Process 加 developer_name；开发中心/调度中心列表展示「关联需求」 |

## 执行批次

### Batch 1（本轮）— 基线对齐
- [x] 编写本计划文档
- [ ] 状态文案全量重命名 「待立项 → 待开发」（i18n + 引导文案 + Toast）

### Batch 2 — 审批流体系骨架（最大块）
- 方案多激活；移除 Scheme 审批流绑定 UI（详情/列表/构建器）
- 审批流模板列表：移除「绑定到方案」；新增「绑定部门数」列；多激活
- 新增菜单「部门审批流绑定」：路由 `/requirements/department-approval-binding`
  - 左侧 Tree（部门），右侧当前部门绑定的审批流模板（可改绑/解绑）
  - 数据：新增 `mocks/departmentApprovalFlowBinding.ts`
- 编辑模板时，名字与上面 v4 保持一致（默认审批流程 不可删但可编辑）

### Batch 3 — 提交/审批/评估运行时
- 提交逻辑改造：按部门查模板，三种跳过路径
- round 概念入 ApprovalRecord / AssessmentRecord（mock + types）
- ApprovalSection / TechnicalAssessmentSection 按 round 折叠
- Resubmit 弹窗：变更说明必填 ≥ 10 字符，写 ChangeLog(`RESUBMIT`)

### Batch 4 — 创建表单与方案
- 创建需求表单顶部「需求方案」下拉（从所有 is_active 方案中选）
- 表单按所选方案 form 节点动态渲染
- 4 个系统固定字段：岗位级别 / 岗位成本 / 执行频率 / 单次时长
- 分类标签必选校验

### Batch 5 — 创建流程入口（详情页）
- 待开发/开发中/已上线/已下线 显示「创建流程」按钮
- 弹窗：流程名（必填）+ 开发者姓名（可选）
- 触发 待开发→开发中（首个流程）
- 详情页「已创建流程」列表 Tab

### Batch 6 — 可见性与跨模块
- mock requirements 列表加可见性过滤（部门成员 / 创建人 / 工作空间）
- Process 加 developer_name；开发中心 / 调度中心列表展示「关联需求」

## 路由与菜单

```
需求中心
├── 需求工作台         /requirements/workbench
├── 配置需求
│   ├── 需求模板         /requirements/scheme           (方案管理)
│   ├── 审批流管理       /requirements/approval-config  (审批流模板)
│   └── 部门审批流绑定   /requirements/department-approval-binding  ★新增
├── 需求评审           /requirements/review
├── 需求评估           /requirements/assessment
└── 需求项目           /requirements/projects
```

## 开放问题（先按下列假设推进，如不同意告诉我即可）

1. **状态枚举值** `PENDING_PROJECT` 是否需改成 `PENDING_DEVELOPMENT`？本计划假设：**不改**，仅改文案，避免破坏 mock/数据迁移。
2. **「部门审批流绑定」页面**采用「左部门树 + 右当前绑定」的主从布局；也可以做成简单的「部门列表 + 行内下拉选模板」表格。本计划假设：**主从布局**（更适合多部门批量管理）。
3. **预设方案能否被「停用」？** 文档说「不可删除」，未明确能否停用。本计划假设：**预设方案可激活/取消激活但不可删除**。
4. **创建流程按钮**仅在用户具备 `Perm.ProcessDev.CREATE` 权限时显示。Mock 阶段一律显示。
