

## 方案：百分百还原 TaskForm + ParameterInput 公共组件

### 核心原则

完全按照参考代码（index-8.tsx/index-8.less/index-9.tsx/index-9.less/useQuery.ts）的结构、逻辑和样式进行还原，仅做必要的环境适配（`useI18n` → `useTranslation`，真实 API → Mock 数据）。

### 参考代码与当前项目的差异对照

| 参考代码 | 当前项目 | 适配方式 |
|---------|---------|---------|
| `useI18n` from `@monorepo/uci-react` | `useTranslation` from `react-i18next` | 替换 import，`t()` 用法相同 |
| `useGetProcesses` / `useGetProcessVersion` / `useGetWorkerGroups` / `useWorkerGroupsTree` 真实 API hooks | 无对应 API | 用 Mock 数据模拟同样的返回结构 |
| `LYInputParameterItem` / `LYOutputParameterItem` / `LYProcessResponse` / `Priority` 类型 | 不存在 | 在 `types.ts` 中定义，结构与参考代码一致 |
| `encrypt` from `@/utils` | 不存在 | 创建空实现（Mock 环境不需要真加密） |
| `Form.Cascader` 选择机器人（树形） | 当前用 `BotTargetSelector` 组件 | **按参考代码使用 `Form.Cascader`** |
| `Radio.Group` 两种目标类型（worker_group / worker） | 当前用三种（BOT_GROUP / BOT_IN_GROUP / UNGROUPED_BOT） | **按参考代码改为两种** |
| `IconHelpCircle` from `@douyinfe/semi-icons` | 当前用 Lucide `HelpCircle` | **按参考代码用 Semi Icons** |
| `useFormApi` 在 ParameterInput 中 | 无 | 按参考代码使用 |
| `Form.TextArea` 用于 string 参数 | 当前用 `Form.Input` | **按参考代码用 TextArea** |
| Credential 参数：用户名 + 密码（mode="password"） | 当前用 Select 选凭据 | **按参考代码实现** |

### 新建文件（6 个）

| # | 文件 | 说明 |
|---|------|------|
| 1 | `src/components/TaskForm/types.ts` | `ITaskInfo`、`TaskFormRef`、`TaskFormSource`、`LYInputParameterItem`、`LYOutputParameterItem`、`Priority` 枚举 — 完全复制参考代码定义 |
| 2 | `src/components/TaskForm/hooks/useTaskFormData.ts` | Mock 实现 `useGetProcesses`、`useGetProcessVersion`、`useGetWorkerGroups`、`useWorkerGroupsTree`，返回结构与参考代码 `useQuery.ts` 一致 |
| 3 | `src/components/TaskForm/index.tsx` | **百分百还原** index-8.tsx：Form + Spin 包裹，左侧（preFormItem 插槽 → 流程配置 → 执行目标 RadioGroup(worker_group/worker) + Form.Select/Form.Cascader → 执行设置 → bottomFormItem 插槽），右侧 ParameterInput |
| 4 | `src/components/TaskForm/index.less` | **百分百还原** index-8.less：`.task-template-*` 类名体系 |
| 5 | `src/components/TaskForm/components/ParameterInput/index.tsx` | **百分百还原** index-9.tsx：ParameterLabel、OutputParameterLabel、StringParameterInput(TextArea)、NumberParameterInput、BooleanParameterInput、CredentialParameterInput（用户名+密码模式） |
| 6 | `src/components/TaskForm/components/ParameterInput/index.less` | **百分百还原** index-9.less |

### 修改文件（4 个弹窗）

每个弹窗保留自己特有的部分（Modal 外壳、步骤向导、特有字段），将流程配置 + 执行目标 + 执行设置 + 参数输入/输出替换为 `<TaskForm>`：

**1. CreateTaskModal** — `source={TaskFormSource.TaskList}`
- `preFormItem`：模板选择 + 归属者
- 移除内联 mockProcesses/mockBots/mockBotGroups/mockCredentials
- 移除 BotTargetSelector 引用
- 移除内联 renderParameterInput

**2. CreateTemplateModal** — `source={TaskFormSource.TaskTemplate}`
- `preFormItem`：模板名称 + 描述 + 归属者
- 同上清理

**3. CreateTimeTriggerModal** — `source={TaskFormSource.TimerTrigger}`
- 保留 Steps 三步向导结构
- 第二步任务配置区域使用 `<TaskForm>`
- `preFormItem`：无（触发器名称在第一步）
- 移除第二步中的内联流程/执行目标/执行设置代码

**4. CreateQueueTriggerModal** — `source={TaskFormSource.QueueTrigger}`
- 保留 Steps 三步向导结构
- 第二步任务配置区域使用 `<TaskForm>`
- 同上清理

### 关键还原细节

1. **执行目标**：只有两种 `worker_group` / `worker`，RadioGroup 切换，worker 模式用 `Form.Cascader` 树形选择（组 → 机器人），**不使用** BotTargetSelector
2. **机器人状态**：5 种状态（OFFLINE/IDLE/BUSY/FAULT/MAINTENANCE）配色与参考代码一致
3. **ParameterInput**：Credential 类型渲染用户名 Input + 密码 Input（mode="password"），含首次聚焦清空、失焦恢复逻辑
4. **useImperativeHandle**：暴露 `init` / `submit` / `pre` 三个方法，弹窗通过 ref 调用
5. **下拉宽度**：`dropdownStyle` 根据 `showRightPanel` 动态计算（382px / 460px）
6. **TaskList 来源**显示 URGENT 优先级，**TimerTrigger 来源**显示 task_repeat + task_num

### 需要添加的 i18n key

补充缺失的翻译 key（如 `worker.status.idle`、`worker.status.busy`、`worker.status.fault`、`worker.status.maintenance`、`template.validation.processNoVersion`、`template.validation.mustBeInteger`、`template.fields.taskRepeat`、`template.fields.taskNum`、`common.num` 等）。

### 改动规模

新建 **6 个文件**，修改 **4 个弹窗文件** + **i18n 文件**（en/zh），共约 **11-12 个文件**。

