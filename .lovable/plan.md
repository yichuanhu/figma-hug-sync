

## 修复自动执行策略分页组件不显示

### 根本原因

对比 ProcessManagement（正常显示）和 TimeTriggerList/QueueTriggerList（不显示）的结构差异：

```text
ProcessManagement（正常）：
  .process-management-table (flex:1; overflow:auto; min-height:0)
    ├── <Table pagination={false} />
    └── .list-pagination  ← 在滚动容器内部，sticky 生效

TimeTriggerList（异常）：
  .time-trigger-list-table (flex:1; overflow:auto; 无 min-height:0)
    └── <Table pagination={false} />
  .list-pagination  ← 在滚动容器外部，被 overflow:hidden 裁剪
```

两个问题叠加：
1. `.list-pagination` 放在了 `.time-trigger-list-table` **外部**，不在滚动容器内
2. `.time-trigger-list-table` 缺少 `min-height: 0`，无法收缩

### 修复方案

将 TimeTriggerList 和 QueueTriggerList 的结构对齐 ProcessManagement 模式：

**TSX 改动（2 个文件）**：将 `{total > 0 && (<div className="list-pagination">...)}` 移入 `.time-trigger-list-table` / `.queue-trigger-list-table` 的 `</div>` 之前。

**Less 改动（2 个文件）**：为 `.time-trigger-list-table` 和 `.queue-trigger-list-table` 添加 `min-height: 0`。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `TimeTriggerList/index.tsx` | 将 `.list-pagination` 移入 `.time-trigger-list-table` 内 |
| `TimeTriggerList/index.less` | 添加 `min-height: 0` |
| `QueueTriggerList/index.tsx` | 将 `.list-pagination` 移入 `.queue-trigger-list-table` 内 |
| `QueueTriggerList/index.less` | 添加 `min-height: 0` |

