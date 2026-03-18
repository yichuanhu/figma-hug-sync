import { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import './index.less';

// 这些路由下侧边栏强制收起且禁用hover浮动菜单
const noExpandRoutes = ['/requirements', '/operations', '/maintenance', '/personal-center'];

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const disableExpand = useMemo(
    () => noExpandRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/')),
    [location.pathname]
  );

  const effectiveCollapsed = disableExpand || collapsed;

  const isPersonalCenter = location.pathname.startsWith('/personal-center');
  const contentCardClass = `app-layout-content-card${isPersonalCenter ? ' vignette-center' : ''}`;

  return (
    <div className="app-layout">
      {/* 侧边栏 */}
      <div className={`app-layout-sidebar ${effectiveCollapsed ? 'collapsed' : 'expanded'}`}>
        <Sidebar
          collapsed={effectiveCollapsed}
          onToggleCollapse={disableExpand ? undefined : () => setCollapsed(!collapsed)}
          disableHover={disableExpand}
        />
      </div>

      {/* 内容区域 */}
      <div className="app-layout-content">
        <div className={contentCardClass}>
          <div className="app-layout-content-main">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
