# 新增预设方案「RPA 统计表标准方案」（无审批 / 无评估）

## 一、需求

根据用户上传的《RPA 统计表.xlsx》中"需求"区域的字段定义，在「需求中心 → 方案管理」中 mock 一个新的内置预设方案。该方案：

- **不配置 approval_flow**（即提交即视为通过）
- **不配置 assessment_models**（跳过评估，直达"待立项"）
- 字段严格对齐 Excel 列定义

依赖之前已实现的"无审批/无评估时自动跳过状态阶段"逻辑（`resolveSubmittedStatus` / `useSchemeFlags` / 提交确认弹窗 Banner），本次仅新增方案数据，**无需修改流转逻辑**。

## 二、Excel「需求」区段字段映射

| Excel 列名 | 字段 key | 类型 | 必填 | 备注 |
|---|---|---|---|---|
| 需求名称 | `requirement_name` | text | ✅ | maxLength 100 |
| 操作类型 | `operation_type` | select | ✅ | 业务操作/数据处理/稽核检查/监控预警/交互应答/凭证制证/凭证审核/其他 |
| 涉及的办公系统或软件 | `involved_systems` | textarea | ❌ | 例：FMIS、SAP、SSF、Excel、Chrome、Edge |
| 业务覆盖范围（单位） | `business_coverage_unit` | text | ❌ | 例：湖北销售 |
| 人均处理频率（次/月） | `per_capita_frequency` | number | ✅ | unit 次/月 |
| 人均处理时长（分钟/月） | `per_capita_duration` | number | ✅ | unit 分钟/月 |
| 应用对象 | `application_target` | select | ✅ | 共享内部 / 服务企业 |
| 使用单位及部门 | `using_department` | text | ✅ | 例：成都中心-销售收款部 |
| 业务联系人相关信息 | `business_contact` | text | ✅ | 姓名+电话 |
| 附件 | `attachments` | file_upload | ❌ | 需求文档、业务视频等 |
| 需求提出单位及部门 | `proposing_department` | text | ✅ | |
| 需求分析师 | `requirement_analyst` | text | ❌ | |
| 需求完成时间 | `expected_complete_date` | date | ❌ | |

## 三、修改方案

### 1. `src/pages/Requirements/RequirementsWorkbench/schemeConfig.ts`

在 `PRESET_SCHEMES` 数组末尾追加一个方案对象：

```ts
{
  id: 'scheme-rpa-stat',
  code: 'RPA-STAT',
  name: 'RPA 统计表标准方案',
  version: '1.0.0',
  description: '对齐《RPA 统计表》需求登记字段的标准方案。无审批、无评估，提交即视为通过，直接进入待立项。',
  status: 'inactive',
  is_preset: true,
  meta: {
    code: 'RPA-STAT',
    name: 'RPA 统计表标准方案',
    category: 'RPA',
    scenario: 'RPA 需求快速登记',
    description: '无审批 + 无评估，适合区域中心 / 工作室快速录入',
  },
  custom_fields: [ /* 上述 13 个字段 */ ],
  // 关键：不设置 value_assessment_model / complexity_assessment_model
  // 关键：approval_flow.levels 为空数组
  approval_flow: { levels: [] },
  cost_config: {
    avg_hourly_cost: 80,
    working_hours_per_day: 8,
    working_days_per_month: 21,
  },
  raw_yaml: '# 由《RPA 统计表》导出\nmeta:\n  code: RPA-STAT\n  name: RPA 统计表标准方案\ncustom_fields:\n  # ...\n# 无 approval_flow / assessment_models',
  created_at: NOW,
  created_by: 'system',
}
```

### 2. 验证依赖逻辑（无需改代码，仅复核）

- `schemeHasApproval()` 对 `levels: []` 返回 false ✅
- `schemeHasAssessment()` 对未设置评估模型返回 false ✅
- `resolveSubmittedStatus()` 将返回 `PENDING_PROJECT` ✅
- 详情抽屉 / 列表的提交按钮文案与 Banner 提示会自动切换为"已跳过审批与评估，直接进入待立项" ✅

## 四、文件改动清单

- `src/pages/Requirements/RequirementsWorkbench/schemeConfig.ts` — 在 `PRESET_SCHEMES` 末尾追加 1 个预设方案

## 五、不在范围

- 不修改类型定义、状态流转逻辑、提交确认弹窗
- 不导入 Excel 文件本体（仅参考字段定义）
- 不自动激活该方案（status 保持 inactive，由用户在方案管理页手动激活）
- 不修改 i18n（方案 name/description 跟随系统现有渲染）
