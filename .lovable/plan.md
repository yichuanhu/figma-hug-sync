# 需求中心重构方案

## 背景

当前需求中心基于简化的四维状态模型（DRAFT/PENDING/APPROVED/REJECTED/ASSESSING 等 10 种状态），使用硬编码表单和固定评估维度。新需求文档引入了 **Scheme 驱动**的架构，核心变化包括：

1. **状态流简化为 9 种**：草稿、待审批、待评估、待立项、开发中、已上线、已下线、已拒绝、已撤销
2. **Scheme 动态表单**：表单字段由激活的 RequirementScheme 配置驱动，支持 13 种字段类型
3. **双模型评估**：价值评估 + 复杂度评估，分别评分、分别展示，支持分组和自动计算维度
4. **多级串行审批**：按 priority 逐级审批，同级支持 any_one/all/majority 模式
5. **生命周期状态聚合**：后半段（开发中/已上线/已下线）由工作空间内流程状态自动聚合
6. **需求编号**：`REQ-YYYY-NNNN` 格式，草稿创建时自动生成
7. **版本管理**：需求变更自动创建版本快照，详情页支持切换查看历史版本
8. **成本预估**：基于 Scheme 的 cost_config 自动计算预估节省工时/金额
9. **新增 Scheme 管理页**：管理员上传/激活/版本管理 RequirementScheme

---

## 实现范围（按 Story 分阶段）

### 阶段一：基础重构 — 类型/状态/Mock/Scheme 管理页

**涉及 Story**: STORY-001 (Scheme 管理) + 基础架构

1. **重构 types.ts** — 全新数据模型
   - `RequirementStatus`: 9 种状态（DRAFT, PENDING_APPROVAL, PENDING_ASSESSMENT, PENDING_PROJECT, IN_DEVELOPMENT, LIVE, DEPRECATED, REJECTED, WITHDRAWN）
   - 移除 `RequirementPriority`（优先级不再是固有属性，由 Scheme 自定义字段承担）
   - 新增 `RequirementScheme`、`SchemeFieldDefinition`、`AssessmentModelConfig`、`WorkflowConfig` 等类型
   - 新增 `ApprovalRecord`、`AssessmentRecord` 记录类型
   - `RequirementItem` 重构：增加 `number`、`department_id`、`owner_id`、`form_data`、`assessment_data`、`scheme_id`、`scheme_version`、`version`、`parent_version`、`is_latest`、`linked_workspace_id` 等字段

2. **重构 mockData.ts** — 匹配新数据模型
   - 状态配置映射新的 9 种状态
   - Mock 数据包含 `form_data`（RPA 专业版 Scheme 字段数据）
   - 内置 3 个预设 Scheme（RPA 专业版、轻量版、AI 文档处理版）的 Mock 配置
   - 增加 Mock 审批记录和评估记录

3. **新增 Scheme 管理页** (`/requirements/scheme`)
   - 页面结构：预设方案列表 + 当前激活方案 + 自定义方案上传
   - 方案卡片展示：名称、描述、版本、状态（激活/未激活/预设）
   - 方案详情抽屉：展示表单字段、评估模型、工作流配置（只读）
   - 激活操作：确认弹窗，切换激活方案
   - YAML 文件上传：校验 + 保存
   - 版本历史列表

4. **更新 i18n** — 新增所有新状态和 Scheme 相关翻译
5. **更新路由** — 新增 `/requirements/scheme` 路由
6. **更新侧边栏** — 需求中心增加"方案管理"菜单项

---

### 阶段二：需求列表与增删改查重构

**涉及 Story**: STORY-003

1. **重构列表页** (`RequirementsWorkbench/index.tsx`)
   - 表格列调整：编号（number）、标题、部门、状态（新 9 种）、评估得分（价值/复杂度）、创建时间
   - 移除优先级列和筛选（由 Scheme 自定义字段承担）
   - 筛选器调整：状态（新 9 种）、部门、时间范围
   - 支持按评估得分排序
   - 操作栏根据新状态调整可见性规则
   - 移除批量导入按钮（后续实现）

2. **重构新建/编辑弹窗** (`RequirementFormModal`)
   - 系统固定字段：标题、所属部门（DepartmentSelect）、归属用户（OwnerSelect）
   - **Scheme 动态表单渲染引擎**：新增 `DynamicSchemeForm` 组件，根据激活 Scheme 的 `custom_fields` 配置动态渲染
   - 支持 13 种字段类型：text、textarea、number、percentage、select、multi_select、radio、checkbox、checkbox_group、date、file、rich_text、calculation
   - 字段间依赖逻辑（depends_on）
   - 保存草稿：只校验已填写字段格式，department_id/owner_id 可为空
   - 需求编号：创建时自动生成 `REQ-YYYY-NNNN`

