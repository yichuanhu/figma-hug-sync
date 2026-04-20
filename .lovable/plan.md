
## 目标
把上一版「关联需求」筛选从 radio + 二级 checkbox 改成与「归属部门」一致的**下拉多选**形态，单一控件解决"是否关联 / 关联哪些"两个意图。

## 设计对齐
参照 `DepartmentSelect`（TreeSelect 多选）和 `OwnerSelect` 的体验，「关联需求」筛选采用 Semi UI `Select multiple` 下拉多选：
- 选项 = 所有"已被流程关联过"的需求 brief（id/name/status）+ 顶部固定一项「未关联需求」（特殊 value: `__UNLINKED__`）
- 支持搜索（filter，按 name/编号）
- maxTagCount=1，溢出折叠为 `+N`
- 宽度 240px，与部门筛选保持一致

筛选语义：
- 选中若干需求 id → 命中 `process.requirement_id ∈ 选中集合`
- 选中「未关联需求」→ 命中 `!process.requirement_id`
- 二者可共存（OR 关系）
- 全不选 = 不过滤

## 改动点

### 1. 流程列表筛选
- 删除上版方案中的 `requirementLink` radio + `requirementId` checkbox 两个 section。
- 新增一个独立的下拉多选控件，与「归属部门」并排放在筛选条工具栏（不进 FilterPopover；与 DepartmentSelect 同层级）。
- 选项数据来自一次性加载的 `requirementBriefMap`，按 name 排序；含「未关联需求」固定首项。
- 过滤逻辑写入列表 `useMemo`。

### 2. 表格列「关联需求」
- 渲染保持上版方案：`Tag`（蓝色 light + Link 图标），点击 stopPropagation + `navigate('/requirements/workbench', { state: { openRequirementId } })`，无值显示 `-`。

### 3. 跨页跳转接收
- `RequirementsWorkbench/index.tsx` 监听 `location.state.openRequirementId`，命中后打开详情抽屉并清理 state。

### 4. mock & i18n
- 复用 `fetchRequirementBriefByIds`（如未提供则新增），返回 `{id, name, status}[]`。
- i18n 新增：`processManagement.fields.linkedRequirement`、`processManagement.filter.requirementPlaceholder`、`processManagement.filter.unlinked`、`common.viewRequirement`（中英）。

### 5. 文档
- `.lovable/plan.md` 追加「关联需求列与多选筛选」小节，明确"下拉多选 + 未关联特殊项"的语义。

## 不做
- 不动需求详情抽屉。
- 不动创建/编辑流程弹窗。
- 不在筛选里支持需求状态/优先级二级过滤。

## 涉及文件
- `src/components/ProcessManagement/ProcessManagementContent/index.tsx`
- `src/pages/Requirements/RequirementsWorkbench/index.tsx`
- `src/pages/Requirements/RequirementsProjects/mockData.ts`（如需补 brief API）
- `public/i18n/zh-CN.json` / `public/i18n/en.json`
- `.lovable/plan.md`
