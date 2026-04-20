

## 根因
您看到的"新建执行模板"弹窗机器人选择器没变化，是因为它用的是 `src/components/TaskForm`（共享于新建任务/新建模板/触发器），其内部使用的是 **`Form.Cascader`（层级树）**，并不是上次改的 `BotTargetSelector`。

## 改造方案

仅改 `src/components/TaskForm/index.tsx`，把单机器人选择从 Cascader 改为扁平 Select。

### 1. 选项数据 `workerTreeData` → `workerFlatOptions`
基于 `workerGroupsTree` 生成扁平数组：
```
[
  { value: 'worker-001', label: '[财务机器人组] 财务RPA01', name, groupName, status },
  { value: 'worker-002', label: '[未分组] 测试机器人', ... },
  ...
]
```
无组归属时 `groupName = t('template.fields.ungrouped')`（"未分组"）。

### 2. 替换组件
将 `Form.Cascader field="worker_id"` 替换为：
```
<Form.Select field="worker_id" filter renderSelectedItem ...>
  {workerFlatOptions.map(opt => (
    <Select.Option value={opt.value} {...metadata}>
      <div className="bot-target-selector-option">
        <Text>[{opt.groupName}] {opt.name}</Text>
        <Tag>{statusText}</Tag>
      </div>
    </Select.Option>
  ))}
</Form.Select>
```
- `filter` 函数同时匹配 `name` 与 `groupName`
- `renderSelectedItem` 显示 `[组名] 机器人名` + 状态标签

### 3. 数据结构调整
`worker_id` 由 `string[]`（`[groupId, workerId]`）变为单个 `string`：
- **types.ts**: `worker_id?: string | null`
- **`getWorkerData`（index.tsx ~78-100 行）**: 不再 `const [groupId, workerId] = values.worker_id`；直接用 `values.worker_id` 反查所属组（遍历 `workerGroupsTree.members`）拿到 `worker_group_id` / `worker_group_name` / `worker_name`
- **回填逻辑 `fillTemplate` / `init`**: 检查是否有按 `[groupId, workerId]` 写入的位置，改为直接写 `worker_id`

### 4. 验收
1. 新建/编辑任务、新建/编辑执行模板、新建/编辑时间触发器、新建/编辑队列触发器，"机器人"模式下下拉为扁平列表，每项 `[组名] 机器人名`
2. 搜索可同时按组名/机器人名匹配
3. 选中后表单值为单个 `worker_id`；提交结果中 `worker_group_id`、`worker_group_name`、`worker_name` 仍能正确派生
4. 机器人组模式不变

