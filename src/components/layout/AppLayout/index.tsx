import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import RouteBreadcrumb from '../RouteBreadcrumb';
import { BreadcrumbProvider } from '@/router/BreadcrumbContext';
import './index.less';

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <BreadcrumbProvider>
      <div className="app-layout">
        {/* 侧边栏 */}
        <div className={`app-layout-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        </div>

        {/* 内容区域 */}
        <div className="app-layout-content">
          <div className="app-layout-content-card">
            <RouteBreadcrumb />
            <div className="app-layout-content-main">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </BreadcrumbProvider>
  );
};

export default AppLayout;
