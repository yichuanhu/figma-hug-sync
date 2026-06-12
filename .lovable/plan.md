# 统一把审批徽标放到「流程名称」列

## 改动

**`ProcessManagementContent/index.tsx`**

1. **流程名称列**：开发中心与调度中心都使用同一个 `render`，名称右侧追加 `ApprovalHintCell`
   ```
   <div flex gap=6 minWidth=0>
     <span ellipsis>{name}</span>
     {hint && <ApprovalHintCell ... />}
   </div>
   ```
   - 列宽统一调整为 240（开发中心从 160 提升，给徽标留位置）

2. **状态列**（仅开发中心）：移除内部的 `ApprovalHintCell`，恢复只渲染 `StatusDot`，宽度回到 100

3. 调度中心不新增独立列

## 不在范围
- 不动徽标视觉、Tooltip、点击行为、mock、其它列

## 验收
- 开发中心与调度中心，列表行的「流程名称」后都能看到鲜艳实心圆徽标
- 状态列回到紧凑模式（只剩状态点 + 文字），不再换行
- 点击徽标打开「审批进度」Tab
