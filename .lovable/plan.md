## 已完成：TaskForm + ParameterInput 公共组件还原

### 新建文件
1. `src/components/TaskForm/types.ts` — 类型定义（ITaskInfo, TaskFormRef, TaskFormSource, Priority, LYInputParameterItem 等）
2. `src/components/TaskForm/hooks/useTaskFormData.ts` — Mock 数据 hooks（useGetProcesses, useGetProcessVersion, useGetWorkerGroups, useWorkerGroupsTree）
3. `src/components/TaskForm/index.tsx` — 主组件（Form + Spin，左侧配置 + 右侧参数）
4. `src/components/TaskForm/index.less` — 主样式
5. `src/components/TaskForm/components/ParameterInput/index.tsx` — 参数输入组件（String/Number/Boolean/Credential）
6. `src/components/TaskForm/components/ParameterInput/index.less` — 参数输入样式

### 修改文件
- CreateTaskModal — 使用 `<TaskForm source={TaskFormSource.TaskList}>`
- CreateTemplateModal — 使用 `<TaskForm source={TaskFormSource.TaskTemplate}>`
- CreateTimeTriggerModal — 第二步使用 `<TaskForm source={TaskFormSource.TimerTrigger}>`
- CreateQueueTriggerModal — 第二步使用 `<TaskForm source={TaskFormSource.QueueTrigger}>`
- i18n (zh-CN / en) — 新增 worker 状态、执行目标、参数验证等翻译 key

### 关键变化
- 执行目标：从三种（BOT_GROUP/BOT_IN_GROUP/UNGROUPED_BOT）改为两种（worker_group/worker）
- 机器人选择：从 BotTargetSelector 改为 Form.Cascader 树形选择
- 参数输入：从 Form.Input 改为 Form.TextArea（string）；Credential 从 Select 改为用户名+密码
- 机器人状态：5 种状态（OFFLINE/IDLE/BUSY/FAULT/MAINTENANCE）
- useImperativeHandle：暴露 init/submit/pre 三个方法
