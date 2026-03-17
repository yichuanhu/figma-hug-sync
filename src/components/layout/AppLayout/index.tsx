import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import './index.less';

// 这些路由进入时默认收起侧边栏
const autoCollapseRoutes = ['/requirements', '/operations'];

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (autoCollapseRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'))) {
      setCollapsed(true);
    }
  }, [location.pathname]);

  return (
    <div className="app-layout">
      {/* 侧边栏 */}
      <div className={`app-layout-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </div>

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
