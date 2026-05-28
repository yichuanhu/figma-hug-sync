## 目标

按 STORY-020 在「需求中心 > 配置需求」下新增一个轻量页面「成本基线配置」，用于维护租户级通用成本项清单（岗位 / 活动），供 STORY-003 新建/编辑需求时选择。

v1 范围：只做**列表查看 + 新建 + 编辑**，无删除、无启用/停用、无部门范围、无版本管理。

## 一、路由与侧边栏

- `src/App.tsx`：新增 `/requirements/cost-baseline` → 新页面 `CostBaselineConfigPage`。
- `src/components/layout/Sidebar/index.tsx`：在 `requirementsCenterMenu` 的「配置需求」分组内、`requirementsApprovalConfig` 之后增加：
  - key: `requirementsCostBaseline`
  - labelKey: `sidebar.requirementsCostBaseline`（i18n 文案：成本基线配置 / Cost Baseline）
  - icon: Lucide `Wallet`（stroke 2，size 18）
  - path: `/requirements/cost-baseline`
- `getActiveMenuKey` 加上 `pathname.startsWith('/requirements/cost-baseline')` → `requirementsCostBaseline`。
- `public/i18n/zh-CN.json`、`public/i18n/en.json` 补 `sidebar.requirementsCostBaseline`。

## 二、Mock 层

新建 `src/mocks/requirementCostBaseline.ts`：

- 类型：
  - `CostItemType = 'role' | 'activity'`
  - `CostBaselineItem`：`id / cost_type / name / daily_cost / currency / description? / created_at / updated_at / created_by_name / updated_by_name`
  - `CreateCostBaselineItemInput` / `UpdateCostBaselineItemInput`
- 内存 store + 种子数据：财务专员、高级专员（岗位）、发票录入（活动）等 5 条，币种全部 CNY。
- 方法：
  - `listCostBaselineItems({ keyword?, costTypes? })` — 按 `updated_at desc` 排序，支持关键字（匹配 name / description）与类型多选过滤
  - `getCostBaselineItem(id)`
  - `createCostBaselineItem(input)` — 名称唯一性校验，重复抛 `CostItemNameDuplicatedError`
  - `updateCostBaselineItem(id, input)` — 同名校验（排除自身）
  - `subscribeCostBaselineChange(cb)` — 列表事件订阅，方便弹窗保存后刷新
- 常量 `CURRENCY_OPTIONS = [{ value: 'CNY', label: 'CNY 人民币' }, { value: 'USD', label: 'USD 美元' }, { value: 'EUR', label: 'EUR 欧元' }]`，默认 `CNY`。
- 常量 `COST_TYPE_LABEL: Record<CostItemType, string>`（岗位 / 活动），并附 Tag 颜色映射（role: blue，activity: violet）。

> 注：本 Story 不实际改 STORY-003 的需求基线选择逻辑，仅保留对外暴露的 `listCostBaselineItems` 给后续接入使用。

## 三、页面结构

新建目录 `src/pages/Requirements/CostBaselineConfig/`，约定：

```
CostBaselineConfig/
  index.tsx           # 列表页（标题 + 搜索 + FilterPopover + Table + 分页）
  index.less
  components/
    CostItemFormModal/
      index.tsx       # 使用 FormModal 抽象，新建/编辑共用
      index.less
```

### 3.1 列表页（index.tsx）

- 顶部：`Typography.Title heading={3}` 「成本基线配置」+ 一行 `Text type="tertiary"` 描述「维护租户级通用成本项，供新建/编辑需求时自动带出人天成本」。
- 工具条：
  - 左侧：320px 宽 `Input`（IconSearchStroked 前缀，placeholder「搜索成本项名称」，500ms 防抖）
  - 左侧第二个：`FilterPopover`（按现有标准 280px），分组「成本类型」多选（岗位 / 活动）
  - 右侧：主按钮「新建成本项」（icon Plus）
- 表格（`size="small"`）：
  - 成本类型（Tag，按 `COST_TYPE_LABEL` + 颜色映射）
  - 成本项名称（黑色文本，单行 ellipsis + tooltip）
  - 人天成本（右对齐展示「{currency} {daily_cost.toLocaleString()} / 人天」，例如 `CNY 500 / 人天`）
  - 说明（灰色，单行 ellipsis + tooltip，空值显示 `--`）
  - 更新时间（YYYY-MM-DD HH:mm）
  - 操作（borderless 按钮「编辑」，点击打开 `CostItemFormModal`）
- 空状态：复用 `EmptyState`（`type="no-data"` / `no-result`），文案区分「暂无成本项，点击右上角新建」/「无匹配结果」。
- 分页：项目标准外置 `.list-pagination`，10/20/50。
- 数据通过 `subscribeCostBaselineChange` 自动刷新。

### 3.2 CostItemFormModal

- 基于 `FormModal`：
  - 宽度 520px（标准小模态）
  - 标题：`新建成本项` / `编辑成本项`
  - 字段顺序（与 Story §6.2 一致）：
    1. **成本类型** `Form.RadioGroup type="button"`（岗位 / 活动），必填
    2. **成本项名称** `Form.Input`，必填，maxLength 100，trim 后做唯一性校验（提交时由 mock 抛错 → Toast「成本项名称已存在」）
    3. **人天成本** `Form.InputNumber`，必填，min 0，precision 0，suffix「元/人天」，width 100%
    4. **币种** `Form.Select`，默认 `CNY`，可选 `CNY/USD/EUR`
    5. **说明** `Form.TextArea`，可选，maxLength 500，showClear，autosize {minRows:3,maxRows:6}
  - Semi UI 原生校验（`trigger=['blur', 'change']`），不弹「请填写完整信息」Toast。
- 保存：
  - 新建调用 `createCostBaselineItem`，成功后 `Toast.success('新建成功')` 并关闭弹窗。
  - 编辑调用 `updateCostBaselineItem`，成功后 `Toast.success('修改成功')`。
  - 捕获 `CostItemNameDuplicatedError` → 在「成本项名称」字段下展示「成本项名称已存在」（用 Form 实例 `setError`）。

## 四、权限与不动项

- 不引入新权限点；管理员入口由侧边栏可见性兜底（与 ApprovalConfig 一致）。
- 不改 STORY-003、不改 Dashboard、不改其他详情页。
- Toast 全局 `theme: 'light'` 已配置，无需重复。

## 五、技术细节速览

- 时间格式化复用项目内 `dayjs` 既有约定（与 `RequirementsWorkbench` 一致）。
- 文件夹按项目规范使用 `index.tsx + index.less`，引用走 `@` 别名，无 barrel。
- Tag 颜色取 Semi UI 内置（`color="blue" type="light"`、`color="violet" type="light"`）。
- 列表与弹窗均使用 `.app-layout-content-card` 容器与项目标准 24px padding / 顶部居中 vignette。
- 不引入额外依赖。

## 六、收益

- 提供 STORY-020 v1 完整 UI（列表 + 新建 + 编辑），结构对齐 ApprovalConfig，便于后续接入 STORY-003 成本基线选择。
- 复用 FormModal / FilterPopover / EmptyState，保持视觉与交互一致。
