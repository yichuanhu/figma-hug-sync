

## 时区选择现状分析

项目中有两处时区列表定义，内容不一致且都不完整：

### 1. `src/components/TriggerRuleConfig/index.tsx`（时间触发器使用）— 9 个时区
Asia/Shanghai, Asia/Tokyo, Asia/Hong_Kong, Asia/Singapore, UTC, Europe/London, Europe/Paris, America/New_York, America/Los_Angeles

### 2. `src/pages/.../CreateQueueTriggerModal/index.tsx` 和 `EditQueueTriggerModal/index.tsx`（队列触发器使用）— 仅 4 个时区
Asia/Shanghai, Asia/Tokyo, America/New_York, Europe/London

### 国际标准时区列表应包含但当前缺失的时区（按区域）

| 区域 | 缺失的常用时区 |
|------|---------------|
| 亚洲 | Asia/Seoul, Asia/Kolkata, Asia/Dubai, Asia/Bangkok, Asia/Jakarta, Asia/Taipei, Asia/Karachi |
| 欧洲 | Europe/Berlin, Europe/Moscow, Europe/Istanbul, Europe/Amsterdam, Europe/Madrid, Europe/Rome |
| 美洲 | America/Chicago, America/Denver, America/Sao_Paulo, America/Toronto, America/Mexico_City, America/Vancouver, America/Anchorage |
| 太平洋 | Pacific/Auckland, Pacific/Honolulu, Pacific/Fiji |
| 大洋洲 | Australia/Sydney, Australia/Melbourne, Australia/Perth |
| 非洲 | Africa/Cairo, Africa/Johannesburg, Africa/Lagos |

### 实施计划

1. **创建统一时区常量文件** `src/constants/timezones.ts`
   - 包含约 40-50 个国际常用 IANA 时区，按 UTC 偏移排序
   - 格式：`{ value: 'Asia/Shanghai', label: '(UTC+08:00) Asia/Shanghai' }`
   - 导出为 `TIMEZONE_OPTIONS` 常量

2. **替换三处引用**
   - `src/components/TriggerRuleConfig/index.tsx` — 删除内联 `timeZones`，改用 `TIMEZONE_OPTIONS`
   - `src/pages/.../CreateQueueTriggerModal/index.tsx` — 删除内联 `timeZoneOptions`，改用 `TIMEZONE_OPTIONS`
   - `src/pages/.../EditQueueTriggerModal/index.tsx` — 同上

