## 目标

当前 `processVersionApproval.ts` / `processOfflineApproval.ts` 的「审批中」mock 缺少 `approval_template_snapshot` 与历史 `records`，点开「审批进度抽屉」只能看到空状态。需要补充几条**多级审批进度**样例，覆盖 1/N、2/N 已通过、待当前级、跨部门等场景，让列表的「发布审批中 / 下线审批中」Tag 点击后能看到真实的时间线。

## 改动范围

仅修改两个 mock 文件，不动业务逻辑。同时把 STORAGE_KEY 版本号 +1 以刷新 localStorage 缓存。

### 1. `src/mocks/processVersionApproval.ts`（发布审批）

- `STORAGE_KEY` → `apa.processVersionApproval.v3`
- 修正 `pv-001`（产品部，2 级）：注入 `approval_template_snapshot = getApprovalFlowById('pflow-001')`，`current_level = 2`，`records` 包含 L1「部门负责人 林经理 通过」
- 修正 `pv-002`（财务部，1 级）：注入 `approval_template_snapshot = getApprovalFlowById('pflow-002')`，`current_level = 1`，`records = []`（首级待审）
- 新增 `pv-006`：`process_id='process-6'`「合同审批流程」，产品部，3 级模板 `pflow-003`，`current_level=3`，records 含 L1 林经理通过、L2 架构评审 majority 通过
- 新增 `pv-007`：`process_id='process-7'`「客户信息同步」，财务部，1 级 `pflow-002`，刚提交 1 小时，records=[]
- `pv-003`（已发布）补全 `approval_template_snapshot = pflow-001`，便于回看完整通过链路

### 2. `src/mocks/processOfflineApproval.ts`（停用审批）

- `STORAGE_KEY` → `apa.processOfflineApproval.v3`
- 修正 `por-001`（产品部 process-3，2 级）：注入 `approval_template_snapshot = getApprovalFlowById('oflow-001')`，`current_level = 2`，`records` 含 L1「林经理 通过：同意下线，确认无残余依赖」
- 新增 `por-005`：`process_id='process-8'`「员工绩效汇总」，产品部，2 级 `oflow-001`，刚提交，`current_level=1`，records=[]（首级待审）
- 新增 `por-006`：`process_id='process-1'`「订单自动处理流程」，财务部，状态 `APPROVED`，已全部通过待执行，records 含两级通过
- 新增 `por-007`：`process_id='process-4'`「采购申请」，产品部，状态 `EXECUTION_FAILED`，`execution_error='执行时检测到运行中任务，停用未完成。'`，records 含全部通过历史
- `por-002`（已执行）补全 `approval_template_snapshot`，便于查看历史时间线

## 不在范围

- 不修改抽屉/列表/Hook 逻辑（上一轮已实现，能直接消费这些字段）
- 不新增审批模板；复用 `pflow-001/002/003`、`oflow-001`
- 不动状态机/接口签名

## 验收

1. 进入「开发中心 → 流程列表」，process-1/2/6/7 显示「发布审批中」Tag
2. 点击 pv-001 Tag，抽屉显示 2 级时间线，L1 已通过、L2 待当前级
3. 「调度中心 → 流程列表」中 process-3/8 显示「下线审批中」，process-1 显示「下线执行中」，process-4 显示「下线失败」
4. 点击各 Tag 抽屉均能渲染完整多级时间线
