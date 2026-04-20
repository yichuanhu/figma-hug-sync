

## 计划

调整任务/任务模板表单中"机器人"下拉列表的排序与展示：

### 改动文件
- `src/components/TaskForm/index.tsx`
  - **下拉项顺序**：`<机器人名> <[组名] chip>`（机器人名在前，组名 chip 在后作为提示）
  - `renderSelectedItem`：选中态同步为 `<机器人名> <[组名] chip>`
  - **排序逻辑调整**：未分组的机器人组排在最前面，其余按组名 `localeCompare('zh-CN')` 排序
- `src/components/TaskForm/index.less`
  - `.bot-target-selector-option`：机器人名 `flex: 1` 居左，组名 chip `margin-left: 8px; margin-right: 0` 靠右
  - `.bot-target-selector-selected-with-tag` 同步调整
  - 组名 chip 保持淡色（`--semi-color-fill-0` 背景 + `--semi-color-text-2` 文字）

### 验收
1. 新建/编辑 任务、执行模板、时间触发器、队列触发器，机器人下拉中：未分组项排在最前
2. 每项格式为 `机器人名  [组名]`，组名为淡色 chip
3. 选中态同样为 `机器人名  [组名]`
4. 搜索行为不变（同时匹配机器人名与组名）

