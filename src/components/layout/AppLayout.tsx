import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import './AppLayout.less';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
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
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
