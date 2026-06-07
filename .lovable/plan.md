## 工时面板样式调整

### 问题
当前"预估工时"和"剩余工时"的 InputNumber 使用 `suffix` 把"人天"放在输入框内部，视觉上像输入内容的一部分。

### 修改方案
1. **移除 suffix**：两处 `InputNumber` 去掉 `suffix={unit}` 属性。
2. **外部单位标签**：在 InputNumber 右侧渲染独立的 `<span className="effort-tab-unit">人天</span>`。
3. **样式微调**：在 `index.less` 中新增 `.effort-tab-unit` 样式，与数字输入框基线对齐、间距 8px、颜色用 `text-2` 保持辅助层级。

修改范围仅涉及 `EffortTab/index.tsx` 与 `EffortTab/index.less`，无业务逻辑变更。