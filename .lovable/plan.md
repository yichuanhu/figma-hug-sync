## 目标

将流程的「开发工程师」由多选改为单选（流程级只挂一个开发工程师）；筛选条件保留多选，查询语义为「开发工程师 ∈ 所选集合」（并集）。代码审核员保持多选不变。

## 需要修改的位置

### 1. API 类型（`src/api/index.ts`）
- 第 64 行 `LYProcessResponse.developer_ids?: string[] | null` → `developer_id?: string | null`
- 第 383 行 `LYCreateProcessRequest.developer_ids?: string[] | null` → `developer_id?: string | null`

### 2. Mock 数据层（`src/mocks/processBasicInfo.ts`）
- `ProcessBasicInfo.developer_ids: string[]` → `developer_id: string | null`
- 种子数据 `developer_ids: ['user-001', 'user-005']` → `developer_id: 'user-001'`
- `updateProcessBasicInfo` 的 `Pick` 字段改为 `developer_id`
- `overrideDevelopersOnVersionUpload`：`developer_ids: [uploaderId]` → `developer_id: uploaderId`，审计日志同步改字段

### 3. 创建流程弹窗（`CreateProcessModal/index.tsx`）
- 第 60 行 `initialValues` 字段名改为 `developer_id`，取值改为字符串
- 第 174 行提交时 `developer_id: values.developer_id as string | undefined`
- 第 295–307 行 `Form.Select`：去掉 `multiple`，`field="developer_id"`，placeholder 改为「请选择开发工程师」

### 4. 编辑流程弹窗（`EditProcessModal/index.tsx`）
- 第 44 行 state：`developerIds: string[]` → `developerId: string | null`
- 第 68 行初始化：`setDeveloperId(basicInfo.developer_id ?? null)`
- 第 165 行提交：`developer_id: developerId`（去掉 Set 去重）
- 第 384–390 行 `OwnerSearchSelect`：去掉 `multiple`，`value/onChange` 改为单值，placeholder 改为「请选择开发工程师」

### 5. 详情抽屉（`ProcessDetailDrawer/index.tsx`）
- 第 518 行 `renderPeopleValue(basicInfo.developer_ids)` → 改用单人渲染（如已有 `renderPersonValue`，否则用 `basicInfo.developer_id ? renderPeopleValue([basicInfo.developer_id]) : '-'`）
- 第 802–804 行覆盖逻辑：传入单个 `uploaderId` 即可（接口已改成单值）

### 6. 基本信息编辑子弹窗（`BasicInfoEditModal/index.tsx`）
- `BasicInfoEditField` 联合类型：`'developer_ids'` → `'developer_id'`
- `FIELD_TITLE` / `FIELD_LABEL` 键名同步
- `fields` 中 `developer_id` 字段去掉 `multiple`，`initialValues.users` 改为单值字符串
- `onSubmit` 中：当 `field === 'developer_id'` 时按单值（string | null）写入；`code_reviewer_ids` 仍走原多选+去重逻辑
- 调用方（详情抽屉「编辑」入口）按字段类型传 `initialValue: string | null`

### 7. 列表筛选（`ProcessManagementContent/index.tsx`）— 保留多选取并集
- 第 416 行过滤改为：`list = list.filter((p) => p.developer_id && developerFilter.includes(p.developer_id));`
- 第 870–872 行 `FilterPopover` 区块继续使用 `multiSelect`、`developerFilter: string[]` 状态、`BASIC_INFO_USER_POOL` 选项不变（即筛选侧仍是多选，语义为并集）

### 8. 文案与注释
- 涉及「开发工程师（可多选）」字样的 placeholder/注释统一改成单选措辞
- `overrideDevelopersOnVersionUpload` 函数名保留，但注释和审计字段从 `developer_ids` 改为 `developer_id`

## 不改动

- 代码审核员（`code_reviewer_ids`）仍为多选
- 筛选弹层组件 `FilterPopover` 本身无需改动
- 任务管理、Worker、共享中心等其他模块
- i18n key 名不动（值文案可按需后续微调）

## 风险点

- `developer_ids` 是数组语义，改为单值后所有读取处必须显式判空，避免 `.map`/`.some` 误用
- Mock 中历史数据如有依赖第二个开发者的展示用例，需要在抽屉/列表里确认显示为单人
