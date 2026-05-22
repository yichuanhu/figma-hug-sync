## 背景

根据变更记录 AIEM-CHANGES-FEAT-105-v1.0-20260522.md，STORY-002（ROI 深度分析）已被撤销，原因是 `time_saved_minutes` 数据链路三层断裂，且与业务成果看板存在指标冗余。需要从运营中心移除该模块。

## 变更范围

### 1. 路由与入口移除
- `src/App.tsx`：移除 `ROIAnalysis` 引入及 `/operations/roi-analysis` 路由
- `src/components/layout/Sidebar/index.tsx`：移除运营中心菜单中的 `roiAnalysis` 项与 `TrendingUp` 图标引用，移除 `pathname === '/operations/roi-analysis'` 的高亮判断分支

### 2. 页面与组件删除
- 删除整个目录 `src/pages/Operations/ROIAnalysis/`（含 4 个子组件 OverallRoiCards / RequirementRoiSection / DepartmentRoiSection / ProjectRoiSection）

### 3. 残留依赖处理
- `src/pages/Operations/ResourceEfficiency/index.tsx`：`Toast.success(t('operations.roiAnalysis.refreshed'))` 改为引用资源效能自有的刷新文案（如 `common.refreshSuccess` 或现有 key）
- `src/pages/Operations/ResourceEfficiency/components/ResourceFilterBar/index.tsx`：`t('operations.roiAnalysis.timeDimension')` 改为通用 key（如 `common.timeDimension`），在 i18n 中补充对应文案
- `src/pages/Operations/mockData.ts` / `types.ts`：核查并删除仅服务于 ROIAnalysis 的 `getRoiAnalysis`、`RoiMetrics`、`RoiAnalysisFilter`、`RequirementRoiDetail`、`DepartmentRoiDetail`、`ProjectRoiDetail` 等类型与 mock 函数（仅在不被其他模块使用时移除）

### 4. 国际化清理
- `public/i18n/zh-CN.json`：
  - 移除 `sidebar.roiAnalysis`
  - 移除整段 `operations.roiAnalysis.*` 翻译
  - 补充上一步迁移所需的通用 key（如 timeDimension / refreshSuccess）
- `public/i18n/en-US.json`（若存在对应键）同步处理

## 验证
- 检查 `rg -n "roiAnalysis|ROIAnalysis|roi-analysis"` 应仅剩 i18n 清理后无残留
- 侧边栏运营中心菜单不再出现「ROI深度分析」项
- 资源效能、业务成果看板等保留模块正常显示，无 i18n 缺失提示
