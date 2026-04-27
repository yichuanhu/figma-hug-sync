# 修订计划：新增预设方案「RPA 统计表标准方案」（无审批 / 无评估）

## 一、本轮修订（针对用户最新反馈）

> "还增加一项需求描述项。需求分析师是自定义的需求详情字段，不是 owner_id，owner_id 是需求负责人，要单独填。"

订正两点：

1. **需求分析师 ≠ 需求负责人**
   - `owner_id`（需求负责人）由系统在"基本信息"区块统一渲染，不进入 custom_fields。
   - "需求分析师"是 Excel 中独立一列，需作为自定义字段 `requirement_analyst` 出现在"需求详情"区块。
2. **新增"需求描述"自定义字段** `requirement_description`（textarea），用于补充需求背景与目标说明。

## 二、字段映射（最终版）

### A. 系统字段（不写入 custom_fields）

| Excel 列 | 系统字段 |
|---|---|
| 需求名称 | `title` |
| 需求提出单位及部门 | `owning_department_name` |
| 需求负责人（系统级） | `owner_id` |

### B. 自定义字段（写入 custom_fields，共 12 项，按渲染顺序）

| # | key | label | type | 必填 | 说明 |
|---|---|---|---|---|---|
| 1 | `requirement_description` | 需求描述 | textarea | ✅ | 需求背景、目标与范围；maxCount=2000 |
| 2 | `requirement_analyst` | 需求分析师 | text | ❌ | 来自 Excel 列；与系统"负责人"区分 |
| 3 | `operation_type` | 操作类型 | select | ✅ | 业务操作 / 数据处理 / 稽核检查 / 监控预警 / 交互应答 / 凭证制证 / 凭证审核 / 其他 |
| 4 | `involved_systems` | 涉及的办公系统或软件 | textarea | ❌ | 例：FMIS、SAP、SSF、Excel、Chrome |
| 5 | `business_coverage_unit` | 业务覆盖范围（单位） | text | ❌ | 例：湖北销售 |
| 6 | `per_capita_frequency` | 人均处理频率（次 / 月） | number | ❌ | min=0 |
| 7 | `per_capita_duration` | 人均处理时长（分钟 / 月） | number | ❌ | min=0 |
| 8 | `application_target` | 应用对象 | select | ❌ | 共享内部 / 服务企业 / 其他 |
| 9 | `using_department` | 使用单位及部门 | text | ❌ | 例：成都中心-销售收款部 |
| 10 | `business_contact` | 业务联系人相关信息 | textarea | ❌ | 姓名 + 电话 |
| 11 | `attachments_desc` | 附件 | textarea | ❌ | 描述附件清单（需求文档、业务视频等）；当前无 file_upload 类型，先以 textarea 承接 |
| 12 | `expected_complete_date` | 需求完成时间 | date | ❌ | 期望完成日期 |

> 系统字段 3 + 自定义字段 12 = 15，覆盖 Excel"需求"区段全部列（含独立的"需求分析师"与新增的"需求描述"）。

## 三、方案配置

- 名称：`RPA 统计表标准方案`，code：`RPA-STAT`，初始 `status: 'inactive'`
- `approval_flow.levels = []` —— 提交即跳过审批
- 不配置 `value_assessment_model` / `complexity_assessment_model` —— 跳过评估
- 复用已实现的 `resolveSubmittedStatus` / `useSchemeFlags` / 提交确认 Banner 逻辑：提交后状态直达"待立项"

## 四、改动文件

1. `src/pages/Requirements/RequirementsWorkbench/schemeConfig.ts`
   - 在 `PRESET_SCHEMES` 数组中追加上述方案对象（含 12 个 custom_fields）
2. （无其它文件改动；状态流转、i18n、提交弹窗在前几轮已完成）

## 五、验收

- 「方案管理」列表中可见 `RPA 统计表标准方案`，可正常激活
- 激活后新建需求弹窗：
  - "基本信息"区块：需求名称、需求提出单位及部门、**需求负责人**（系统字段，各只出现一次）
  - "需求详情"区块按上表 B 顺序渲染 12 个自定义字段，第 1 项为"需求描述"，第 2 项为"需求分析师"
- 提交需求时，确认弹窗显示「已跳过审批 / 评估」Banner，提交后状态直接进入"待立项"
