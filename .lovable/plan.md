

## 方案：OwnerSelect 优化 + 创建弹窗归属者可编辑

### 改动 1：OwnerSelect 去掉部门图标

**文件**：`src/components/OwnerSelect/index.tsx`

在 `renderLabel` 中，部门节点不再显示 `Building2` 图标，仅用户节点保留 `User` 图标。移除 `Building2` 的 import。

### 改动 2：创建弹窗中归属者改为 OwnerSelect（12 个文件）

将所有创建弹窗中的 `<Form.Input disabled initValue={MOCK_CURRENT_USER.name} />` 替换为 `<OwnerSelect>`，默认值设为 `MOCK_CURRENT_USER.id`：

```tsx
const [ownerId, setOwnerId] = useState<string>(MOCK_CURRENT_USER.id);

<Form.Slot label={t('common.owner')}>
  <OwnerSelect value={ownerId} onChange={setOwnerId} />
</Form.Slot>
```

涉及文件：

| # | 文件 |
|---|------|
| 1 | CreateQueueModal |
| 2 | CreateCredentialModal |
| 3 | CreateParameterModal |
| 4 | CreateProcessModal（ProcessManagement） |
| 5 | CreateProcessModal（ProcessDevelopment） |
| 6 | CreateWorkerModal |
| 7 | CreateWorkerGroupModal |
| 8 | CreateTimeTriggerModal |
| 9 | CreateQueueTriggerModal |
| 10 | CreateTemplateModal |
| 11 | CreateTaskModal |
| 12 | RequirementFormModal |

### 修改文件汇总

共 **13 个文件**（1 组件 + 12 创建弹窗）。

