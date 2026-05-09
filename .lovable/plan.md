## 问题
三个弹窗（批量导入 ImportAssignedValueModal、分配值新建/编辑 AssignedValueFormModal）使用自定义 footer，底部按钮紧贴弹窗边缘，缺少 padding-bottom，与项目其他弹窗（如 EditCredentialModal 的 footer 含 `padding-bottom: 12px`）不一致。

## 修改

### 1. ImportAssignedValueModal
`src/components/CredentialManagement/CredentialManagementContent/components/ImportAssignedValueModal/index.less`

```less
&-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
  padding-top: 16px;
  padding-bottom: 12px;
  border-top: 1px solid var(--semi-color-border);
}
```

（同时补上分隔线，与凭据弹窗 footer 风格保持一致）

### 2. AssignedValueFormModal（新建/编辑共用）
`src/components/CredentialManagement/CredentialManagementContent/components/CredentialDetailDrawer/AssignedValueFormModal/index.tsx`

当前 footer 用内联 style，没有 padding-bottom。改为统一样式：

```tsx
<div style={{
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  marginTop: 12,
  paddingTop: 16,
  paddingBottom: 12,
  borderTop: '1px solid var(--semi-color-border)',
}}>
```

与 EditCredentialModal、CreateCredentialModal footer 完全一致。

## 验证
打开三个弹窗，确认底部按钮上方有 16px 分隔线、下方有 12px 留白，整体与凭据编辑弹窗风格一致。