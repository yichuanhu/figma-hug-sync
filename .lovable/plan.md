## 目标
取消独立的 `ApprovalProgressDrawer` 入口，将「审批进度」改为流程详情抽屉（`ProcessDetailDrawer`）内的一个 Tab，与「详情/版本/依赖/资料/工作量/ROI」并列。点击列表上的「发布审批中 / 下线审批中 / 下线执行中 / 下线失败」Tag 直接打开流程详情抽屉并定位到该 Tab。

## 改动范围

### 1. 新增 `ProcessDetailDrawer/components/ApprovalProgressTab/index.{tsx,less}`
- 入参：`processId`、`context`（development | scheduling）
- 内部根据 context 选择数据源：
  - development：取该流程**最新的** `PENDING_APPROVAL / REJECTED / APPROVED` 版本（`fetchProcessVersions` + 按 `process_id` 过滤）；展示发布场景元信息（版本号、发布说明、申请人、部门、提交时间）+ 多级时间线
  - scheduling：取该流程**最新的** offline request（`fetchOfflineApprovals` + 按 `process_id` 过滤）；展示停用场景元信息（申请人、部门、提交时间、停用原因、执行错误/执行时间）+ 多级时间线
- 没有任何审批记录时，用 `EmptyState`（`no-data`）+ 文案「暂无审批记录」
- 复用现有 `renderLevels` 视觉与文案 i18n key（直接迁移现有 `ApprovalProgressDrawer` 的渲染函数）
- 顶部保留只读提示横条 + 状态 Tag（待审批 / 审批通过 / 已拒绝 / 下线执行中 / 下线失败）
- 订阅 `subscribeProcessVersionChange / subscribeOfflineRequestChange` 实时刷新

### 2. `ProcessDetailDrawer/index.tsx`
- `Tabs` 新增 `<TabPane itemKey="approval" tab="审批进度">`，位置放在「依赖」之后、「资料」之前
- Tab 标题旁可加一个 Tag 角标（如「待审」「失败」），让用户一眼看到状态；无审批记录时不显示角标
- 接收新 prop `initialTab` 已存在，无需新增；只需支持值 `'approval'`
- `ProcessDetailDrawerProps` 不变（context 已有）

### 3. `ProcessManagementContent/index.tsx`
- 删除 `ApprovalProgressDrawer` import、`approvalDrawer` state、`handleOpenApprovalProgress`、JSX 中的 `<ApprovalProgressDrawer />`
- 改写 `ApprovalHintCell` 的 `onOpen` 回调：
  ```ts
  const handleOpenApprovalHint = (hint: ApprovalHint, record: LYProcessResponse) => {
    setSelectedProcess(record);
    setInitialTab('approval');
    setDetailDrawerVisible(true);
  };
  ```
- 需要新增/复用一个 `initialTab` state（当前打开抽屉的入口控制），传给 `<ProcessDetailDrawer initialTab={initialTab} />`
- 列表行 `onClick` 默认仍打开 `detail` tab；点击 Tag 时 stopPropagation + 走上面的回调

### 4. `ApprovalHintCell/index.tsx`
- `onOpen` 签名从 `(hint) => void` 改为 `(hint) => void` 不变，但调用方在列上重新绑定为传递 record（在 ProcessManagementContent 的列 render 里 inline 闭包即可，组件本身不动）

### 5. 删除 `ApprovalProgressDrawer` 目录
- `index.tsx`、`index.less` 全部删除（视觉与逻辑被新 Tab 取代）
- 现有 i18n key（`titlePublish/titleOffline/readonlyTip/applicant/...`）继续在新 Tab 中使用，**不动 i18n 文件**

## 不在范围
- 不修改 mock 数据（已在上一轮补全多级 records）
- 不修改 `useProcessApprovalHints` Hook（仍用于在列上渲染 Tag）
- 不改其它 Tab / 抽屉头部操作按钮

## 验收
1. 调度中心流程列表，点击「下线审批中」Tag → 弹出流程详情抽屉，自动停留在「审批进度」Tab，内容包含停用原因、依赖摘要、L1/L2 时间线
2. 开发中心点击「发布审批中」Tag → 同抽屉，Tab 显示版本号 + 发布说明 + 时间线
3. 直接点击行打开详情抽屉时，仍默认 `detail` Tab；切换到「审批进度」可看到同样内容
4. 无任何审批记录的流程，「审批进度」Tab 仍可访问，显示空状态
5. 全局搜索 `ApprovalProgressDrawer` 应只剩新 Tab 引用，旧抽屉目录已删除
