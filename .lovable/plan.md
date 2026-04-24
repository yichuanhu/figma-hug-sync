

# 通知中心需求对齐与缺失功能补全计划

## 一、需求对照分析

对照 `STORY-003-NOTIFICATION-SERVICE-CENTER` 验收标准，当前实现存在以下问题：

| 需求条目 | 当前实现 | 状态 |
|---|---|---|
| 全部/未读 Tab（仅两个） | 多了一个"已读" Tab | 偏差 |
| 全部已读对**当前筛选结果**生效 | 对全部 `list` 生效 | Bug |
| 清除已读（含二次确认弹窗） | 缺失 | **未实现** |
| 已读通知再次点击应幂等无副作用 | 仍会调用 `markRead` | Bug |
| 列表 LESS 样式 | 嵌套错位导致构建失败 | **构建错误** |
| 单条已读、单条删除、跳转前置已读、空状态、未读数 Badge、分类/严重性/时间筛选、搜索、分页 | 已实现 | OK |

## 二、修复与优化方案

### 1. 修复构建错误（NotificationTable/index.less）

`&-dot`、`&-read-btn`、以及 `&-item:hover &-item-delete-btn` 选择器目前被错误地嵌套在了 `.nc-list > &-item` 块**之外又之内**，缩进与花括号配对错乱。重构为：

```text
.nc-list {
  &-empty { ... }
  &-item {
    ...
    &-delete-btn { ... }
    &-dot { ... }
    &-read-btn {
      &-dot { ... }
      &-icon { ... }
      &:hover { ... }
    }
    &:hover .nc-list-item-delete-btn { opacity: 1; }
  }
}
```

### 2. 移除多余的"已读" Tab

`NotificationFilterBar`：删除 `read` TabPane，保留 `all` / `unread`。
`types.ts`：`NotificationReadFilter` 收窄为 `'all' | 'unread'`。
`index.tsx` 过滤逻辑去掉 `read === 'read'` 分支；`hasFilters` 判断也同步调整。

### 3. 修正"全部已读"作用域

`handleMarkAllRead` 改为仅作用于 `filtered` 中未读项：

```ts
const ids = new Set(filtered.filter(n => !n.read).map(n => n.id));
setList(prev => prev.map(n => ids.has(n.id) ? { ...n, read: true } : n));
```

按钮 disabled 条件也从 `stats.unread > 0` 改为"当前筛选结果存在未读"。

### 4. 新增"清除已读"功能

- `NotificationFilterBar` 在"全部已读"按钮旁新增次按钮 **清除已读**（Lucide `Eraser` 图标，`type="tertiary"`），无已读时禁用。
- `index.tsx` 新增 `handleClearRead`：使用 `Modal.confirm`，标题"清除已读通知"，正文"将删除当前筛选结果中的所有已读通知，未读通知不会被删除，删除后不可恢复。"，确认按钮 `type="danger"`。仅删除 `filtered` 中 `read === true` 的通知。成功后 `Toast.success`。
- 新增 i18n 键：`notificationCenter.actions.clearRead`、`confirm.clearReadTitle`、`confirm.clearReadContent`、`toast.cleared`（中英）。

### 5. 跳转/已读幂等性

`handleOpen`：仅当 `!n.read` 时调用 `handleMarkRead`，避免对已读项重复 `setState`：

```ts
const handleOpen = (n) => {
  openNotification(n, navigate, n.read ? () => {} : handleMarkRead);
};
```

### 6. 侧边栏未读数徽标（验收 §6.2）

确认侧边栏底部"通知"入口已显示 Badge；若未显示则在 `Sidebar` 通知项上挂未读数（来源同 `mockNotifications`，后续接 API）。本步骤在实现阶段先快速核查现有侧边栏，缺失再补，避免改动过多。

## 三、文件改动清单

- `src/pages/NotificationCenter/components/NotificationTable/index.less` —— 修复嵌套与构建错误。
- `src/pages/NotificationCenter/components/NotificationFilterBar/index.tsx` —— 移除"已读" Tab，新增"清除已读"按钮。
- `src/pages/NotificationCenter/types.ts` —— 收窄 `NotificationReadFilter`。
- `src/pages/NotificationCenter/index.tsx` —— `handleMarkAllRead` 限定 filtered、新增 `handleClearRead`、`handleOpen` 幂等化。
- `public/i18n/zh-CN.json` & `public/i18n/en.json` —— 新增"清除已读"相关文案。
- （条件性）侧边栏通知入口 Badge 校验/补全。

## 四、不在范围内（与需求 §3.5 一致）

- 通知偏好配置、`groupBy` 分组、产品来源筛选、高级组合筛选 —— 不实现。

