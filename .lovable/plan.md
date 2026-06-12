# 审批徽标改为线性裸图标（无背景）

## 问题
当前实心彩色圆徽标（#3B82F6 / #F59E0B / #8B5CF6 / #EF4444 实心底 + 白色图标）与项目整体 Semi UI / Feishu 素雅风格不搭，过于鲜艳突兀。

## 方案

把 `ApprovalHintCell` 改为**无背景线性 Lucide 图标**，与项目其余微型操作图标（stroke 2，~14px，语义色系）保持一致。

### 具体改动

**`ApprovalHintCell/index.tsx`**

- 移除圆形背景、阴影、hover 放大动效
- 仅渲染纯图标，size 14，strokeWidth 2，颜色用 Semi 语义色：

| 场景 | 颜色 | Lucide 图标 |
|---|---|---|
| 发布审批中 `publish` | `var(--semi-color-primary)` 蓝 | `Send` |
| 下线审批中 `PENDING_APPROVAL` | `var(--semi-color-warning)` 琥珀 | `ShieldAlert` |
| 下线执行中 `APPROVED` | `var(--semi-color-success)` 绿 | `PlayCircle` |
| 下线失败 其它 | `var(--semi-color-danger)` 红 | `OctagonAlert` |

- 保留外层 Tooltip、点击打开「审批进度」Tab

### 不在范围
- Tooltip 文案、列位置、列宽、mock 数据 均不变

## 验收
- 列表中「流程名称」后的徽标变成素雅线性图标，无背景
- 颜色为 Semi 语义色系（蓝/琥珀/绿/红），与系统其它图标风格一致
- hover 无放大，仅通过 cursor 和 Tooltip 暗示可点击
