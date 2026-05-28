
# 任务列表 - 筛选增强与批量取消方案

涉及主文件：`src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx`，共用组件 `src/components/FilterPopover`。

---

## 一、筛选增强（STORY-009）

### 1. 顶部工具栏（常驻筛选）
重排后顺序：
- 搜索框（320px）
- 流程选择 `process_id`（新增 Semi `Select` 多选）
- 任务状态 `task_status`（从面板移到顶部，Semi `Select` 多选）
- 所属部门 `owning_department_name`（**常驻**，沿用现有 `DepartmentSelect` 多选）
- 任务创建时间 `created_at_start/end`（独立 `DatePicker type="dateTimeRange"`）
- 筛选按钮（带生效条件数量徽标）
- 刷新
- 创建任务

### 2. 筛选面板（收纳条件）
`FilterPopover` 中放置：
- 执行目标（类型 + 目标联动：机器人 / 机器人组）
- 优先级（checkbox：HIGH/MEDIUM/LOW/MANUAL_QUEUE_BREAKER）
- 触发来源 `trigger_source`（checkbox：MANUAL/SCHEDULED/QUEUE/TEMPLATE）
- 所属触发器 `trigger_id`（Select，按当前触发来源动态过滤可选项）
- 是否录屏 `enable_recording`（radio：不限 / 启用 / 关闭）
- 包含任务截图 `has_screenshot`（checkbox 单项：仅 `true`，未选则不限）

注：所属部门已移至顶部常驻，不再放入面板。

### 3. 活动筛选标签栏
表格上方新增 `ActiveFilterChips` 行：把顶部 + 面板内全部已生效条件以可关闭 `Tag` 展示，提供"清除全部"。关闭单条 → 清除对应条件并刷新。

### 4. FilterPopover 扩展
为支持执行目标/触发器等下拉，给 `FilterSection` 新增类型：
- `select`：单选 Select
- `multiSelect`：多选 Select
- `targetSelector`：执行目标专用（类型 + ID 联动）
保留现有 `checkbox/radio/dateRange`。筛选按钮（Filter 图标）右上角以小徽标显示生效条件数量。

### 5. Mock 与查询参数
- `fetchTaskList` 新增对 `process_id`、`execution_target_type+id`、`trigger_id`、`enable_recording`、`has_screenshot`、`priority` 的过滤。
- `created_at_start/end` 替换原 `start_time/end_time`。
- mock 任务数据补充 `trigger_id / trigger_name / worker_id / worker_group_id`；提供 mock `processList / triggerList` 供下拉。

### 6. 空状态
任意筛选条件生效且结果为空时显示 `EmptyState variant="noResult"`，文案"未找到匹配任务"。

---

## 二、批量取消（STORY-010）

### 1. 表格多选
- `Table` 加 `rowSelection`，`selectedRowKeys` 状态在页面层；翻页/筛选切换时清空。
- 行点击仍打开详情；勾选框 `onClick` `stopPropagation`。

### 2. 批量操作栏
`selectedRowKeys.length > 0` 时表格上方显示 `TaskBatchBar`（参考 `BatchOperationBar`）：
- 左：`已选择 N 项`、`清除选择`
- 右：`批量取消`按钮
  - 选中无 `PENDING` 时禁用并 Tooltip"没有可取消任务"
  - 无 `task_control` 权限时整条不渲染（mock 阶段默认有权限，预留 hook）

### 3. 确认 Modal
`Modal.confirm` 内容：
- 已选择 N 个
- 当前可取消 M 个（PENDING）
- 不可取消 K 个
- 提示"最终结果以服务端返回为准"
确认按钮 `type=warning`。

### 4. 提交与反馈
- mock `bulkCancelTasks(ids)`：仅 `PENDING` 设为 `CANCELLED`，其余产生失败项。
- 返回 `{ total, success_count, failed_count, items }`。
- 完成后：刷新列表、清空选择、同步详情抽屉状态。
- 全成功：`Toast.success`；部分失败：`Toast.warning` + 次级 Modal 列出失败明细。
- 提交前若 >100 提示"单次最多取消 100 个任务"。

### 5. 审计日志
mock 阶段 console 输出占位，注释 TODO 接入。

---

## 三、技术细节

- 新增子组件目录：
  - `TaskManagementPage/components/ActiveFilterChips/`
  - `TaskManagementPage/components/TaskBatchBar/`
  - `TaskManagementPage/components/BulkCancelConfirm/`
- 扩展 `src/components/FilterPopover/index.tsx`：新增 `select / multiSelect / targetSelector` 类型。
- i18n：在 `public/i18n/zh-CN.json` / `en.json` 补 `task.filter.*` 与 `task.bulk.*` 文案。
- 验证：勾选 → 操作栏出现；批量取消 → 确认 Modal 数量正确；筛选 → 标签与结果同步；清除全部 → 恢复默认。

---

## 四、范围外

- 真实后端 `bulk-cancel` 接入（mock）
- 批量中止/重新执行/删除/修改配置
- 按执行记录开始/结束时间、实际录屏文件生成筛选
