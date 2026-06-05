## 目标

将「代码审核员」字段由多选改为单选，与「开发工程师」保持一致。

## 影响范围

仅前端字段与展示调整，不改业务流程逻辑。

### 1. 数据层 `src/mocks/processBasicInfo.ts`
- `ProcessBasicInfo.code_reviewer_ids: string[]` → `code_reviewer_id: string | null`
- 种子数据：`code_reviewer_ids: ['user-007']` → `code_reviewer_id: 'user-007'`
- `updateProcessBasicInfo` 的 `Pick` 类型对应改为 `code_reviewer_id`
- `writeCodeReviewerFromApproval`：判空改为 `prev.code_reviewer_id` 为空才写入；写入值改为 `approverId`（字符串，不再是数组）

### 2. 编辑弹窗 `EditProcessModal/index.tsx`
- 状态：`codeReviewerIds: string[]` → `codeReviewerId: string | null`
- 初始化：`setCodeReviewerId(basicInfo.code_reviewer_id ?? null)`
- 提交：`code_reviewer_id: codeReviewerId`（去掉 `Array.from(new Set(...))`）
- 第 392-… 的 `Form.Slot` 中 `Select`：去掉 `multiple`，placeholder 改为「请选择代码审核员」，`value`/`onChange` 改为单值

### 3. 基本信息单字段编辑弹窗 `BasicInfoEditModal/index.tsx`
- 移除 `code_reviewer_ids` 分支的多选逻辑：`isMulti` 删除
- `field: 'developer_id' | 'code_reviewer_id'`
- `initialValue: string | null`
- 提交统一用单值写回 `updateProcessBasicInfo`
- 调用方（详情抽屉中触发该编辑的入口）若传 `'code_reviewer_ids'` 一并改为 `'code_reviewer_id'`

### 4. 详情抽屉 `ProcessDetailDrawer/index.tsx`
- 第 579 行：`renderPeopleValue(basicInfo.code_reviewer_ids)` → `renderPeopleValue(basicInfo.code_reviewer_id ? [basicInfo.code_reviewer_id] : [])`
- 检查并更新打开 `BasicInfoEditModal` 时传入的 `field` 与 `initialValue`，改为单值

## 不改动
- API 类型（该字段仅在 mock 层）
- 流程列表、筛选、需求/部门联动
- 创建弹窗（本无该字段）
