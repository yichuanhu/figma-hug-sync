## 下线列表列调整

目标：移除"版本"列，剩余 7 列顺序对齐截图需求。

### 1. 列顺序重排（`OfflineRequests/index.tsx`）

移除 `process_version` 列定义，剩余列按以下顺序排列：

1. **流程名称** — `dataIndex: 'process_name'`，保持粗体渲染
2. **状态** — `dataIndex: 'status'`，width 130，`OFFLINE_STATUS_TAG` 映射
3. **审批进度** — `dataIndex: 'current_level'`，width 100，align center，仅 `PENDING_APPROVAL` / `APPROVING` 显示进度或标签，其余终态显示 `-`
4. **申请人** — `dataIndex: 'applicant_name'`，width 130，`UserNameWithCard`
5. **所属部门** — `dataIndex: 'department_name'`，width 160
6. **申请原因** — `dataIndex: 'reason'`，Popover 悬浮全文，保持现状
7. **提交时间** — `dataIndex: 'submitted_at'`，width 170

### 2. TableSkeleton 同步

`columns` 从 `6` 改为 `7`，`columnWidths` 重新分配为 7 列比例。

### 不修改的内容
- 审批进度渲染逻辑（已有，保持不变）
- 分页、筛选、抽屉、创建弹窗等其他逻辑