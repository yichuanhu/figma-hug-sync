

# 运维中心配置管理菜单简化计划

## 一、问题

侧边栏"配置管理"分组下有 5 个子菜单（系统参数 / 服务参数 / 基础设施 / 监控配置 / 日志配置），与页面内的 5 个 Tab 完全一一对应，造成**菜单与内容 Tab 重叠**的双层导航，体验冗余。

## 二、目标

- 侧边栏"配置管理"只保留**一个入口**：「配置管理」。
- 页面内继续以 Tab 方式切换 5 个配置子模块。
- 数据大盘分组保持不变。

## 三、修改方案

### 1. 侧边栏菜单（`src/components/layout/Sidebar/index.tsx`）

将 L312–L317 的 6 条（1 个分组标题 + 5 个子项）合并为单个菜单项：

```ts
{ key: 'mtConfigManagement', labelKey: 'sidebar.mtConfigManagement',
  icon: <Settings size={18} strokeWidth={2} />, path: '/maintenance/config' },
```

> 不再作为 `isGroupLabel`，而是直接作为可点击的导航项。"数据大盘"分组及其下两项保持原样。

L433–L437 的路由匹配收敛为：

```ts
if (pathname.startsWith('/maintenance/config')) return 'mtConfigManagement';
```

### 2. 路由（`src/App.tsx`）

- 新增统一入口：`<Route path="/maintenance/config" element={<MaintenanceConfig />} />`
- 保留现有 5 条子路径以兼容旧链接（仍渲染同一个 `MaintenanceConfig`）。
- L159 的兜底重定向改为 `/maintenance/config`。

### 3. 配置管理页面（`src/pages/Maintenance/ConfigManagement/index.tsx`）

Tab 不再驱动路由切换，改为本地 `useState` 控制：

- 移除 `TAB_ROUTES` / `PATH_TO_TAB` / `useNavigate` / `useLocation`。
- `const [activeKey, setActiveKey] = useState('system');`
- `<Tabs activeKey={activeKey} onChange={setActiveKey} ... />`
- 兼容旧链接：若 `location.pathname` 命中旧的 `/maintenance/config/<sub>`，初始化时根据 path 选中对应 Tab（一次性 `useEffect`），但不再随 Tab 切换 push 路由。

### 4. i18n

`sidebar.mtConfigManagement` 文案已存在（"配置管理"），保留即可；本次不新增 key。可在后续清理中移除不再使用的 `mtSystemParams / mtServiceParams / mtInfrastructure / mtMonitoringConfig / mtLoggerConfig` 五个 sidebar key（页面 Tab 标题仍由 `maintenance.config.*.title` 提供，不受影响）。

## 四、文件改动清单

- `src/components/layout/Sidebar/index.tsx` — 合并 5 项为 1 项；简化路径匹配
- `src/App.tsx` — 新增 `/maintenance/config` 路由，调整兜底跳转
- `src/pages/Maintenance/ConfigManagement/index.tsx` — Tab 改本地 state，去除路由驱动
- `public/i18n/zh-CN.json`、`public/i18n/en.json` — 移除 5 个不再使用的侧边栏 key（可选清理）

## 五、不在范围

- 不修改 5 个 Tab 内部组件（SystemParamsTab 等）
- 不调整"数据大盘"分组
- 不改动保存/高级模式等现有交互

