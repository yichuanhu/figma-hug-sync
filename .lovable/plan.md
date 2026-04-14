

## 方案：基于部门树的用户选择组件（OwnerSelect）

### 需求理解

用户希望"归属者"选择器采用部门树形结构展开选择用户，类似 DepartmentSelect 的交互模式，但叶子节点是用户而非部门。

### 组件设计

**新建文件**：`src/components/OwnerSelect/index.tsx`

基于 Semi UI `TreeSelect` 实现，复用 DepartmentSelect 的设计模式：

```text
Laiye Technology (不可选)
├── CEO Office (不可选)
│   └── Michael Chen (可选，叶子节点)
├── Enterprise Business Center (不可选)
│   ├── North China Regional Business Division (不可选)
│   │   ├── David Liu (可选)
│   │   ├── Wenjie Rong (可选)
│   │   └── ...
│   └── ...
├── R&D Center (不可选)
│   ├── APA Product Division (不可选)
│   │   ├── Lihong Fan (可选)
│   │   └── ...
│   └── ...
└── ...
```

**技术要点**：
- 数据源：复用 `departmentTree`（树结构）+ 导出 `ALL_ORG_USERS`（用户列表，按 department 名称匹配挂载到对应部门节点下）
- 部门节点设 `disabled: true` 或 `selectable: false`，仅用户节点可选
- 支持搜索过滤（按用户名搜索）
- 下拉宽度自适应，默认展开所有节点
- Props：`value`（user ID）、`onChange`、`placeholder`、`disabled`、`style`
- 选中后显示用户名

### 数据准备

**修改文件**：`src/components/CollaboratorManager/mockData.ts`

将 `ALL_ORG_USERS` 改为 `export const`。

### 需要为部门树补充子部门

当前 `departmentTree` 缺少一些 `ALL_ORG_USERS` 中用户所属的子部门（如 Frontend Development Team、Backend Development Team、AI Platform Team 等）。需在 `departmentData.ts` 中补充这些子部门节点，使每个用户都能正确挂载。

**修改文件**：`src/mocks/departmentData.ts`

在 R&D Center → APA Product Division 下添加子部门，以及 Platform Engineering Division 下添加子部门等。

### 编辑弹窗替换（10 个文件）

将所有编辑弹窗中的 `<Form.Input disabled>` 归属者字段替换为 `<OwnerSelect>`：

| # | 文件 |
|---|------|
| 1 | EditQueueModal |
| 2 | EditCredentialModal |
| 3 | EditParameterModal |
| 4 | EditProcessModal（ProcessManagement） |
| 5 | EditProcessModal（ProcessDevelopment） |
| 6 | EditWorkerModal |
| 7 | EditWorkerGroupModal |
| 8 | EditTimeTriggerModal |
| 9 | EditQueueTriggerModal |
| 10 | EditTemplateModal |

每处模式：
```tsx
const [ownerId, setOwnerId] = useState<string | undefined>(xxx?.owner_id || undefined);

<Form.Slot label={t('common.owner')}>
  <OwnerSelect value={ownerId} onChange={setOwnerId} />
</Form.Slot>
```

### i18n

添加 `common.ownerPlaceholder`：`"请选择归属者"` / `"Select owner"`

### 修改文件汇总

| 类型 | 文件数 |
|------|--------|
| 新建 OwnerSelect 组件 | 1 |
| 导出 ALL_ORG_USERS | 1 |
| 补充部门树子节点 | 1 |
| 编辑弹窗替换 | 10 |
| i18n | 2 |

总计 **15 个文件**。

