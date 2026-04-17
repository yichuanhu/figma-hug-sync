

# 需求中心重构 — 完整规划方案

## 一、核心理解

新需求中心的本质转变：从**硬编码评估表单 + 4 维状态**升级为 **Scheme 驱动 + 9 状态生命周期**。一个核心点贯穿全局：
- **方案 (Scheme)** 是租户级配置，决定表单字段、评估模型、审批流程；
- **需求 (Requirement)** 的 form_data 完全由激活 Scheme 的 custom_fields 动态决定；
- **前半段状态**（草稿→待立项）由审批/评估流推动；**后半段**（开发中→已上线/已下线）由项目/工作空间侧关联结果与流程状态自动聚合（本期 mock 模拟）；
- **版本管理**：编辑即创建快照；列表只看最新版，详情可切版本。

## 二、目录与新增/重构清单

```text
src/pages/Requirements/
├── RequirementsWorkbench/        [重构]
│   ├── types.ts                  [全新] 9 状态、Scheme/Field/Assessment/Approval 类型
│   ├── mockData.ts               [全新] Mock 需求 + 审批/评估/版本/关联
│   ├── schemeConfig.ts           [新增] 内置 3 个预设 Scheme（RPA 专业版/轻量版/AI 文档）
│   ├── statusConfig.ts           [新增] 9 状态颜色/标签/可执行操作映射
│   ├── index.tsx + .less         [重构] 列表（编号/标题/部门/状态/价值&复杂度得分/创建时间）
│   └── components/
│       ├── DynamicSchemeForm/    [新增-核心] 13 类型字段渲染引擎 + depends_on
│       │   ├── index.tsx
│       │   ├── FieldRenderer.tsx
│       │   ├── fields/{Text,Textarea,Number,Percentage,Select,MultiSelect,
│       │   │           Radio,Checkbox,CheckboxGroup,Date,FileUpload,
│       │   │           RichText,Calculation}.tsx
│       │   └── useSchemeForm.ts
│       ├── RequirementFormModal/ [重构] 系统字段 + DynamicSchemeForm
│       ├── RequirementDetailDrawer/ [重构-Tab 化]
│       │   ├── index.tsx         （顶部含版本切换 + 状态聚合摘要）
│       │   ├── BasicInfoTab/
│       │   ├── AssessmentTab/    （价值评估 / 复杂度评估，分组+档位）
│       │   ├── ApprovalTab/      （多级串行进度）
│       │   ├── ImplementationTab/
│       │   ├── LinkedEntitiesTab/（项目/工作空间/流程列表，只读）
│       │   ├── CostEstimationTab/（成本基线 + 预估节省，公式透明）
│       │   └── VersionHistoryDrawer/（版本列表 + 只读切换）
│       └── assessmentEngine.ts   [新增] expression 解析 + tier 匹配 + 加权聚合
├── RequirementsReview/           [重构] 适配新 9 状态（待审批/待评估页签）
├── RequirementsScheme/           [新增] 方案管理页（/requirements/scheme）
│   ├── index.tsx + .less
│   ├── components/
│   │   ├── SchemeCard/           （方案卡片：激活/未激活/预设标签）
│   │   ├── SchemeDetailDrawer/   （Tab：基本信息/表单字段/评估模型/审批流程/成本配置）
│   │   ├── SchemeUploadModal/    （YAML 上传 + 校验 + 错误行号提示）
│   │   ├── SchemeActivateModal/  （激活确认）
│   │   └── SchemeVersionDrawer/  （版本历史）
│   └── schemeYamlParser.ts       [新增] js-yaml 解析 + 结构校验
└── RequirementsTeam/             [保留]
```

外围：
- `src/router/routes.tsx`：新增 `/requirements/scheme`
- `src/components/Layout/AppLayout`：侧边栏需求中心增加"方案管理"菜单项
- `public/i18n/{zh-CN,en}.json`：新增状态/Scheme/字段类型翻译
- 删除/废弃：旧 `TechnicalAssessmentSection`、旧 4 维状态相关组件

## 三、分阶段实施

