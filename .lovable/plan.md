

# 协作者弹窗视觉修复（5项）

## 变更概要

5 处修改，涉及 3 个文件。

## 具体改动

### 1. 部门图标改为 IconFlowChartStroked

**文件**: `CollaboratorPanel/index.tsx`

将所有部门头像中的 `<Building2>` (Lucide) 替换为 `<IconFlowChartStroked />` (Semi Icon)，保持灰色圆形背景不变。涉及位置：
- `renderCollaboratorItem` 中的部门 Avatar (L370-372)
- `renderQuickViewHeader` 中的 AvatarGroup (如有部门判断)
- 搜索结果中如有部门类型

### 2. 去掉角色文本按钮左侧的竖线

**文件**: `CollaboratorPanel/index.less`

`.collaborator-panel-role-text-btn` 移除 `border-left: 1px solid var(--semi-color-border)`。

### 3. 弹窗标题行重构：标题左侧，头像组+关闭按钮右侧

**文件**: `CollaboratorPanel/index.tsx` + `index.less`

当前结构：Modal 自带 title + closable，快捷视图内部又渲染了一个 `renderQuickViewHeader`（含标题和头像组）。

改为：
- 移除 `renderQuickViewHeader()`，将头像组移入 Modal 的 `title` 区域
- Modal 设置 `closable={false}`，自行在 title 右侧渲染：`头像组 + 人数Tag` | 竖线分隔 | `关闭按钮(X)`
- 管理视图同理：左侧返回箭头+标题，右侧同样保留头像组区域（点击可切回快捷视图）

```tsx
// Quick view title
<div className="collaborator-panel-modal-title">
  <span className="collaborator-panel-header-title">
    {t('collaborator.actions.addCollaborator')}
  </span>
  <div className="collaborator-panel-modal-title-right">
    <div className="collaborator-panel-header-right" onClick={() => setPanelView('manage')}>
      <AvatarGroup ...>{...}</AvatarGroup>
      <Tag ...>{count}</Tag>
    </div>
    <Divider layout="vertical" />
    <Button icon={<X size={16} />} theme="borderless" size="small" onClick={() => onVisibleChange(false)} />
  </div>
</div>

// Manage view title
<div className="collaborator-panel-modal-title">
  <div className="collaborator-panel-manage-back" onClick={() => setPanelView('quick')}>
    <IconChevronLeft size="small" />
    <span>{t('collaborator.panel.manageTitle')}</span>
  </div>
  <div className="collaborator-panel-modal-title-right">
    {/* 同样的头像组区域 */}
    <Divider layout="vertical" />
    <Button icon={<X />} ... />
  </div>
</div>
```

Less 新增 `.collaborator-panel-modal-title` 和 `-right` 样式（flex、space-between、align-items center）。

### 4. 弹窗边距对齐新建凭据弹窗

**文件**: `CollaboratorPanel/index.less`

新建凭据弹窗使用 Semi Modal 默认 body padding（`24px`）。当前弹窗 body padding 为 0，各子元素自行设 `padding/margin: 0 24px`。

统一调整：
- `.semi-modal-body` 改为 `padding: 0 24px 24px !important`
- 移除 `.collaborator-panel-search-input-box` 的 `margin: 0 24px 12px`，改为 `margin: 0 0 12px`
- 移除搜索结果 `padding: 4px 24px` → `padding: 4px 0`
- 移除管理列表 `padding: 4px 24px` → `padding: 4px 0`
- 移除批量操作 `padding: 12px 24px` → `padding: 12px 0`
- 移除按钮区 `padding: 8px 24px 16px` → `padding: 8px 0 16px`
- `.collaborator-panel-header` padding 调整为 `16px 0 12px`（modal header 已有左右 padding）

### 5. 从组织架构添加时隐藏主弹窗

**文件**: `CollaboratorPanel/index.tsx`

点击"从组织架构添加"时，先关闭主弹窗 `onVisibleChange(false)`，然后打开 `CollaboratorAddModal`。`CollaboratorAddModal` 关闭时（`onClose`/`onSuccess`），重新打开主弹窗 `onVisibleChange(true)`。

```tsx
// 点击从组织架构添加
const handleOpenOrgModal = () => {
  onVisibleChange(false); // 隐藏主弹窗
  setAddModalVisible(true);
};

// CollaboratorAddModal 关闭回调
const handleAddModalClose = () => {
  setAddModalVisible(false);
  onVisibleChange(true); // 恢复主弹窗
};

const handleAddSuccess = () => {
  setCollaborators(getCollaborators(assetType, assetId));
  setAddModalVisible(false);
  onVisibleChange(true); // 恢复主弹窗
};
```

## 文件变更汇总

| 文件 | 改动 |
|------|------|
| `CollaboratorPanel/index.tsx` | 部门图标→IconFlowChartStroked；title重构（头像组+关闭移入title右侧）；组织架构弹窗互斥逻辑 |
| `CollaboratorPanel/index.less` | 移除role-text-btn竖线；新增modal-title样式；边距统一为body级24px |

