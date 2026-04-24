

# 需求列表新增「所属项目」列

## 一、需求

在需求中心需求列表表格中新增一列「所属项目」，展示需求关联的项目名称。

## 二、修改方案

### 1. 表格列新增（`src/pages/Requirements/RequirementsWorkbench/index.tsx`）

在「所属部门（owning_department_name）」列之后插入新列：

```tsx
{
  title: t('requirements.fields.linkedProject', '所属项目'),
  dataIndex: 'linkedProject',
  key: 'linkedProject',
  width: 160,
  ellipsis: { showTitle: false },
  render: (_: unknown, record: RequirementItem) =>
    record.linkedProject ? (
      <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 140 }}>
        {record.linkedProject.name}
      </Text>
    ) : (
      <Text type="tertiary">-</Text>
    ),
}
```

字段已在 `RequirementItem.linkedProject` 中存在，mockData 已生成数据，无需额外接口与数据改动。

### 2. i18n 文案补充

- `public/i18n/zh-CN.json`：新增 `requirements.fields.linkedProject = "所属项目"`
- `public/i18n/en.json`：新增 `requirements.fields.linkedProject = "Project"`

（若键已存在则复用。）

## 三、文件改动清单

- `src/pages/Requirements/RequirementsWorkbench/index.tsx` — 在 columns 中新增「所属项目」列
- `public/i18n/zh-CN.json`、`public/i18n/en.json` — 新增 `requirements.fields.linkedProject`

## 四、不在范围

- 不修改看板视图（BoardView）
- 不修改抽屉中的项目展示
- 不修改 mock 数据与筛选逻辑（已在上一轮完成）

