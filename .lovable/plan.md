# 修订计划：新增预设方案「RPA 统计表标准方案」（无审批 / 无评估）

## 一、关键修订（针对用户反馈）

> "需求名称应该是新建需求时系统默认的必填字段吧。"

确认：`title`（需求名称）、`owning_department_name`（需求提出单位及部门）、`owner_id`（需求分析师 / 负责人）均为系统级字段，已由 `RequirementFormModal` 在"基本信息"区块统一渲染。

因此本次方案的 `custom_fields` **不再包含** `requirement_name`、`owning_department`、`requirement_owner`，避免出现重复输入框。这三列直接映射到系统字段即可。

## 二、方案概述

依据《RPA 统计表.xlsx》"需求"区段字段，在「需求中心 → 方案管理」中 mock 一个内置预设方案：

- 名称：`RPA 统计表标准方案`，code：`RPA-STAT`，初始 `status: 'inactive'`
- `approval_flow.levels = []` —— 提交即跳过审批
- 不配置 `value_assessment_model` / `complexity_assessment_model` —— 跳过评估
- 复用已实现的 `resolveSubmittedStatus` / `useSchemeFlags` / 提交确认 Banner 逻辑，提交后状态直达"待立项"

## 三、字段映射

### A. 系统字段（不进入 custom_fields）

| Excel 列 | 系统字段 |
|---|---|
| 需求名称 | `title` |
| 需求提出单位及部门 | `owning_department_name` |
| 需求分析师 | `owner_id` |

### B. 自定义字段（写入 custom_fields，共 10 项）

| key | label | type | 必填 | 说明 |
|---|---|---|---|---|
| `operation_type` | 操作类型 | select | ✅ | 业务操作 / 数据处理 / 稽核检查 / 监控预警 / 交互应答 / 凭证制证 / 凭证审核 / 其他 |
| `involved_systems` | 涉及的办公系统或软件 | textarea | ❌ | 例：FMIS、SAP、SSF、Excel、Chrome |
| `business_coverage_unit` | 业务覆盖范围（单位） | text | ❌ | 例：湖北销售 |
| `per_capita_frequency` | 人均处理频率（次 / 月） | number | ❌ | min=0 |
| `per_capita_duration` | 人均处理时长（分钟 / 月） | number | ❌ | min=0 |
| `application_target` | 应用对象 | select | ❌ | 共享内部 / 服务企业 / 其他 |
| `using_department` | 使用单位及部门 | text | ❌ | 例：成都中心-销售收款部 |
| `business_contact` | 业务联系人相关信息 | textarea | ❌ | 姓名 + 电话 |
| `attachments_desc` | 附件 | textarea | ❌ | 描述附件清单（需求文档、业务视频等）；当前无 file_upload 类型，先以 textarea 承接 |
| `expected_complete_date` | 需求完成时间 | date | ❌ | 期望完成日期 |

> 系统字段 3 + 自定义字段 10 = 13，与 Excel 中"需求"区段列数一致。

## 四、改动文件

1. `src/pages/Requirements/RequirementsWorkbench/schemeConfig.ts`
   - 在 `PRESET_SCHEMES` 数组中追加上述方案对象
2. （无其它文件改动；状态流转、i18n、提交弹窗在前几轮已完成）

## 五、验收

- 「方案管理」列表中可见 `RPA 统计表标准方案`，可正常激活
- 激活后新建需求弹窗：
  - "基本信息"区块仅有一个"需求名称"输入框（系统字段）
  - "需求详情"区块按上表 B 顺序渲染 10 个自定义字段
- 提交需求时，确认弹窗显示「已跳过审批 / 评估」Banner，提交后状态直接进入"待立项"
