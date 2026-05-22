## 背景

根据变更清单 AIEM-CHANGES-FEAT-105-v1.0-20260522-2.md，STORY-005（成本管理）已撤销：全局成本管理仅作为 ROI 参考展示，ROI 撤销后无独立价值。需从运营中心移除该模块。

## 变更范围

### 1. 路由与入口移除
- `src/App.tsx`：移除 `CostManagement` 引入及 `/operations/cost-management` 路由（如该路由是运营中心默认子路由，调整重定向到保留模块，如 `/operations/business-outcomes`）
- `src/components/layout/Sidebar/index.tsx`：移除运营中心菜单中的成本管理项及对应 Lucide 图标引用、`pathname === '/operations/cost-management'` 高亮分支

### 2. 页面与组件删除
- 删除整个目录 `src/pages/Operations/CostManagement/`（含 `index.tsx` / `index.less` / `mockData.ts` 及子组件 `CostTabContent` / `CostFormModal`）

### 3. 国际化清理
- `public/i18n/zh-CN.json`：移除 `sidebar.costManagement`、整段 `operations.costManagement.*`
- `public/i18n/en.json`：同步移除对应键

### 4. 验证
- `rg "CostManagement|cost-management|costManagement|CostRecord|CostType"` 应无残留
- 侧边栏运营中心不再出现「成本管理」入口
- 业务成果看板、资源效能、平台运营等保留模块正常显示，无 i18n 缺失

## 说明

`CostManagement/mockData.ts` 中的 `CostRecord` / `CostType` / `useCostStore` 等仅服务于本模块，未被其他模块引用，可随目录整体删除。