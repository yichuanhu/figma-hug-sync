## 变更范围
仅修改 `src/pages/Scheduling/TaskManagement/TaskManagementPage/index.tsx` 两处：

1. **rowSelection 禁用不可取消的任务**
   - 在 `Table` 的 `rowSelection` 中增加 `getCheckboxProps`
   - 返回 `disabled: record.task_status !== 'PENDING'`
   - 表头全选将自动只选中启用的行
   - 不影响行点击打开详情的交互

2. **DatePicker placeholder 文案调整（方案 A）**
   - 将 `placeholder={['开始时间', '结束时间']}` 改为 `placeholder={['创建开始时间', '创建结束时间']}`
   - 保持 `width: 340`、`type="dateTimeRange"`、`density="compact"` 等其他属性不变
   - 零样式回归风险