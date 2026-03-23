

# 运营中心图表配色优化：浅色灰度柔和风格

## 问题

当前图表使用 Semi Design 标准 Level 5 亮色（`#165DFF`、`#00B42A`、`#FF7D00`、`#F53F3F`），色彩过于饱和鲜艳，与首页柔和灰度的视觉风格不统一。

## 优化方案

参考首页使用 `var(--semi-color-text-2)` 等低饱和度色调的风格，将图表颜色替换为 **Semi Design Level 3-4 浅灰调** 色值：

### 新旧色值对比

| 用途 | 当前（高饱和亮色） | 优化后（浅灰柔和色） |
|------|---------------------|----------------------|
| Primary/蓝 | `#165DFF` | `#94BFFF`（Blue-3） |
| Success/绿 | `#00B42A` | `#7BE188`（Green-3） |
| Warning/橙 | `#FF7D00` | `#FFCF8B`（Orange-3） |
| Danger/红 | `#F53F3F` | `#F98D8D`（Red-3） |
| Purple/紫 | `#722ED1` | `#B59ADB`（Purple-3） |
| Teal/青 | `#0FC6C2` | `#7BE7E3`（Cyan-3） |

Pie/散点等多色系列同步使用以上浅色。文字颜色（数值标注、条件着色）保持 Level 5-6 中等深度以确保可读性。渐变区域填充透明度进一步降低。

## 改动范围（7个文件）

1. **Dashboard**：`RoiTrendChart/index.tsx`、`DepartmentRoiRanking/index.tsx`
2. **ROI Analysis**：`RequirementRoiSection/index.tsx`、`DepartmentRoiSection/index.tsx`、`ProjectRoiSection/index.tsx`
3. **Resource Efficiency**：`RobotPerformance/index.tsx`、`TaskExecutionSection/index.tsx`

每个文件仅修改 `COLORS` 常量和 ECharts 配置中的内联颜色值，无结构变更。