3. **重构详情抽屉** (`RequirementDetailDrawer`)
   - 改为 Tab 结构：基本信息、评估、实施方案、关联结果、成本预估
   - 基本信息 Tab：系统字段 + Scheme 动态字段渲染（只读态）
   - 版本切换（详情页顶部版本下拉）
   - 操作按钮根据状态和角色动态显示（编辑/提交/审批/评估/下线等）
   - 右侧属性面板：状态、部门、归属用户、编号、创建/更新时间
   - 活动流保留

---

### 阶段三：审批与评估流程

**涉及 Story**: STORY-006 (审批) + STORY-007 (评估)

1. **审批模块重构**
   - 提交审批前校验：Scheme 必填字段 + department_id/owner_id 必须补全
   - 多级串行审批 UI：审批进度展示（"第 2/3 级审批中"）
   - 每级审批人、状态、意见展示
   - 审批操作：通过/拒绝/撤回
   - 审批历史记录

2. **评估模块重构** (`TechnicalAssessmentSection` → `AssessmentSection`)
   - 基于 Scheme 的 assessment.models 动态渲染评估表单
   - 价值评估：扁平维度展示，支持自动计算维度（expression 解析）
   - 复杂度评估：分组展示（groups），手动选择档位打分
   - 模型内加权求和自动计算
   - 评估通过/拒绝操作
   - 评估历史记录

3. **审核页面重构** (`RequirementsReview`)
   - 适配新状态流（待审批/待评估）
   - 统计卡片更新

---

### 阶段四：生命周期聚合、成本预估、版本管理

**涉及 Story**: STORY-009 (生命周期) + STORY-010 (成本) + STORY-012 (版本)

1. **关联结果 Tab**
   - 展示已关联的工作空间信息（只读）
   - 该工作空间内属于此需求的流程列表及各流程状态
   - 关联的文档应用和智能助手列表

2. **成本预估 Tab**
   - 成本基线数据展示（来自 form_data）
   - 预估节省自动计算（月均节省工时/人天/金额）
   - 计算公式透明展示
   - 按部门聚合视图（可选）

3. **版本管理**
   - 详情页版本下拉切换
   - 历史版本只读展示
   - 变更日志

4. **生命周期状态聚合**（Mock 模拟）
   - 开发中/已上线/已下线状态基于关联流程 Mock 数据自动计算

---

## 技术要点

```text
src/pages/Requirements/
├── RequirementsWorkbench/          # 需求列表（重构）
│   ├── types.ts                    # 全新类型定义
│   ├── mockData.ts                 # 全新 Mock 数据
│   ├── schemeConfig.ts             # 预设 Scheme 配置（RPA 专业版等）
│   ├── index.tsx + index.less      # 列表页（重构）
│   └── components/
│       ├── RequirementFormModal/   # 新建/编辑（重构）
│       ├── RequirementDetailDrawer/ # 详情抽屉（重构为 Tab）
│       │   ├── BasicInfoTab/       # 基本信息 Tab
│       │   ├── AssessmentTab/      # 评估 Tab
│       │   ├── ImplementationTab/  # 实施方案 Tab
│       │   ├── LinkedEntitiesTab/  # 关联结果 Tab
│       │   └── CostEstimationTab/  # 成本预估 Tab
│       └── DynamicSchemeForm/      # 动态表单渲染引擎（核心新组件）
│           ├── index.tsx           # 表单容器
│           ├── FieldRenderer.tsx   # 字段类型分发
│           ├── fields/             # 各字段类型组件
│           └── useSchemeForm.ts    # 表单状态管理 Hook
├── RequirementsReview/             # 审核页（重构）
├── RequirementsScheme/             # 方案管理页（新增）
└── RequirementsTeam/               # 团队成员（保持）
```

- **DynamicSchemeForm** 是核心新组件，根据 Scheme 的 `custom_fields` 配置动态渲染 Semi UI 表单组件
- **评估引擎** 需支持 expression 解析（四则运算 + source_fields 变量替换）和 tier 自动匹配
- 所有新增页面遵循项目标准：Semi UI 组件、24px padding、Lucide 图标、DetailDrawerWrapper 抽屉
