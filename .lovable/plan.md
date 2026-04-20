
## 目标
在工作空间侧成功关联需求后，自动把所关联需求的 `status` 从 `PENDING_APPROVAL / APPROVED / ASSESSING / PENDING_ASSESSMENT / PENDING_PROJECT` 切换到 `DEVELOPING`，并写入一条 `approvalHistory` 留痕（`action: 'approve'`，备注「关联至工作空间 XXX，进入开发」）。

## 一、改动点

### 1. 跨模块状态联动 — `RequirementsProjects/mockData.ts`

在 `linkRequirements` 中：
- 计算 `added = targetRequirementIds - 当前已关联`
- 对每个新增关联的需求 id：
  - 通过 `import { transitionToDeveloping } from '../RequirementsWorkbench/mockData'` 调用一个新暴露的 mock API；
  - 不直接跨模块改对方的内部数据数组（保持模块边界）。

### 2. 在 `RequirementsWorkbench/mockData.ts` 暴露新 API

```ts
export const transitionToDeveloping = async (
  requirementId: string,
  workspace: { id: string; name: string }
): Promise<void>
```

逻辑：
- 仅当 `status ∈ {PENDING_APPROVAL, APPROVED, ASSESSING, PENDING_ASSESSMENT, PENDING_PROJECT}` 时迁移；其它状态（DRAFT/REJECTED/WITHDRAWN/DEVELOPING/LAUNCHED/OFFLINE）保持不变。
- 写入一条 `approvalHistory`：
  ```ts
  {
    id: `hist-${ts}-${rand}`,
    level: cur.approvalFlowConfig?.currentLevel ?? 1,
    approverId: 'system',
    approverName: '系统',
    action: 'approve',
    comment: `已关联至工作空间「${workspace.name}」，自动进入开发中`,
    timestamp: now,
  }
  ```
- 更新 `status = 'DEVELOPING'`、`updatedAt = now`。

### 3. 解除关联（可选，本次不做）
解除关联不回退状态（避免误降级），仅文档化。

### 4. 文档与 i18n
- `.lovable/plan.md` 「关联关系规则」追加「状态联动」小节。
- 新增 i18n 键 `requirements.history.systemAutoToDeveloping`（中/英），用于将来时间线展示，本次先占位。

## 二、不做的事
- 不改变 `linkedRequirementIds` 的现有约束（N:1、已发布禁止解除）。
- 不引入事件总线，跨模块直接函数调用即可（mock 层面）。
- 不改 UI（关联弹窗保存成功后会自然反映新状态）。

## 涉及文件
- `src/pages/Requirements/RequirementsWorkbench/mockData.ts`（新增 `transitionToDeveloping`）
- `src/pages/Requirements/RequirementsProjects/mockData.ts`（在 `linkRequirements` 中调用）
- `public/i18n/zh-CN.json` / `public/i18n/en.json`（新增系统留痕文案）
- `.lovable/plan.md`（追加「状态联动」小节）
