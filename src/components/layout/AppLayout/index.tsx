import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import './index.less';

// 这些路由进入时完全隐藏侧边栏
const hideSidebarRoutes = ['/requirements', '/operations'];

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const sidebarHidden = useMemo(
    () => hideSidebarRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/')),
    [location.pathname]
  );

  return (
    <div className="app-layout">
      {/* 侧边栏 */}
      {!sidebarHidden && (
        <div className={`app-layout-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        </div>
      )}

      {/* 内容区域 */}
      <div className="app-layout-content">
        <div className="app-layout-content-card">
          <div className="app-layout-content-main">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
