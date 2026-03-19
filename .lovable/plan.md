

# 修复需求中心侧边栏菜单不显示的问题

## 问题原因

在 `src/components/layout/AppLayout/index.tsx` 中，`noExpandRoutes` 包含了 `/requirements`：

```ts
const noExpandRoutes = ['/requirements', '/operations', '/maintenance', '/personal-center'];
```

这会导致进入需求中心时侧边栏**强制收起且禁用 hover 浮动菜单**，需求中心的二级菜单（需求列表、需求评审、团队成员）完全无法展示。

但需求中心现在已经有了二级菜单结构（`requirementsCenterMenu`），需要像开发中心、调度中心一样展开显示。

## 修复方案

**文件**: `src/components/layout/AppLayout/index.tsx`

将 `/requirements` 从 `noExpandRoutes` 中移除：

```ts
const noExpandRoutes = ['/operations', '/maintenance', '/personal-center'];
```

这样需求中心就会像开发中心和调度中心一样，点击图标时自动展开侧边栏并显示二级菜单。

