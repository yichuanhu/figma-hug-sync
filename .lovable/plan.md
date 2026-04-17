
## 方案

将“表格背景修复”从局部页面（需求列表）提升到全局，统一让所有表格背景与页面卡片背景一致，避免横向滚动时固定列透出底层内容。

## 根因
`src/styles/app.less` 全局把整套表格层级强制设为 `transparent !important`，只是为了让表格“继承父容器背景”。但 Semi Table 的固定列是 sticky 分层，下层透明 → 横滚时穿透。

## 改动
**1. 全局表格层级改为不透明（`src/styles/app.less`）**
将原本的全局 transparent 规则替换为：
- `.semi-table` / `.semi-table-wrapper` / `.semi-table-container`
- `.semi-table-body` / `.semi-table-thead` / `.semi-table-tbody`
- `.semi-table-row` / `.semi-table-row-cell` / `.semi-table-row-head`
统一使用 `background-color: var(--semi-color-bg-1)`（与 `.app-layout-content-card` 卡片背景一致）。

固定列额外补：
- `background-color: var(--semi-color-bg-1) !important`
- 左固定列：`box-shadow: 4px 0 8px -4px rgba(0,0,0,0.08)`
- 右固定列：`box-shadow: -4px 0 8px -4px rgba(0,0,0,0.08)`

hover / selected 状态同步覆盖所有 cell（含固定列），避免状态切换时穿透。

**2. 抽屉（SideSheet）内的表格保持原有覆盖**
`.card-sidesheet` 里的表格继续用 `--semi-color-default`，因为抽屉背景色不同，这部分逻辑保留。

**3. 清理需求列表页冗余样式（`src/pages/Requirements/RequirementsWorkbench/index.less`）**
删除之前为修这个 bug 加的所有局部 `!important` 背景覆盖，只保留：
- 单元格 padding / vertical-align
- 表头字重和颜色
- 固定列阴影（如全局已加可移除）
- 选中行的高亮色

## 预期效果
- 所有页面表格背景与页面卡片一致，视觉统一
- 横滚时固定列完全遮挡底层内容，不再穿透
- 抽屉内表格不受影响
- 需求列表页样式文件大幅简化
