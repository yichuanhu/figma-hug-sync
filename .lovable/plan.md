

# 协作者弹窗优化（3项）

## 变更概要

3 处改动，涉及 2 个文件。

## 具体改动

### 1. 角色选择器改用 CollaboratorRoleSelect

**文件**: `CollaboratorPanel/index.tsx` (L490-531)

将当前 Popover + 手动 div 角色菜单替换为已有的 `CollaboratorRoleSelect` 组件，获得原生 Semi Select 行为（自动收起、角色描述展示）：

```tsx
{selectedUsers.length > 0 && (
  <CollaboratorRoleSelect
    value={batchRole}
    onChange={(role) => setBatchRole(role)}
    assetType={assetType}
    size="small"
  />
)}
```

移除 `IconChevronDown` 导入（如无其他使用处）。

### 2. 搜索框内 Select 无边框样式 + hover 文字变蓝

**文件**: `CollaboratorPanel/index.less`

在 `&-search-input-box` 内新增 `.semi-select` 覆盖样式：

```less
&-search-input-box {
  .semi-select {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    flex-shrink: 0;

    &:hover {
      background: transparent !important;
    }

    .semi-select-selection {
      font-size: 14px;
    }

    &:hover .semi-select-selection-text {
      color: var(--semi-color-primary);
    }
  }
}
```

同时移除 `.collaborator-panel-role-text-btn` 整个样式块（不再需要）。

### 3. 管理视图"添加协作者"改为 Button

**文件**: `CollaboratorPanel/index.tsx` (L592-601)

将当前 `.action-row` div（圆形图标背景 + 文字）替换为 Semi `Button`：

```tsx
{canManage && (
  <div className="collaborator-panel-manage-add">
    <Button
      type="tertiary"
      icon={<UserPlus size={14} />}
      block
      onClick={handleOpenOrgModal}
    >
      {t('collaborator.actions.addCollaborator')}
    </Button>
  </div>
)}
```

## 文件变更汇总

| 文件 | 改动 |
|------|------|
| `CollaboratorPanel/index.tsx` | Popover 角色菜单→CollaboratorRoleSelect；管理页添加协作者→Button |
| `CollaboratorPanel/index.less` | 搜索框内 Select 无边框样式；移除 role-text-btn 样式块 |

