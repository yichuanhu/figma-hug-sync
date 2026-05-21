
## 问题定位

| # | 问题 | 复现路径 | 根因 |
|---|------|---------|------|
| 1 | 基于模板创建后偶发 "模板不存在" Toast | `RequirementsScheme` → 基于模板创建 → 选模板 → 跳 `SchemeBuilder` | `SchemeBuilder` 进入时立即 `getSchemeById(id)`，找不到就直接 `Toast.error + navigate`，对刚 `clone`/`create` 完跳转过来的 draft 没有重试容错；个别场景（StrictMode 双 mount、订阅触发的 reload）下读不到就会误报。 |
| 2 | 需求模板编辑页仍有 "评估配置" Tab | `/requirements/scheme/builder/:id` | 上一轮只把 `审批配置` 改名为 `评估配置`，Tab 仍在；用户要求评估能力一并下沉/移除。 |
| 3 | 需求模板 "适用部门" 块背景仍是黄色 | 同上 | `SchemeBuilder/index.tsx` 在 `deptCount === 0` 时设置 `background: warning-light-default`，与审批配置视图风格不一致。 |

## 改动方案

### 1. `SchemeBuilder/index.tsx` —— 模板加载稳健性 + 去掉黄底 + 移除评估 Tab

- **加载稳健性**：把首次 `useEffect` 里 `if (!s)` 的处理从 "立即 toast + navigate" 改为 "轮询 1 帧 + 一次重试"。
  - 思路：用 `requestAnimationFrame` 或 `setTimeout(0)` 再读一次 `getSchemeById(id)`；仍找不到才 toast + navigate。
  - 顺手把 `subscribeSchemeChange` 回调里的 `if (!s) return;` 保留（已有），无需 toast。
- **去黄底**：移除 `applicable_department_ids.length === 0` 时给 `.approval-flow-section-card` 注入的 `background / borderColor` 内联样式；仅保留卡片本身边框与标题区 `*` 红色星标 + "（激活时必填，草稿可留空）" 提示，与 ApprovalConfig 默认（非编辑态）一致。
- **移除评估配置 Tab**：
  - 删除 `<Tabs>` 中 `itemKey="workflow"` 的 `TabPane`；不再渲染 `WorkflowBuilder`、`AssessmentBuilder` 相关组件。
  - 删除 `Tabs` 包裹本身，直接渲染表单 (`FormBuilder`)；若后续仍需多 tab 可保留 `Tabs`，但此次仅一个 `form` tab 时使用单页面布局更干净。
  - 移除 `activeTab` state、`tabBadge('workflow' | 'assessment')` 逻辑、`workflow` / `assessment` 的 `missingTabs` 处理。
  - `patch(...)` 调用清理 `workflow_config / value_assessment_model / complexity_assessment_model` 等已不再编辑的字段写入。
- **保存逻辑**：`updateSchemeBuilder` 调用时不再传 `workflow_config / value_assessment_model / complexity_assessment_model`（这些字段保持初始 draft 中的空/默认值即可）。
- **import 清理**：移除 `WorkflowBuilder`、未使用的 `AlertCircle`、`Tabs/TabPane` 等导入；保留 `Building2`、`DepartmentPicker` 等。

### 2. `RequirementsWorkbench/schemeConfig.ts` & 校验

- `validateScheme` 中已经把 workflow/assessment 设为可选，不需要再改。
- 不动 `WorkflowBuilder` 文件本身（其他位置如 `ApprovalConfig` 仍可能引用 `buildWorkflowFromTemplate`，保持兼容）。

### 3. i18n 清理

- `public/i18n/zh-CN.json` & `public/i18n/en.json`：
  - 保留 `requirements.scheme.builder.tabs.form`；
  - 不再展示 `tabs.workflow` / `tabs.assessment`，可保留 key 防止误删引用。
  - `requirements.scheme.builder.notFound` 文案保留。

## 变更文件清单

- `src/pages/Requirements/RequirementsScheme/components/SchemeBuilder/index.tsx`（核心：去 Tab / 去黄底 / 加重试容错）

## 验收

1. 进入 `/requirements/scheme`，点 "基于模板创建" 选任意模板 → 应进入 builder 页且**不会出现 "模板不存在" Toast**；快速点 "+ 新建模板" 也一样。
2. Builder 页顶部 "适用部门" 卡片：**背景为白色 / `--semi-color-bg-0`**（即使未选部门），保留红色 `*` 与 "（激活时必填，草稿可留空）" 提示。
3. Builder 页**只剩一个"表单"区域**，不再有 `表单 / 评估配置` Tab 切换。
4. 保存 / 激活流程不受影响（评估字段保持空）。