### 阶段 1：基础架构 + 方案管理页（独立可交付）
- 重构 `types.ts`：9 状态、Scheme、SchemeField、AssessmentModel、ApprovalRecord、AssessmentRecord、Version
- 重构 `mockData.ts` + 新增 `schemeConfig.ts`（3 个预设 Scheme YAML 对应 JSON）
- 新增 `RequirementsScheme/`：列表/详情/上传/激活/版本历史
- 路由 + 侧边栏 + i18n
- 更新 `RequirementsWorkbench/index.tsx` 列表列与状态映射（先用旧弹窗占位，详情抽屉先简化）

### 阶段 2：动态表单 + CRUD 重构
- 新增 `DynamicSchemeForm/` 完整 13 字段类型 + depends_on + 验证
- 重构 `RequirementFormModal`：系统字段（标题/部门/归属人）+ 动态字段
- 重构 `RequirementDetailDrawer` 为 Tab 结构：BasicInfoTab + ImplementationTab
- 实现需求编号自动生成 `REQ-YYYY-NNNN`
- 草稿保存允许 department_id/owner_id 为空，提交校验

### 阶段 3：审批 + 评估
- 新增 `assessmentEngine.ts`：expression 解析（四则运算 + source_fields 替换）+ tier 自动匹配
- AssessmentTab：价值评估（扁平+自动计算）+ 复杂度评估（分组+档位）+ 加权综合得分
- ApprovalTab：多级串行进度（"第 N/M 级审批中"）+ 通过/拒绝/撤回
- 提交前校验：Scheme 必填字段 + department_id/owner_id 必须补全
- 重构 `RequirementsReview/`：待我审批 / 待我评估 / 全部 页签

### 阶段 4：生命周期 + 成本预估 + 版本管理
- LinkedEntitiesTab：mock 关联工作空间 + 流程状态列表
- CostEstimationTab：成本基线展示 + 月均节省工时/人天/金额计算（公式透明）
- 状态聚合（mock）：基于关联流程状态自动算"开发中/已上线/已下线"
- VersionHistoryDrawer：版本列表 + 只读切换 + 变更日志
- 详情抽屉顶部加版本下拉，重新提交自动 version+1

## 四、关键技术要点

- **DynamicSchemeForm**：基于 Semi UI Form，根据 `field.type` 分发到子组件；`depends_on` 用 useEffect 监听依赖字段控制显隐；`calculation` 字段实时执行 expression。
- **assessmentEngine**：`evalExpression(expr, formData, sourceFields)` 安全四则运算（不用 eval，自实现 token 解析或用 mathjs 子集）；`matchTier(value, tiers)` 顺序匹配 condition。
- **状态机**：在 `statusConfig.ts` 集中定义可执行操作（哪些状态可编辑/删除/提交/审批/评估/下线），抽屉操作按钮基于此动态渲染。
- **版本快照**：mock 阶段在内存维护 `versions: RequirementItem[]`，编辑保存时 push 当前快照，主对象 `version+1`。
- **YAML 解析**：使用 `js-yaml`（已在依赖中或新增），校验四个核心节点 + 不支持的审批人类型拦截。
- **遵守项目规范**：900px 抽屉（DetailDrawerWrapper）、520px 模态、24px padding、Lucide 图标、Semi 原生表单校验、分页 size="small" + 外置 `.list-pagination`、归属字段顺序：标题→部门→归属人→描述。

## 五、风险与开放问题

1. **工作量评估**：4 阶段约相当于 4 个独立 feature。建议每阶段交付后用户验证再继续。
2. **YAML 编辑**：本期仅支持上传，不提供 GUI 编辑器（与 Story 一致）。
3. **后端依赖**：项目/工作空间关联（FEAT-009）尚未实现，本期 LinkedEntities 用 mock 数据展示。
4. **历史数据兼容**：旧 mock 数据将完全替换为新结构，无需迁移逻辑。

**建议从阶段 1 开始**，因为它是所有后续阶段的基础，且独立可交付（方案管理页可立即使用）。请确认是否按此方案执行，或希望调整阶段顺序/范围。

