

## 计划

完全移除 TaskForm "执行目标"区块中的"机器人组"选项与 Radio 切换，仅保留扁平机器人选择器。

### 改动 `src/components/TaskForm/index.tsx`
1. 移除 `targetType` state 与 `Radio.Group`、机器人组 `Form.Select`
2. 移除 `useGetWorkerGroups` 调用与 `workerGroupList` 相关逻辑
3. `getWorkerData` 仅保留 worker 模式分支（去除 worker_group 分支）
4. `initForm` / `pendingValidation` 不再设置 `targetType`，不再回填 `worker_group_id`
5. `fillTemplate` 中 `BOT_GROUP` 模板：将组下首个机器人作为默认值（或留空）—— 采用留空 + Toast 提示更安全；与用户确认前先采用"留空"
6. 区块标题改为"执行机器人"，下拉直接挂在标题下

### 验收
- 弹窗内不再出现 Radio 切换
- 仅一个扁平机器人下拉，必填校验生效
- 提交结果 `worker_id` 为单字符串，`worker_group_id/name` 由所属组派生

