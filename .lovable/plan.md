
## 目标
全系统所有「新建/编辑」弹窗中，「归属部门」与「归属者」字段统一标记为必填，并加入校验拦截。

## 现状梳理
通过 `OwnerSelect` / `DepartmentSelect` 搜索定位到使用这两个字段的弹窗，大致包括：

- 凭据：`CreateCredentialModal`、`EditCredentialModal`
- 队列：`CreateQueueModal`、`EditQueueModal`（如存在）
- 文件：`CreateFileModal`、`EditFileModal`
- 参数：`CreateParameterModal`、`EditParameterModal`
- 流程：开发中心 `CreateProcessModal`（已重构为只读自动填充，跳过）
- 触发器/任务/模板等其他业务资产弹窗

现状问题：
1. `Form.Slot` 包裹的部门/归属者控件无 `required` 标记，UI 上看不出必填。
2. 提交逻辑里部分有 `Toast.warning` 兜底，部分（编辑弹窗）允许置空提交。
3. 编辑弹窗未做必填校验。

## 改动方案

### 统一规范
- `Form.Slot label={{ text: t('common.owningDepartment'), required: true }}`
- `Form.Slot label={{ text: t('common.owner'), required: true }}`
- 提交前若 `owningDepartmentId` 或 `ownerId` 为空 → `Toast.warning` 拦截（沿用现有创建凭据弹窗的写法），并阻止提交。
- 编辑弹窗：在保存前补齐同样的校验逻辑。
- 已有 `MOCK_CURRENT_USER` 默认填充 `ownerId` 的弹窗保持不变，仅追加显式校验。

### 涉及弹窗（实施时全量扫描，统一改造）
1. `CreateCredentialModal` / `EditCredentialModal`
2. `CreateQueueModal` / `EditQueueModal`
3. `CreateFileModal` / `EditFileModal`
4. `CreateParameterModal` / `EditParameterModal`
5. 其他在 `code--search_files` 中匹配到 `OwnerSelect` + `DepartmentSelect` 同时存在的「新建/编辑」弹窗

> 开发中心 `CreateProcessModal` 当前由「关联需求」自动填充并禁用，本身已是必填语义（关联需求已为必填），保留现状不再单独标记。

### i18n
- 复用既有 `common.owningDepartmentRequired`、`common.ownerRequired`（若不存在则补齐 zh-CN/en 两份）。

## 涉及文件（预估）
- `src/components/CredentialManagement/.../CreateCredentialModal/index.tsx`
- `src/components/CredentialManagement/.../EditCredentialModal/index.tsx`
- 队列/文件/参数等同类弹窗组件
- `public/i18n/zh-CN.json`、`public/i18n/en.json`（按需补 key）

## 验收标准
- 所有相关「新建/编辑」弹窗中，「归属部门」「归属者」字段标签出现红色必填星号。
- 留空保存时弹出 Toast 警告并阻止提交。
- 已有自动填充默认值的字段（如归属者默认当前用户）行为不变。
