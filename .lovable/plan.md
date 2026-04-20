
## 目标
重构开发中心「新建流程」弹窗字段顺序与归属字段交互逻辑，统一与其他新建弹窗的展示规范。

## 字段顺序（最终）
1. 流程名称（必填）
2. 描述（非必填）— 上移到名称后面，与其他新建弹窗一致
3. 关联需求（**非必填**）— 全局可选
4. 归属部门（必填）
   - 已选关联需求 → 自动带入需求部门，禁用
   - 未选关联需求 → 启用 `DepartmentSelect`，手动选择
5. 归属者（必填）
   - 已选关联需求 → 自动带入需求负责人，禁用
   - 未选关联需求 → 启用 `OwnerSelect`，手动选择

移除：「所属工作空间」字段（仅由关联需求带入到详情抽屉中展示，新建弹窗不展示）。

## 交互细节
- 切换关联需求时：自动覆盖部门 / 归属者；取消关联时清空两者，恢复手动选择。
- 提交校验：
  - 名称（沿用现有规则）
  - `owningDepartmentId` 缺失 → `Toast.warning(t('common.owningDepartmentRequired'))`
  - `ownerId` 缺失 → `Toast.warning(t('common.ownerRequired'))`
- Mock 响应：`owning_department_id` / `owner_id` 来源于最终选择值（与是否关联需求解耦）。

## 涉及文件
- `src/components/ProcessManagement/ProcessManagementContent/components/CreateProcessModal/index.tsx`
- 必要时补充 i18n 文案到 `public/i18n/zh-CN.json`、`en.json`（优先复用现有 key）。

## 验收
- 弹窗字段顺序：名称 → 描述 → 关联需求 → 归属部门 → 归属者。
- 关联需求为非必填；移除「所属工作空间」。
- 已选需求时部门/归属者只读；未选需求时可手动选择。
- 部门/归属者均显示红色必填星号，留空提交被 Toast 拦截。
