## 背景

根据 STORY-016/021/006/007 v5/v6 更新：审批流和评估流配置正式拆分为两个独立菜单；评估模型固定为「价值评估 + 复杂度评估」两个模型，每个模型含可配置维度（tier_select / numeric_input 混合输入），按权重自动计算；「技术评估」改名为「需求评估」；详情页操作区按新流程渲染。

## 实施范围

### 1. 菜单与路由拆分
- 在「需求中心 > 配置需求」下新增「评估流配置」菜单
- 现有「审批与评估配置」更名为「审批流配置」
- 路由：`/requirements/approval-config`（保留）+ 新增 `/requirements/assessment-config`
- 在 `src/components/layout` 侧边栏配置中新增菜单项

### 2. 审批流配置页面（精简）
- 当前 ApprovalConfig 页面已包含审批+评估的混合编辑，需移除「评估」相关 Tab/字段，仅保留多级串行审批阶段（name / approver_type / approval_mode / approver_ids）与适用部门
- 列表列：模板名称、审批级数、绑定部门、状态、操作

### 3. 评估流配置页面（新建，重绘）
- 路径：`src/pages/Requirements/AssessmentConfig/`
- 列表页：模板名称、评估级数、维度数量、绑定部门、状态、操作
- 编辑页（与 ApprovalConfig 同结构）：
  - **评估阶段**：多级串行（priority / name / assessor_type / assessment_mode / assessor_ids），与审批阶段结构一致，复用 `SchemeApprovalFlowEditor` 风格
  - **评估模型**（固定 2 个 Tab：价值评估 / 复杂度评估）：
    - 模型级：name、description
    - 维度列表：name、key、description、input_type(tier_select/numeric_input)、weight（同模型权重和 = 1）、unit（数值时）
    - 档位编辑：tier_select 时 label+score；numeric_input 时 label+min/max+score
  - 适用部门多选
  - 平台预设只读、复制、激活/停用/删除生命周期与审批流一致
- Mock 数据：`mockData.ts` 提供 1 个平台预设 + 1-2 个租户模板，含完整价值+复杂度模型示例

### 4. 需求详情页 — 评估 Tab 改造
- 文案：所有「技术评估」改为「需求评估」（i18n key 保留，仅文案改）
- `AssessmentTab` 重绘：
  - 顶部 Banner：显示当前评估阶段 `L1/Lx · 阶段名` + 评估人列表 + 完成状态
  - 「价值评估」「复杂度评估」两块卡片，按快照 `assessment_flow_config_snapshot.models` 动态渲染维度
    - `tier_select`：RadioGroup 显示 label(score)
    - `numeric_input`：InputNumber + 单位 + 实时显示命中档位
  - 每个模型显示综合得分 = SUM(维度得分 × 权重)
  - 评估意见 TextArea
  - 「评估通过」「评估拒绝」按钮（拒绝需填原因）
- 只读态：已评估或非当前评估人显示其他人提交的聚合结果（各维度平均值）
- 详情页右侧操作区（`ApprovalSection` 兄弟 `AssessmentSection`）：
  - 状态 = 待评估、当前用户为本级评估人：显示通过/拒绝按钮，跳转/聚焦到评估 Tab
  - 不是评估人：显示「当前 L{x} {阶段名} 评估中」提示

### 5. Mock 与类型调整
- `mockData.ts`：
  - 拆分 `approvalFlowTemplates` 与 `assessmentFlowTemplates`
  - 拆分 `department_approval_flow_binding` 与 `department_assessment_flow_binding`
  - `submitRequirement` 时分别快照 `approval_flow_config_snapshot` 与 `assessment_flow_config_snapshot`
- 类型 (`types.ts`)：
  - 新增 `AssessmentFlowConfig { levels[], models[] }`，`AssessmentModel { type:'value'|'complexity', name, description, dimensions[] }`，`AssessmentDimension { key, name, input_type, weight, unit?, tiers[] }`
  - `RequirementItem` 增加 `assessment_flow_template_id` / `assessment_flow_config_snapshot` / `assessment_records[]`
  - 旧 `DetailedAssessment` 兼容保留用于已评估展示

### 6. 国际化
- `zh-CN.json` / `en.json`：新增 `requirements.assessmentConfig.*`，「技术评估」→「需求评估」（`requirements.assessment.title` 等）

## 不在本次范围

- AI 辅助评估推荐、加签转签
- 模板历史版本/导入导出
- 真实后端联调（继续用 mock）

## 技术风险

- `RequirementDetailDrawer` 已较复杂，避免破坏审批 Tab 现有逻辑；评估 Tab 单独重写
- mock 数据双绑定迁移需保证存量需求兼容（已有快照保留旧字段）

## 交付清单

- 新增 `src/pages/Requirements/AssessmentConfig/`（index.tsx/less/mockData.ts + components/）
- 修改 `src/pages/Requirements/ApprovalConfig/`：移除评估模块
- 修改 `RequirementDetailDrawer/AssessmentTab/`：动态模型渲染
- 修改 `RequirementsWorkbench` mockData：双快照
- 修改侧边栏菜单 + i18n
