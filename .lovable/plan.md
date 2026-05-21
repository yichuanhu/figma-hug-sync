## 目标

让 `/requirements/scheme/builder/:id` 页面里的「适用部门」选择器视觉上与表单中其他输入控件一致，不再横向铺满整页、右侧下拉箭头不再贴卡片边。

## 改动范围

仅前端展现层，文件只有一个：

- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx`

业务逻辑（保存、激活、占用校验、`patch({ applicable_department_ids })` 等）一律不动。

## 具体改动

1. **给「适用部门」trigger 一个合理的最大宽度**
   - 在渲染 `<DepartmentPicker />` 的外层包一个 `div`，限制 `max-width: 600px`（与表单常规输入控件视觉宽度一致）。
   - DepartmentPicker 自身仍是 `width: 100%`，但因为有了 600px 上限，不会再被拉伸到 920px。

2. **补回 section card 内部左右内边距**
   - 给 `.approval-flow-section-card-body` 这一层的 inline style 增加 `padding: 4px 4px 0` → 让 trigger 与卡片头部文字对齐，并和卡片右边缘保持距离，避免 `∨` 箭头贴边。
   - 不动 `.approval-flow-section-card` 全局样式（避免影响 ApprovalConfig 复用方）。

3. **保留多选 + 占用校验逻辑不变**
   - `disabledOptions`、`maxTagCount={6}`、`placeholder`、`onChange` 均保持现状。

## 不做的事

- 不回退到 Modal 编辑入口（你刚刚明确要求和非预设模板编辑保持一致的交互）。
- 不改 DepartmentPicker 组件自身（它在别处也用到了，全局改有副作用）。
- 不改 `.approval-flow-section-card` 全局 less。

## 验证方式

修改后在预览里：
- 打开任一预设模板的"编辑"，确认「适用部门」trigger 宽度 ≤ 600px、tags 内部正常换行、右侧箭头距卡片边有内边距。
- 选择/取消选择部门，确认 `dirty` 触发、`保存` 按钮可用，保存后回到列表能正确反映。
