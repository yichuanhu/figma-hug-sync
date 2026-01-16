import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 56 : 240;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* 侧边栏 */}
      <div 
        style={{ 
          width: sidebarWidth, 
          minWidth: sidebarWidth,
          height: '100vh',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#F7F8FA',
          transition: 'width 0.2s',
          flexShrink: 0,
          position: 'relative',
          zIndex: 100,
        }}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </div>
      
      {/* 内容区域 */}
      <div style={{ 
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#F7F8FA',
      }}>
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
