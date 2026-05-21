## 方案修复计划（3 个问题）

---

### 问题 1：新建模板没有「添加自定义字段」功能

**根因初判**：`SchemeBuilder` 中给整个 `.scheme-builder-body` 加了 `pointerEvents: 'none'` / `opacity 0.7` 的只读样式，但仅在 `isFormReadOnly` 为 true 时启用。新建草稿（`custom_inactive`）按理不会进入该分支。需要进一步定位为：

- AddFieldPopover 触发位置 = `top`，在 body 底部受 `overflow:hidden / 滚动容器` 影响，弹层被裁剪或被外层 `.app-layout-content-card` 滚动盖住，导致看起来"没有按钮"。
- 或字段类型 grid 在空状态下未渲染（`empty-fields` 占位与 AddFieldPopover 同列时按钮被推到视口下方）。

**修复**：
- `FormBuilder/index.tsx`：把 `add-field-bar` 从底部条改为常驻在「自定义字段」分组标题右侧，再保留底部"+ 添加字段"虚线大按钮，确保任意状态下都可见。
- `AddFieldPopover`：`position` 改为 `topLeft`、增加 `zIndex`、`getPopupContainer={() => document.body}`，避免被父容器裁剪。
- 增加 e2e 自查：新建后默认选中"添加字段"按钮 focus 状态，便于发现回归。

---

### 问题 2：点击"创建新模板"立刻在列表生成空草稿，且编辑页没有「取消」按钮

**根因**：`RequirementsScheme/index.tsx → handleCreateNew` 直接 `createSchemeDraft()` 写 store 再跳编辑页，浏览器返回 = 留下"未命名模版"。

**修复（延迟落库 + 显式取消）**：

1. 新增 `NewSchemeNameModal`（520px，参考 `template/createModal` 规范，Name + Description + 取消/创建 两个按钮）。
2. 列表页"创建新模板"按钮改为打开该 Modal；点击「创建并编辑」时才 `createSchemeDraft({ name, description })` 然后 `navigate(...)`；点击「取消」直接关闭，不写 store。
3. `SchemeBuilder` 编辑页头部 `guardedNavigate` 已有未保存提示，无需额外取消按钮；返回箭头即取消入口。
4. 防御兜底：`SchemeBuilder` `useEffect` 卸载时如果方案仍为 `is_draft === true` 且 `custom_fields.length === 0` 且 `updated_at` 为空（即从未编辑过），自动 `deleteScheme(id)` 清理孤立空草稿（仅对本人创建生效）。

---

### 问题 3：未激活方案配置部门后删除，报错"该方案被 N 个部门使用"

**根因**：`SchemeBuilder → handleSaveDraft` 在 `custom_inactive` 分支也调用了 `setSchemeBindingsForScheme(draftScheme.id, expandedDeptIds)`，使草稿方案直接写入 `department_scheme_binding`。但 `deleteScheme` 用 `getBoundDepartmentCountMapByScheme()` 判定占用 → 草稿删不掉。

设计契约（见 `getOccupiedDepartmentMapByScheme` 注释、`activateScheme` 流程）：**仅 active 方案占用部门**，草稿只把 `applicable_department_ids` 存在方案对象上。

**修复**：

1. `SchemeBuilder/index.tsx → handleSaveDraft`
   - `custom_active` 分支：保留原 `setSchemeBindingsForScheme(...)` 写入。
   - `tenant_default` 分支：保持不写。
   - `custom_inactive` 分支：**移除** `setSchemeBindingsForScheme(...)`；并额外调用一次 `setSchemeBindingsForScheme(id, [])` 兜底清理历史脏数据。
2. `schemeConfig.ts → deleteScheme`：在判断前，对非 active、非默认方案先 `setSchemeBindingsForScheme(id, [])` 清零，再继续校验，作为防御层。
3. 不修改 `activateScheme` / `deactivateScheme`，激活时才真正写绑定，停用时清空，与现有逻辑一致。

---

### 涉及文件

- `src/pages/Requirements/RequirementsScheme/index.tsx`（新增 NewSchemeNameModal 调用）
- `src/pages/Requirements/RequirementsScheme/components/NewSchemeNameModal/index.tsx`（新增）
- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx`（保存逻辑、空草稿清理）
- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/FormBuilder/index.tsx`（"添加字段"按钮可见性）
- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/FormBuilder/AddFieldPopover/index.tsx`（Popover 容器/zIndex）
- `src/pages/Requirements/RequirementsWorkbench/schemeConfig.ts`（`deleteScheme` 防御性清绑定）

确认后开始执行。
