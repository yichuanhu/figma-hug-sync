## 一、与最新需求对照后的差距清单

下面是把 `STORY-001-RC-SCHEME-MGMT v15` 和现状代码（`src/pages/Requirements/RequirementsScheme/*`、`RequirementsWorkbench/schemeConfig.ts`、`types.ts`、`mocks/departmentSchemeBinding.ts`）逐项比对的结果：


| #   | 需求 (v15)                                                                                                                                                        | 现状                                                                                                  | 差距                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | 三层方案模型：平台预设 / 租户默认 / 普通租户部门方案                                                                                                                                   | 仅有 `is_preset` + `status`                                                                           | 缺 `is_tenant_default` 概念；缺租户初始化复制默认方案逻辑 |
| 2   | 平台预设只读：不可编辑（含适用部门）、不可激活、不可停用、不可删除、不可绑定                                                                                                                          | 当前预设可在列表"激活"，可在 builder 编辑适用部门，下拉里还能"取消激活"                                                          | 需要全面收紧预设权限，并把"基于此创建副本"作为唯一操作            |
| 3   | 租户默认方案：唯一、不可停用/删除/手动激活；可编辑配置和"设为默认"切换                                                                                                                           | 完全不存在                                                                                               | 全新概念，需 schema 字段 + 初始化 + UI             |
| 4   | 激活普通方案：事务内保存配置 + 展开子部门 + 校验冲突 + 写入 `department_scheme_binding` + `is_active=true`                                                                               | `activateScheme` 只切 status，`activateSchemeBuilder` 没做冲突校验也没写绑定                                      | 需要把激活做成"业务事务"                           |
| 5   | 停用普通方案：删除该方案在绑定表的全部记录 + `is_active=false`                                                                                                                       | `deactivateScheme` 仅切 status                                                                        | 需要联动清空 binding                          |
| 6   | 设为默认方案：要求 `is_active=false` + 配置完整 + 无 binding；事务切换                                                                                                             | 不存在                                                                                                 | 全新接口 + 列表/编辑页按钮                         |
| 7   | 按钮可见性矩阵（§10.3）                                                                                                                                                  | 当前下拉混合，预设也显示编辑/激活                                                                                   | 整套重写卡片菜单                                |
| 8   | 默认方案异常横幅（缺失/未激活/多默认）                                                                                                                                            | 无                                                                                                   | 列表页顶部新增横幅                               |
| 9   | 预设升级通知 `preset_update_available` + 差异摘要                                                                                                                         | 无                                                                                                   | 新字段 + 列表标签 + 差异 Modal                   |
| 10  | Scheme `config` 仅含 `form`，移除 `settings/assessment/workflow/cost_config`                                                                                         | 现状仍带 `value_assessment_model/complexity_assessment_model/workflow_config/cost_config/approval_flow` | 需要把这些字段在新模型里"标记弃用"，UI 不再展示，类型保留兼容       |
| 11  | 系统固定字段锁定区（title/number/department_id/owner_id/岗位级别/岗位成本/执行频率/单次时长）                                                                                              | FormBuilder 现在只渲染 `custom_fields`，没锁定区                                                              | 新增 8 个系统字段锁定展示                          |
| 12  | 创建需求时：部门绑定优先 → 默认方案兜底 → 缺失则阻止                                                                                                                                   | Workbench 当前按 `status=active` 列表选择，未走绑定/兜底                                                          | 替换匹配逻辑                                  |
| 13  | 需求保存 `scheme_id` + `scheme_config_snapshot`                                                                                                                     | 仅存 `scheme_id`                                                                                      | 新增快照字段                                  |
| 14  | 错误码：`SCHEME_NO_DEPARTMENT` / `SCHEME_DEPARTMENT_CONFLICT` / `SCHEME_BOUND_CANNOT_SET_DEFAULT` / `SCHEME_DEFAULT_CANNOT_ACTIVATE` / `SCHEME_DEFAULT_UNAVAILABLE` | 没有统一错误码                                                                                             | mock 服务抛出标准 Error 含 code 字段             |
| 15  | 删除：仅非预设、非默认、非激活、无绑定                                                                                                                                             | 仅拦预设                                                                                                | 加多重校验                                   |


## 二、改造策略（分 4 个阶段）

考虑到改动面非常大，建议分阶段落地，每阶段独立可验收，避免一次性大爆炸破坏现有可用功能。每个阶段交付前都会在预览里走一遍 happy path + 关键异常。

### 阶段 1 — 数据模型与服务层（schemeConfig.ts / types.ts）

1. `RequirementScheme` 类型增加：
  - `is_tenant_default?: boolean`
  - `source_preset_key?: string` / `source_preset_version?: string`
  - `preset_update_available?: boolean`（运行时计算字段）
2. 初始化逻辑：load 后若租户无 `is_tenant_default=true && status=active`，按 `DEFAULT_PRESET_KEY = 'RPA-PRO'` 复制一份租户默认方案。
3. 新增/重构服务函数：
  - `getTenantDefaultScheme()`
  - `setSchemeAsDefault(id, configPatch)`（事务：保存配置 + 切默认）
  - `activateSchemeBuilder(id)` 重写：校验部门非空 + 冲突 + 写 `department_scheme_binding`
  - `deactivateScheme(id)`：联动清空 binding；拒绝预设和默认
  - `deleteScheme(id)`：拒绝预设/默认/激活/有 binding
  - `updateSchemeApplicableDepartments`：拒绝预设
  - 抛错时统一 `SchemeError { code, message }`
