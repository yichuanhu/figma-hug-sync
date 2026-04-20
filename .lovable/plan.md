

## 问题诊断

激活方案 **RPA-PRO** 的字段定义存在 4 处问题，导致用户看到"莫名其妙"的字段：

| # | 问题 | 原因 | 修复 |
|---|---|---|---|
| 1 | 「月均节省工时（自动计算）」要求填写 | `type: 'calculation'` 在 `SchemeFieldRenderer` 中没有匹配分支，落入 default → 渲染为可输入的 `Form.Input` | 新增 `case 'calculation'`：渲染只读展示，监听 `monthly_volume × avg_handle_time / 60` 实时计算 |
| 2 | 「OCR 文档类型」始终显示，不受「是否涉及 OCR」控制 | 字段定义有 `depends_on: { field: 'has_ocr', operator: 'eq', value: 'yes' }`，但 `SchemeFieldRenderer` 完全没读取 `depends_on` | `RequirementFormModal` 改用 `Form.Slot`/`useFormState` 在外层根据依赖字段值条件渲染 |
| 3 | 出现两个「附件」字段（一个上传、一个输入） | RPA-PRO 的 `attachments` (`type: 'file_upload'`) 没有匹配分支 → 落入 default 渲染成 `Form.Input`；同时 `RequirementFormModal` 表单底部还硬编码渲染了一个 `Upload`（附件区域） | a) 新增 `case 'file_upload'`：渲染 `Upload`；b) 移除 `RequirementFormModal` 中硬编码的附件区域（统一由 Scheme 字段驱动） |
| 4 | 系统硬编码字段与 Scheme 字段重复 | Modal 顶部硬编码了「业务背景」`businessBackground`，而 RPA-PRO 又有 `business_background`（rich_text）+ `pain_points` + `expected_value`；硬编码的「期望上线日期」也与 Scheme 的 `expected_launch` 重复 | 移除 Modal 中硬编码的「业务背景」「期望上线日期」字段，全部交由 Scheme 渲染（保留：标题/描述/部门/负责人/联系方式/优先级 系统字段）|

## 改动文件

**1. `src/pages/Requirements/RequirementsWorkbench/components/SchemeFieldRenderer/index.tsx`**

- 新增 `case 'calculation'`：通过 `useFormState` 读取 `source_fields`，按 `expression` 计算结果，渲染为只读 `InputNumber`（disabled），右侧显示 unit。值通过 `formApi.setValue(key, computed)` 同步回表单（用 `useFormApi` + `useEffect` 监听依赖变化）。
- 新增 `case 'file_upload'`：渲染 `Form.Upload`（Semi UI 的 Form.Upload），限制 5 个、10MB、复用现有 accept 配置。
- 新增 `case 'rich_text'`：暂用 `Form.TextArea`（autosize 4-8 行 + maxCount 5000）替代，保持 UI 简洁。

**2. `src/pages/Requirements/RequirementsWorkbench/components/RequirementFormModal/index.tsx`**

- **删除**硬编码字段：`businessBackground`、`expectedLaunchDate`，以及底部硬编码的「附件」`Upload` 区域。
- 保留系统字段：`title` / `description` / `department` / `owner` / `contactInfo` / `priority`。
- Scheme 字段渲染处增加依赖判断：遍历 `activeScheme.custom_fields` 时读取 `depends_on`，通过 `useFormState` 拿到依赖字段值，不满足条件时跳过渲染（DOM 卸载，同时清空该字段值避免脏数据）。
- 提交时移除已删除的 system key（`businessBackground`、`expectedLaunchDate`）。

**3. i18n（`public/i18n/zh-CN.json` / `en.json`）**

- 删除：`requirements.form.businessBackgroundLabel`/`Placeholder`、`requirements.form.expectedLaunchDateRequired`/`Placeholder`、`requirements.form.attachmentLabel`/`Upload`/`Hint`/`Exceed`/`SizeError`（如别处仍用则保留）。
- 新增：`requirements.form.calculationReadonlyHint`（"系统自动根据上方字段计算"）。

## 优化后表单顺序（RPA-PRO 激活时）

```text
[基本信息]
- 标题 *
- 简要描述 *
- 所属部门 *
- 需求负责人 *
- 联系方式 *
- 优先级

[业务基线 — 由 Scheme 驱动]
- 业务背景 *（textarea）
- 业务痛点 *
- 期望价值 *
- 月均处理量 *（笔）
- 单笔平均耗时 *（分钟）
- 人工成本占比（%）
- 月均节省工时（小时，只读·自动计算）  ← 修复
- 涉及系统数量 *
- 系统类型 *
- 是否涉及 OCR *
- OCR 文档类型 *  ← 仅当「是否涉及 OCR=是」时显示
- 期望上线日期 *
- 附件（上传，单一入口）  ← 修复
```

## 验收

1. 「月均节省工时」变成灰色只读，输入「月均处理量=1000、单笔平均耗时=6」时自动显示「100」小时。
2. 「是否涉及 OCR」选择「否」时，「OCR 文档类型」字段隐藏；切到「是」时出现并必填。
3. 弹窗底部不再有重复的「附件」输入框，仅保留 Scheme 的上传组件。
4. 不再出现重复的「业务背景」「期望上线日期」字段。

