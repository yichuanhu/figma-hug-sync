## Phase 4：创建需求方案匹配 + 配置快照

让创建需求时按 v15 §匹配规则解析方案，并把方案配置快照写入需求记录，保证历史需求不受方案后续编辑影响。

### 1. 匹配规则（`RequirementCreatePage`）

替换当前 `autoMatchedSchemeId` 的单层匹配为三级 fallback：

```text
1) department_scheme_binding 直接命中（按部门）
2) 祖先部门命中（继承）
3) 租户默认方案 getTenantDefaultScheme()
4) 都没有 → null（理论上不会发生，因 Phase 1 已保证默认存在）
```

引入 `schemeMatchSource: 'department' | 'tenant_default' | null` 用于驱动 Banner 文案。

### 2. Banner 文案

| 匹配来源 | Banner |
|---|---|
| `department` | info：`使用方案：<name> v<version> （根据所属部门「X」自动匹配）` |
| `tenant_default` | info：`使用方案：<name> v<version> （所属部门未配置专属方案，使用租户默认方案）` |
| `null` | 保留现有 warning Banner（仅在异常时出现） |

由于默认方案兜底，`showNoSchemeForDept` 实际不会触发，但保留作为防御。

### 3. 配置快照（`mockData.ts → createRequirement`）

在写入 `newItem` 时追加：

```ts
scheme_config_snapshot: {
  id: chosenScheme.id,
  code: chosenScheme.code,
  name: chosenScheme.name,
  version: chosenScheme.version,
  custom_fields: chosenScheme.custom_fields,
}
```

类型 `RequirementItem.scheme_config_snapshot` 在 Phase 1 已就位。

### 4. 不动的事项

- 编辑历史需求继续优先用 `editData.scheme_id`，不会因部门变更切换方案
- 详情抽屉读取顺序：`scheme_config_snapshot` → `scheme_id`（本期保持现状，后续可单独优化）

### 涉及文件

- `src/pages/Requirements/RequirementsWorkbench/components/RequirementCreatePage/index.tsx`
- `src/pages/Requirements/RequirementsWorkbench/mockData.ts`

确认后开始执行 Phase 4。
