## 下线列表列调整

列已按截图重排并移除"版本"列（用户已确认完全移除）。当前 7 列顺序：

1. **流程名称** — 粗体
2. **状态** — width 130，`OFFLINE_STATUS_TAG` 映射
3. **审批进度** — width 100，align center，仅 `PENDING_APPROVAL` / `APPROVING` 显示 `第 X / Y 级` 或 `current_approver_label`，其余终态显示 `-`
4. **申请人** — width 130，`UserNameWithCard`
5. **所属部门** — width 160
6. **申请原因** — Popover 悬浮全文
7. **提交时间** — width 170

`TableSkeleton` 同步为 7 列。该修改已在上一轮 build 中完成，若需进一步调整请说明具体差异。