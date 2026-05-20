# 需求中心 v5 文档变更适配方案

## 一、变更要点（来自上传的故事文档）

| Story | v5 关键变更 |
|---|---|
| STORY-016 v5 | 审批流模板编辑页新增 **"适用部门"多选** 字段，保存模板时同步写入 `department_approval_flow_binding`；**取消独立的"部门审批流绑定"菜单/页面** |
| STORY-001 / 013 v5 | 需求模板（Scheme）新增 **"适用部门"多选**，保存时同步写入 `department_scheme_binding`；列表展示"适用部门数量" |
| STORY-003 v5 | 创建需求时 **不再手动选模板**，按用户所属部门自动匹配；部门未绑定方案 → 阻止创建，提示「当前部门没有生效的需求模板」 |
| STORY-006 / 007 | 部门未绑定审批流 → 跳过审批和评估，直接进入"待开发" |
| STORY-017 | 分类标签必填（已实现，复核保持） |
| STORY-019 | 流程模型加 `developer_name`，列表按 `requirement_id` 筛选，调度中心展示关联需求 |

## 二、页面与交互改造

### 1. 审批流管理（ApprovalConfig）— 模板编辑弹窗
新增一个"适用部门"区块（位于"基本信息"之后、"审批配置"之前）：
- 字段：`applicable_department_ids: string[]`，使用 `DepartmentSelect` 多选（`multiple` + `checkRelation="unRelated"`）
- 说明文案：「选择该审批流模板适用的部门，部门发起的需求将走该流程；同一部门同时被多个激活模板选中时，按最近更新优先」
- 列表卡片：将原"N 个部门已绑定"Tag 改为 "适用 N 个部门"，hover Popover 展示部门名清单
- 保存模板：在 `updateApprovalFlow / createApprovalFlow` 内同步调用 `setDepartmentApprovalFlowBindings(templateId, deptIds)`，覆盖式写入

### 2. 删除 "部门审批流绑定" 独立菜单
- 移除路由 `/requirements/department-approval-binding`
- 移除侧边栏 "Dept Approval Binding" 入口
- 保留 `src/mocks/departmentApprovalFlowBinding.ts` 作为底层存储（继续被审批流和运行时消费）
- `DepartmentApprovalBinding/` 目录删除

### 3. 需求模板管理（RequirementsScheme）
- 列表卡片新增 "适用 N 个部门" Tag（点击查看部门列表 Popover）
- Scheme 类型扩展 `applicable_department_ids?: string[]`
- 方案构建器（SchemeBuilder）头部 / 表单 Tab 顶部新增"适用部门"多选条
  - 位置：放在 FormBuilder 上方一个 Banner 行，标签 + 多选 + 提示
  - 修改触发 dirty，保存时同步写 `department_scheme_binding`

### 4. 新增 mock：`src/mocks/departmentSchemeBinding.ts`
对称于审批流绑定，提供：
```ts
getSchemeByDepartmentId(deptId): SchemeId | null
setDepartmentSchemeBindings(schemeId, deptIds[])
getBoundDepartmentIdsByScheme(schemeId)
listAllBindings()
```
同一部门只能绑定一个生效方案（与多模板激活并存 → 保存时若部门已被其他方案占用，提示二次确认覆盖）。

### 5. 创建需求流程（RequirementCreatePage）
- **移除** Step 0 的"需求方案"下拉选择
- 进入页面时根据 `MOCK_CURRENT_USER.department_id` 调用 `getSchemeByDepartmentId(deptId)`：
  - 命中 → 顶部展示只读 Banner「使用模板：xxx（适用于 xx 部门）」，照常渲染字段
  - 未命中 → 全屏 EmptyState「当前部门没有生效的需求模板」+ 主按钮"返回需求列表"，副按钮（管理员可见）"前往需求模板管理"
- 表行级"新建"入口前置同样校验（无模板时弹 Toast 拦截）

### 6. 运行时联动（已部分实现，复核）
- `resolveRuntimeFlagsByDepartment(deptId)`：维持当前逻辑（无绑定 → 跳过审批 + 评估 → 直接 `PENDING_PROJECT`）
- 提交需求时若仍需校验分类标签 ≥ 1（STORY-017 已实现，保留）

### 7. i18n
新增 key（zh-CN + en）：
- `requirements.scheme.applicableDepartments` / `requirements.approvalFlow.applicableDepartments`
- `requirements.create.noSchemeForDepartment` / `noSchemeHint`
- `requirements.scheme.deptConflictTitle` / `deptConflictContent`

## 三、技术实现要点

```text
src/
├─ mocks/
│  ├─ departmentSchemeBinding.ts                [新增]
│  └─ departmentApprovalFlowBinding.ts          [保留，仅作存储]
├─ pages/Requirements/
│  ├─ ApprovalConfig/
│  │  ├─ index.tsx                              [改：卡片显示适用部门数]
│  │  └─ components/ApprovalFlowBuilder/        [改：新增适用部门字段]
│  ├─ DepartmentApprovalBinding/                [删除]
│  ├─ RequirementsScheme/
│  │  ├─ index.tsx                              [改：卡片显示适用部门数]
│  │  └─ components/SchemeBuilder/index.tsx     [改：头部新增适用部门]
│  └─ RequirementsWorkbench/
│     ├─ components/RequirementCreatePage/      [改：移除手选模板 + 无模板拦截]
│     ├─ mockData.ts                            [改：createRequirement 按部门解析模板]
│     └─ schemeConfig.ts                        [改：activate/save 同步部门绑定]
├─ App.tsx                                       [改：移除绑定路由]
└─ components/layout/Sidebar/index.tsx          [改：移除菜单项]
```

冲突策略：
- 一个部门只能被一个 Scheme 绑定（创建需求查找唯一）
- 一个部门只能被一个 ApprovalFlow 绑定（同上）
- 保存时若发生覆盖，弹 Modal.confirm 提示「部门 X 当前绑定的是 Y，是否改绑为本模板？」

## 四、交付顺序（建议单轮一次完成）
1. 新增 `departmentSchemeBinding.ts` mock
2. 审批流模板编辑器加"适用部门"字段 + 保存联动 + 列表展示
3. 需求模板构建器加"适用部门"字段 + 保存联动 + 列表展示
4. 删除独立绑定页面 + 菜单 + 路由
5. 改造需求创建流程（按部门解析 + 空态拦截）
6. i18n 补齐 + 视觉验收

## 五、待确认问题
1. **冲突覆盖策略**：同一部门被多个模板/方案选中时，是「弹确认覆盖」还是「允许多选不报错，运行时取最近更新」？计划默认采用前者（更稳）
2. **空态页"前往需求模板管理"按钮**是否仅管理员可见？还是所有用户都展示
3. 当前管理员演示登录是否需要切换默认 `MOCK_CURRENT_USER.department_id` 已绑定方案，以确保创建路径仍可演示？