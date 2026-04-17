

# 阶段 1 实施计划：基础架构 + 方案管理页

## 一、目标

交付独立可用的基础设施 + 方案管理页，为后续阶段做铺垫。本阶段不破坏现有需求列表/详情/审核的可用性（旧弹窗占位、详情简化、审核仅适配状态映射）。

## 二、文件清单

### 1. 类型与数据层（重构）

**`src/pages/Requirements/RequirementsWorkbench/types.ts`** [重写]
- 9 状态：`DRAFT | PENDING_APPROVAL | PENDING_ASSESSMENT | PENDING_PROJECT | DEVELOPING | LAUNCHED | OFFLINE | REJECTED | WITHDRAWN`
- `RequirementScheme`：id、code、name、version、status(active/inactive)、is_preset、custom_fields、value_assessment_model、complexity_assessment_model、approval_flow、cost_config、created_at
- `SchemeField`：key、label、type(13种)、required、placeholder、options、depends_on、validation、expression(calculation)、description
- `AssessmentModel`：dimensions[{key,label,weight,source_field,expression?}]、tiers[{condition,score,label}]、weight(总权重)
- `ApprovalFlowConfig`：levels[{order,name,approver_type,approver_ids}]
- `CostConfig`：avg_hourly_cost、working_hours_per_day、working_days_per_month、custom_basis
- `ApprovalRecord`：id、req_id、level、approver_id、approver_name、status(pending/approved/rejected)、comment、acted_at
- `AssessmentRecord`：id、req_id、type(value/complexity)、assessor_id、scores、tier_results、total_score、acted_at
- `RequirementVersion`：version、snapshot(RequirementItem)、change_log、created_by、created_at
- `LinkedEntity`：id、type(workspace/process)、name、status
- `RequirementItem` [新结构]：id、req_no(REQ-YYYY-NNNN)、scheme_id、scheme_version、title、department_id/name、owner_id/name、status、form_data(动态)、value_score、complexity_score、approvals[]、assessments[]、versions[]、linked_entities[]、cost_estimation、creator/timestamps、version

**`src/pages/Requirements/RequirementsWorkbench/mockData.ts`** [重写]
- 8-12 条覆盖 9 状态的 mock 需求，form_data 对应预设 Scheme
- 内置审批/评估/版本/关联记录

**`src/pages/Requirements/RequirementsWorkbench/schemeConfig.ts`** [新增]
- 3 个预设 Scheme JSON：
  - `RPA-PRO`：RPA 专业版（完整 13 字段、价值+复杂度双模型、3 级审批）
  - `RPA-LITE`：RPA 轻量版（精简 6 字段、单评估、1 级审批）
  - `ADP-DOC`：AI 文档处理（含 OCR 维度、文档相关字段）

**`src/pages/Requirements/RequirementsWorkbench/statusConfig.ts`** [新增]
- 9 状态 → 颜色（Semi tag color）/ 中英标签 / 图标 / 可执行操作集合 映射

### 2. 方案管理页（新增）

```
src/pages/Requirements/RequirementsScheme/
├── index.tsx + index.less        列表（卡片网格）+ 上传按钮 + 搜索
├── schemeYamlParser.ts            js-yaml 解析 + 4 节点结构校验 + 错误行号
└── components/
    ├── SchemeCard/                单卡片（名称/版本/状态徽标/激活/预设标签/操作菜单）
    ├── SchemeDetailDrawer/        900px 抽屉，Tabs：基本信息 / 表单字段 / 评估模型 / 审批流程 / 成本配置（只读展示）
    ├── SchemeUploadModal/         520px，Lucide Inbox 拖拽 + YAML 解析预览 + 校验错误列表
    ├── SchemeActivateModal/       520px 激活确认（提示同租户唯一激活）
    └── SchemeVersionDrawer/       版本历史列表 + 切换查看
```

依赖：新增 `js-yaml` + `@types/js-yaml`。

### 3. 列表页轻量适配

**`src/pages/Requirements/RequirementsWorkbench/index.tsx`** [改]
- 列：编号 / 标题 / 部门 / 归属人 / 状态(新9态) / 价值得分 / 复杂度得分 / 创建时间 / 操作
- 状态 Tag 改用 `statusConfig`
- 创建/编辑弹窗、详情抽屉本阶段保留旧实现（仅适配新字段读取，避免崩溃；完整重构在阶段 2）

**`src/pages/Requirements/RequirementsReview/index.tsx`** [改]
- 状态映射改为新 9 态，待审批=`PENDING_APPROVAL`、评估中=`PENDING_ASSESSMENT`、已通过=`PENDING_PROJECT`及以后、已驳回=`REJECTED`
- 不动布局/页签结构

### 4. 路由 + 侧边栏 + i18n

- `src/router/routes.tsx`：新增 `/requirements/scheme` → `RequirementsScheme/index.tsx`
- `src/components/Layout/AppLayout`（或对应 Sidebar 配置）：需求中心菜单组下加"方案管理"子项（Lucide `Settings2` 图标）
- `public/i18n/zh-CN.json` + `en.json`：新增 `requirements.scheme.*`、`requirements.status.*`(9 态)、`requirements.field_type.*`(13 类) 翻译

## 三、关键实现要点

- **YAML 校验**：必须包含 `meta`、`custom_fields`、`assessment_models`、`approval_flow` 四节点；审批 `approver_type` 仅支持 `user/role/department`，其他拦截并提示行号。
- **激活互斥**：mock 阶段在内存维护"当前激活 scheme_id"，激活新方案时把旧的置 inactive。
- **预设保护**：`is_preset=true` 的方案禁止删除/编辑，仅可查看与基于其上传新版本。
- **抽屉规范**：900px、`DetailDrawerWrapper`、maskless、Tab 持久化。
- **空态**：方案管理空态用标准 EmptyState PNG + "上传方案"按钮。

## 四、风险与边界

- 阶段 1 不重构 `RequirementFormModal` 与 `RequirementDetailDrawer` 内容（避免一次改动过大）。旧字段缺失时显示 `-` 占位。
- `RequirementsReview` 仅做状态映射兼容，不调整页签 KPI。
- 阶段完成后用户可：浏览方案列表 / 上传 YAML / 查看预设方案配置 / 激活方案 / 查看版本，列表可看到新 9 态正确渲染。

## 五、验收点

1. 侧边栏「需求中心 → 方案管理」可访问 `/requirements/scheme`
2. 默认看到 3 个预设方案，其中 1 个为激活状态
3. 上传非法 YAML 显示错误行号；合法 YAML 创建新方案
4. 激活新方案后旧激活自动失效
5. 需求列表的状态列正确显示新 9 态颜色
6. `RequirementsReview` 页签计数与跳转不报错

