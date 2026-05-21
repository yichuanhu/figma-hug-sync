## Phase 3：方案编辑页改造

聚焦 `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx` 与 `FormBuilder/`，让编辑页严格匹配 v15 的三类方案行为。

### 1. 方案类型分支（替换现有 `isPresetEdit` 单一开关）

引入 `editMode`：

```text
preset           → 完全只读（含适用部门）。隐藏所有保存/激活按钮。
tenant_default   → 全字段可编辑；不展示「适用部门」区块；不可设为默认（已是默认）；不可停用/激活。
custom_active    → 仅允许编辑「适用部门」（与当前预设的限制行为一致），保存即同步绑定。
custom_inactive  → 全字段可编辑 + 「适用部门」可编辑 + 启用按钮 + 「设为默认」按钮（若无部门绑定）。
```

### 2. 头部按钮区按 editMode 渲染

| editMode | 试运行 | 保存 | 设为默认 | 启用 |
|---|---|---|---|---|
| preset | — | — | — | — |
| tenant_default | ✓ | ✓ | — | — |
| custom_active | — | ✓（仅适用部门） | — | — |
| custom_inactive | ✓ | ✓ | ✓（无绑定时） | ✓ |

「设为默认」复用 Phase 1 的 `setSchemeAsDefault`，复用 Phase 2 的 `SchemeError` 统一提示。

### 3. 适用部门区块显隐

- `tenant_default`：完全隐藏「适用部门」卡片（默认方案是兜底，不参与部门匹配）
- `preset`：隐藏（预设只读，且不参与绑定）
- `custom_active` / `custom_inactive`：保留现有卡片

### 4. 表单主体只读规则

- `preset`：整页只读遮罩（保留当前 `pointer-events: none + opacity 0.7`），名称不可编辑
- `custom_active`：表单主体也加只读遮罩，仅顶部适用部门可改；移除"试运行"
- 其它：维持可编辑

### 5. SchemeError 统一接入

`handleActivate` 内捕获 `SchemeError`：
- `SCHEME_DEPARTMENT_CONFLICT` → Modal 列出冲突部门
- `SCHEME_NO_DEPARTMENT` → Toast 引导
- 其它 → Toast.warning

### 6. 进入逻辑调整

- 移除当前"已激活非预设自动派生新版本"的 `forkActiveScheme` 弹窗（v15 已激活方案进入是编辑适用部门，不再派生）
- 改为：若 `status=active && !is_draft && !is_preset && !is_tenant_default` → 直接进入 `custom_active` 模式

### 不在本阶段（推迟到 Phase 3.5 / Phase 4）

- FormBuilder 8 个系统固定字段锁定区（影响面大，单独迭代）
- 字段配置 Modal 简化为 4 Tab（独立 UX 重构）
- 创建需求时方案匹配（Phase 4）

### 涉及文件

- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx`

确认后开始执行 Phase 3。
