

## 替换核心指标 SVG 图标

用户上传了 7 个新的 SVG 图标，需要替换 `src/assets/metrics/` 下的现有图标文件。

### 文件映射

| 上传文件 | 替换目标 |
|---------|---------|
| 机器人数量-2.svg | src/assets/metrics/robots.svg |
| 流程数量-2.svg | src/assets/metrics/processes.svg |
| 今日任务数-2.svg | src/assets/metrics/today-tasks.svg |
| 成功率-2.svg | src/assets/metrics/success-rate.svg |
| 本月节省工时-2.svg | src/assets/metrics/saved-hours.svg |
| 累计节约成本-2.svg | src/assets/metrics/saved-cost.svg |
| 本周新增流程-2.svg | src/assets/metrics/weekly-new.svg |

### 实施步骤

1. 将 7 个上传的 SVG 文件复制到 `src/assets/metrics/` 目录，覆盖现有文件
2. 无需修改 `MetricsSection/index.tsx`，因为组件已通过 `?raw` + `dangerouslySetInnerHTML` 渲染，文件名和导入路径保持不变

