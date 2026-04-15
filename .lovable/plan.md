

## 问题分析

**根因**：Semi UI 的 Dropdown 组件已经提供了两个关键 props：
- `stopPropagation={true}` — 在**弹出层级别**阻止点击事件冒泡（防止触发表格行点击）
- `clickToHide={true}` — 点击弹出层内部时自动关闭菜单

当前代码中，每个 `Dropdown.Item` 的 `onClick` 还额外调用了 `e?.stopPropagation?.()` — 这是**冗余且有害的**。它阻止了事件在 Dropdown 内部的冒泡，导致 `clickToHide` 机制无法感知到点击，菜单不会自动关闭。

**修复方案**：移除所有 `Dropdown.Item` onClick 中的 `e?.stopPropagation?.()` 调用，保留 Dropdown 组件级别的 `stopPropagation` 和 `clickToHide` 即可。

## 修改范围

共 3 个文件，66 处 `e?.stopPropagation?.()` 需要移除：

1. **`src/pages/Scheduling/WorkerManagement/index.tsx`** — 流程机器人列表操作菜单（7 个菜单项）
2. **`src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/index.tsx`** — 机器人组列表操作菜单（5 个菜单项）
3. **`src/pages/Scheduling/WorkerManagement/WorkerGroupManagement/components/WorkerGroupDetailDrawer/index.tsx`** — 机器人组详情抽屉内成员操作菜单（2 个菜单项）

### 修改示例

```tsx
// 修改前
<Dropdown.Item onClick={(e) => {
  e?.stopPropagation?.();  // ← 这行导致 clickToHide 失效
  handleEdit(record);
}}>

// 修改后
<Dropdown.Item onClick={() => {
  handleEdit(record);
}}>
```

Dropdown 组件级别的配置保持不变：
```tsx
<Dropdown
  trigger="click"
  position="bottomRight"
  stopPropagation={true}   // 保留：阻止事件冒泡到表格行
  clickToHide={true}       // 保留：点击菜单项后自动关闭
  render={...}
>
```

