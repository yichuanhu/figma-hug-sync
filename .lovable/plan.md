
## 目标
将需求详情抽屉的左侧 Tab 样式与开发中心其它抽屉（如自动化流程详情）保持一致：Tab 底部分隔线需左对齐到抽屉边框（贯穿整个 Tab 容器宽度），而不是仅在 Tab 文字下方。

## 现状分析
- `RequirementDetailDrawer/index.less` 中 `.requirement-detail-left` 有 `padding: 0 0 0 24px`，导致 Tab bar 也被内缩 24px，底部分隔线无法贴到抽屉左边框。
- 参考图（image-260）：开发中心抽屉的 Tab 底线从抽屉最左侧贯穿到右侧。
- Semi UI Tabs 的底部分隔线由 `.semi-tabs-bar` 的 `border-bottom` 渲染。

## 实现方案

修改 `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/index.less`：

1. 移除 `.requirement-detail-left` 的左侧 padding（`padding: 0 0 0 24px` → `padding: 0`），让 Tabs 容器贴到抽屉左边框，使分隔线贯穿。
2. 在 `.requirement-detail-tabs` 的 `.semi-tabs-bar` 上添加左侧 padding（24px），让 Tab 文字本身保持原有缩进对齐抽屉标题。
3. Tab 内容区 `.requirement-detail-tab-content` 增加左侧 24px padding，保持内容与抽屉标题对齐（当前是 `padding: 16px 16px 24px 0`，改为 `padding: 16px 16px 24px 24px`）。

## 涉及文件
- `src/pages/Requirements/RequirementsWorkbench/components/RequirementDetailDrawer/index.less`
