## Phase 2：方案列表页改造

基于 v15 需求和已完成的 Phase 1（数据模型 + 服务层），本阶段聚焦于 `src/pages/Requirements/RequirementsScheme/index.tsx` 列表页的改造。

### 1. 默认方案状态横幅

在列表顶部新增 Banner 区域，展示当前租户默认方案信息：

- 显示默认方案名称、来源（如"基于预制方案 RPA-PRO v1.0.0 初始化"）
- 若 `preset_update_available=true`，显示"预制方案有新版本 v1.1.0 可更新"提示（仅提示，不强制）
- 提供"查看默认方案"快捷入口

我的意见：这个部分有点too much了， 对于需要配置方案的用户来说，默认方案只是兜底，不需要这么大张旗鼓的展示；

### 2. 按钮可见性矩阵（严格遵循 §10.3）

重构每行操作下拉菜单，按方案类型分别渲染：

```text
方案类型              | 可见操作
---------------------|----------------------------------
预制方案 (is_preset) | 查看（只读）
租户默认 (default)   | 编辑、查看
自定义-草稿/停用     | 编辑、启用、设为默认、删除
自定义-启用          | 编辑（仅适用部门）、停用、查看
```

- 移除当前混在一起的"编辑适用部门" Modal 入口（统一进编辑页）
- 删除按钮在有绑定/已启用/默认/预制时禁用并 Tooltip 说明原因

### 3. 列表列调整

- "适用部门"列：显示部门数量（如"3 个部门"），Hover Popover 展示完整列表；预制方案显示"—"
- 新增"来源"列或在名称旁标签：`预制` / `默认` / `自定义`
- 状态列：预制固定显示"只读"，默认方案显示"默认"标签

### 4. 操作交互

- **启用**：调用 `activateScheme`，捕获 `SchemeError` 各错误码（`SCHEME_NO_DEPARTMENT` / `SCHEME_DEPARTMENT_CONFLICT` 等），用 Toast/Modal 提示并引导（冲突时列出冲突部门）
- **停用**：调用 `deactivateScheme`，二次确认提示"将清空部门绑定"
- **设为默认**：Modal 确认，调用 `setSchemeAsDefault`
- **删除**：调用 `deleteScheme`，捕获禁止删除原因

### 5. 移除独立的"编辑适用部门" Modal

当前 `SchemeBuilder` 外层的 `DepartmentPicker` 弹窗入口移除，所有部门修改进入编辑页统一处理（与 Phase 3 衔接）。

### 涉及文件

- `src/pages/Requirements/RequirementsScheme/index.tsx`（主要）
- 可能新增：`components/DefaultSchemeBanner/index.tsx`
- 可能新增：`components/SchemeActionMenu/index.tsx`（按类型渲染按钮）

### 不在本阶段

- 编辑页内部改造（Phase 3）
- 创建需求时方案匹配（Phase 4）

确认后开始执行 Phase 2。