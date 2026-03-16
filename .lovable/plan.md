

# 实施计划：3项改动

## 1. 布局调整：交换最近活动与平台公告位置

**文件**: `src/pages/Home/index.tsx`

将 `CenterEntrySection` 从左栏移到 `home-content` 上方（全宽），同时交换 `RecentActivitySection` 和 `AnnouncementSection` 的位置：

```tsx
<div className="home-page">
  <WelcomeSection />
  <CenterEntrySection />          {/* 全宽，在双栏上方 */}
  <div className="home-content">
    <div className="home-left-column">
      <ShortcutsSection />
      <MetricsSection />
      <AnnouncementSection />      {/* 从右栏移入 */}
    </div>
    <div className="home-right-column">
      <NotificationSection />
      <RecentActivitySection />    {/* 从左栏移入 */}
      <ResourceSection />
    </div>
  </div>
</div>
```

## 2. 中心快速入口：全宽布局 + 渐变背景

**文件**: `src/pages/Home/components/CenterEntrySection/index.tsx`

为每个中心入口添加 `gradient` 和 `hoverGradient` 字段，通过内联 style 渲染渐变背景，hover 时加深：

| 中心 | 渐变 |
|------|------|
| 需求 | `#E8F0FE → #D0E2FF`（蓝） |
| 开发 | `#E6F7ED → #C6EFCE`（绿） |
| 调度 | `#FFF3E0 → #FFE0B2`（橙） |
| 运营 | `#F3E8FD → #E1D5FA`（紫） |
| 运维 | `#FDE8E8 → #FCCFCF`（红） |

使用 `onMouseEnter`/`onMouseLeave` 切换 hover 渐变。

**文件**: `src/pages/Home/components/CenterEntrySection/index.less`

- 移除 `background-color: var(--semi-color-bg-0)`（改用内联渐变）
- 添加 `margin-bottom: 24px` 与下方双栏内容保持间距
- 保持 5 列网格布局和现有响应式断点

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `src/pages/Home/index.tsx` | CenterEntrySection 移到全宽，交换 Activity/Announcement |
| `src/pages/Home/components/CenterEntrySection/index.tsx` | 添加渐变背景数据和 hover 逻辑 |
| `src/pages/Home/components/CenterEntrySection/index.less` | 移除白色背景，添加底部间距 |