4. 默认方案异常检测：`getDefaultSchemeStatus(): 'ok' | 'missing' | 'inactive' | 'multiple'`

### 阶段 2 — 列表页改造（`RequirementsScheme/index.tsx`）

1. 顶部默认方案异常横幅（`getDefaultSchemeStatus !== 'ok'` 时显示）。
2. 卡片菜单严格按 §10.3 可见性矩阵：
  - 预设：详情 / 基于此创建副本（其它全部隐藏）
  - 默认方案：详情 / 编辑 / 副本（设为默认/删除/停用/激活 隐藏或禁用）
  - 普通草稿无绑定：详情 / 编辑 / 副本 / 激活（适用部门空时禁用并 tooltip）/ 设为默认（配置完整时）/ 删除
  - 普通已激活：详情 / 编辑 / 副本 / 停用（仅当有 binding）
3. 卡片角标增加：`默认方案` Tag、`预设已更新` Tag（点击弹差异 Modal）。
4. 移除现有"编辑适用部门"独立 Modal（已激活方案改走编辑页同步 binding；预设方案不再可编辑部门）。
5. "适用部门" 计数列展示：默认方案显示「兜底（不占用部门）」。

### 阶段 3 — 编辑页改造（`SchemeBuilder/index.tsx` 及 FormBuilder）

1. 预设方案：完全只读，不渲染编辑入口（与列表层呼应；用户上一轮要求"预设可编辑适用部门"作废，按 v15 收回）。
2. 默认方案：可编辑名称/描述/字段，不展示「适用部门」区块，不展示「激活方案」按钮。
3. 普通方案：保留适用部门 + 保存草稿 + 激活；新增「设为默认方案」按钮（满足条件时显示）。
4. FormBuilder 顶部增加「🔒 系统固定字段」锁定区，渲染 8 个系统字段（title/number/department_id/owner_id + 岗位级别/岗位成本/执行频率/单次时长），不可拖拽/删除/编辑。
5. 字段配置 Modal 确认仅 4 个 tab：基本信息 / 验证规则 / 默认值 / 依赖关系（去掉 UI 配置 tab，如果存在）。
6. 激活按钮文案 / 错误处理对接新错误码（部门冲突时弹 Modal 提示冲突部门）。

### 阶段 4 — 创建需求侧 & 收尾

1. `RequirementsWorkbench` 创建需求流程改为：
  - 用户选部门 → 按 `department_scheme_binding` 精确匹配 → 命中即用该方案 → 否则使用租户默认方案 → 默认异常则阻止并提示。
2. Requirement 实体新增 `scheme_config_snapshot`，提交时写入；编辑/详情按快照渲染。
3. 预设升级通知：mock 一个"已有更高 `source_preset_version`"的演示数据，点击查看差异 Modal（v1 仅展示字段对比，不做自动合并）。
4. 文案 / i18n 补齐；统一错误码到 toast。

## 三、范围说明（本次想跟你确认）

需求文档很大，但实际"业务行为差距"主要集中在阶段 1+2+3。**建议本次先落地阶段 1 + 阶段 2**（数据模型 + 列表页交互完整对齐 v15），让"三层方案模型 / 默认方案 / 激活停用 / 按钮矩阵 / 预设只读"这条主线先跑通；阶段 3 的 FormBuilder 系统固定字段、阶段 4 的需求侧匹配逻辑作为后续两次迭代。

如果你认可，请确认以下几个关键决策点：

- D1：默认预设 key 取 `RPA-PRO`**（RPA 专业版）** 作为租户默认方案来源？ 
  - 是
- D2：本次改造是否一次落到位（阶段 1+2+3+4 全做），还是按上面建议先做 1+2？
  - 全做
- D3：是否需要修改前端路由 `/requirements/scheme` → `/requirement-center/schemes`（v15 文档给的）？我倾向**保持现有路由不变**，因为整站其它入口都在 `/requirements/*` 下。
  - 保持现有路由不变
- D4：预设方案当前 `applicable_department_ids` 是有值的（如 `dept-finance, dept-hr` 等），按 v15 应清空（预设不参与绑定）；确认可以清掉。
  - 可以清除

## 四、技术细节（供参考）

```text
RequirementScheme（新增字段）
+ is_tenant_default?: boolean
+ source_preset_key?: string
+ source_preset_version?: string
+ preset_update_available?: boolean (derived)

SchemeError
+ code: 'SCHEME_NO_DEPARTMENT' | 'SCHEME_DEPARTMENT_CONFLICT'
       | 'SCHEME_BOUND_CANNOT_SET_DEFAULT' | 'SCHEME_DEFAULT_CANNOT_ACTIVATE'
       | 'SCHEME_DEFAULT_UNAVAILABLE' | 'SCHEME_PRESET_READONLY'

服务层关键事务（mock，全部在 schemeStore 上原子完成 + bumpSchemeVersion 一次）
- activate(id):  validate → checkConflict(department_scheme_binding) → write binding → status=active
- deactivate(id): assert !preset && !tenant_default → clear binding → status=inactive
- setDefault(id): assert !preset && status=inactive && no binding && validate.ok
                  → savePatch → newDefault.status=active, is_tenant_default=true
                  → oldDefault.status=inactive, is_tenant_default=false
- delete(id):    assert !preset && !tenant_default && status!==active && no binding
```

按钮可见性矩阵将在 `RequirementsScheme/index.tsx` 用一个 `getSchemeActions(scheme): { canEdit, canActivate, canDeactivate, canSetDefault, canDelete, canClone }` 工具集中收口，避免散落判断。