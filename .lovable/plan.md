

# 修复详情页时区显示为 IANA 值的问题

## 问题

在时间触发和队列触发的详情抽屉中，时区直接显示 `trigger.time_zone` 的原始 IANA 值（如 `Pacific/Honolulu`），而非用户友好的标签（如 `(UTC-10:00) Hawaii`）。

## 修复方案

在两个详情抽屉中，将 `{trigger.time_zone}` 替换为根据 IANA 值查找对应 label 的逻辑。

### 具体改动

1. **创建工具函数**（或直接内联）：从 `TIMEZONE_OPTIONS` 中查找匹配 `value` 的 `label`，找不到时 fallback 显示原值。

2. **TimeTriggerDetailDrawer/index.tsx**（第280行）：
   - 将 `{trigger.time_zone}` 改为 `{TIMEZONE_OPTIONS.find(tz => tz.value === trigger.time_zone)?.label || trigger.time_zone}`

3. **QueueTriggerDetailDrawer/index.tsx**（第227行）：
   - 同上处理

涉及文件仅 2 个，每个文件改动 1 行 + 1 行 import。

