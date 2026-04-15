

## 优化分页组件 — 对齐数据服务项目样式

### 参考项目的分页样式

数据服务项目使用独立的分页栏，位于表格下方：

```text
┌──────────────────────────────────────────────┐
│  Table (flex: 1, overflow: auto)             │
│  ┌──────────────────────────────────────────┐ │
│  │ 表头                                     │ │
│  │ 数据行...                                │ │
│  └──────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────┐ │
│  │ 显示 1-10 条，共 50 条    共 5 页 [分页] │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

关键特征：
- `pagination={false}`，Table 不使用内置分页
- 分页栏：左侧显示"显示 X-Y 条，共 Z 条"，右侧显示"共 N 页" + `Pagination` 组件
- 分页栏有 `border-top` 分隔线、`sticky bottom` 定位
- 表格区域 `flex: 1; overflow: auto`，分页栏 `flex-shrink: 0`

### 改动范围

**新建共享样式类**（避免各页面重复定义）：
在全局或共享 less 文件中添加 `.list-pagination` 样式，对齐数据服务的 `.data-tab-pagination` 样式。

**修改 10 个列表页面**，统一采用独立 Pagination 模式：

| 文件 | 改动 |
|------|------|
| `ProcessManagementContent/index.tsx` | 移除内置 pagination，添加独立分页栏 |
| `QueueManagementContent/index.tsx` | 同上 |
| `FileManagementContent/index.tsx` | 同上 |
| `ParameterManagementContent/index.tsx` | 同上 |
| `CredentialManagementContent/index.tsx` | 同上 |
| `WorkerManagement/index.tsx` | 同上 |
| `WorkerGroupManagement/index.tsx` | 同上 |
| `TaskManagementPage/index.tsx` | 同上 |
| `TimeTriggerList/index.tsx` | 同上 |
| `QueueTriggerList/index.tsx` | 同上 |

### 每个文件的具体改动

1. 添加 `Pagination` 到 import
2. 表格容器改为 `flex: 1; overflow: auto; min-height: 0`
3. Table 设置 `pagination={false}`，移除 `scroll={{ y: ... }}`
4. 在 Table 下方添加分页栏：

```tsx
<div className="list-pagination">
  <Text type="tertiary">
    {t('common.showingRecords', { from, to, total })}
  </Text>
  <div className="list-pagination-right">
    <Text type="tertiary">{t('common.totalPages', { total: totalPages })}</Text>
    <Pagination
      currentPage={currentPage}
      pageSize={pageSize}
      total={total}
      showSizeChanger
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  </div>
</div>
```

### 新增国际化词条

```json
{
  "common.showingRecords": "显示 {{from}}-{{to}} 条，共 {{total}} 条",
  "common.totalPages": "共 {{total}} 页"
}
```

### 共享分页样式

```less
.list-pagination {
  position: sticky;
  bottom: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--semi-color-border);
  background-color: var(--semi-color-default);
  z-index: 1;

  &-right {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: auto;
    white-space: nowrap;
  }

  .semi-pagination {
    margin: 0;
  }
}
```

### 不受影响的部分

- 空状态逻辑（EmptyState variant 判断）保持不变
- 表头始终可见的逻辑保持不变
- 筛选栏和搜索框不变

