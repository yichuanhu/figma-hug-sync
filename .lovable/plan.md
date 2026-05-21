## 改动

`src/pages/Requirements/ApprovalConfig/components/ApprovalFlowBuilder/index.tsx`：移除"适用部门"卡片在未选部门时注入的黄色背景内联样式（`background: warning-light-default` / `borderColor: warning-light-active`），与需求模板保持一致。仅保留红色 `*` 与"（启用时必填，草稿可留空）"提示。

具体：删掉 `showWarning` 判断和 `<div className="approval-flow-section-card" style={showWarning ? {...} : undefined}>` 中的 style 注入，直接使用默认卡片样式。

## 验收

进入审批配置 builder 页，未选适用部门时卡片背景为白色（`--semi-color-bg-0`），仅保留红 `*` 与提示文案。