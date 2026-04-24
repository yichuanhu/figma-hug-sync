

# 通知中心需求对齐：删除与筛选（修订版）

## 一、调整说明

根据用户反馈，**保留"按严重性筛选"**，其余对齐策略不变。

## 二、最终对齐方案

| 项 | 处理 |
|---|---|
| 单条删除按钮（Trash2） | **移除**（需求未提供单条删除入口，避免误删未读） |
| 分类筛选 | 保留 |
| 严重性筛选 | **保留**（按用户要求） |
| 时间范围筛选 | **移除**（§3.5 范围外） |
| 关键字搜索 | 保留 |
| 全部已读（限定 filtered） | 保留 |
| 清除已读（二次确认） | 保留 |

## 三、修改方案

### 1. 移除单条删除入口

`NotificationTable/index.tsx`：删除 `Trash2` 按钮、`onDelete` prop。已读项保留小灰点占位，未读项保留"标记已读"按钮。

`NotificationTable/index.less`：移除 `.nc-list-item-delete-btn` 及关联 hover 样式。

`NotificationCenter/index.tsx`：移除 `handleDelete`，`<NotificationTable>` 不再传 `onDelete`。

i18n 清理（zh-CN + en）：移除 `notificationCenter.actions.delete`、`confirm.deleteTitle`、`confirm.deleteContent`、`toast.deleted`。

### 2. 收窄筛选范围（保留 categories + severities）

`NotificationFilterBar/index.tsx`：
- `sections` 保留 `categories` 与 `severities`，删除 `dateRange` 与 `datePresets` `useMemo`。
- `FilterValues` 收窄为 `{ readFilter; search; categories; severities; }`。
- `FilterPopover` 的 `onConfirm` 仅回写 `categories` 与 `severities`。

`NotificationCenter/index.tsx`：
- `initialFilters` 删除 `dateRange`。
- `filtered` useMemo 删除日期范围过滤分支，保留严重性过滤。
- `hasFilters` 去掉 `dateRange`。

i18n 清理：移除 `notificationCenter.filter.dateRange`、`today`、`last7`、`last30`（如未在他处复用）。`severity.high/medium/low` 与 `filter.severity` **保留**。

### 3. 类型与视觉

`SeverityTag` 通知行视觉徽章保留，与筛选条件呼应。

## 四、文件改动清单

- `src/pages/NotificationCenter/components/NotificationTable/index.tsx` — 移除删除按钮与 `onDelete`
- `src/pages/NotificationCenter/components/NotificationTable/index.less` — 移除删除按钮样式
- `src/pages/NotificationCenter/components/NotificationFilterBar/index.tsx` — 移除时间范围筛选
- `src/pages/NotificationCenter/index.tsx` — 移除 handleDelete、收窄 filters（去 dateRange）
- `public/i18n/zh-CN.json`、`public/i18n/en.json` — 清理 delete 与 dateRange 文案

## 五、不在范围内

通知偏好、产品来源筛选、`groupBy` 分组（§3.5 范围外）维持不实现。

