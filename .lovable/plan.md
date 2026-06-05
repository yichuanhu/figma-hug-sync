## 需求评估添加「拒绝」按钮

在需求评估 Tab 的本级操作区，于"提交本级评估"按钮旁新增「拒绝」按钮，点击后将整个需求置为 `REJECTED`（已拒绝），并终止后续评估流程。

### 改动范围

- `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/AssessmentTab/index.tsx`
- `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/AssessmentTab/index.less`（按钮并排布局微调）
- 详情抽屉父层：复用现有 `onSaveAssessment` 通道，扩展为可携带状态变更标记，由父组件写回 `requirement.status = 'REJECTED'`（如无现成入口，则新增 `onReject` 回调贯穿至列表页 mockData 更新器）

### 交互细节

- 按钮位置：当前 `assessment-result-submit` 上方区域，改为两按钮并排：
  - 左侧：`Button theme="light" type="danger"` 文案「拒绝」
  - 右侧：`Button theme="solid" type="primary"` 文案「提交本级评估」
- 拒绝点击：
  1. `Modal.confirm` 二次确认（"拒绝后该需求将终止评估流程，是否继续？"）
  2. 确认后：
     - 当前 record 标记 `status='completed'`、`feasibility='not_feasible'`、写入 `assessor_id/name/assessed_at`，`comment` 取当前文本框内容（可为空）
     - 其余 pending record 保持 pending
     - 通过父回调将需求 `status` 置为 `REJECTED`
     - Toast 提示「需求已拒绝」
- 不强制要求填写拒绝说明（用户未答），仅复用当前评估说明文本框；后续如需必填可再补强。

### 仅 UI/前端

- 不动后端 API、不动审批流。
- 仅 mock 数据流变更：在列表层 `RequirementsAssessment` 页面接收拒绝事件并 patch `status: 'REJECTED'`。

### 验收

- 评估 Tab 在当前用户可编辑级别下展示「拒绝」+「提交本级评估」两个按钮。
- 点击「拒绝」→ 确认弹窗 → 需求状态变为「已拒绝」，抽屉/列表标签同步刷新。
- 已完成或他人负责的级别不显示拒绝按钮。
