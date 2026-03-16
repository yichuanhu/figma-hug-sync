import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';
import './index.less';

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

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
