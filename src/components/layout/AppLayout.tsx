import { useState, ReactNode } from 'react';
import { Button } from '@douyinfe/semi-ui';
import { IconMenu } from '@douyinfe/semi-icons';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 60 : 180;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* 侧边栏 */}
      <div 
        style={{ 
          width: sidebarWidth, 
          minWidth: sidebarWidth,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
          borderRight: '1px solid var(--semi-color-border)',
          transition: 'width 0.2s',
          flexShrink: 0,
        }}
      >
        {/* Logo 区域 */}
        <div style={{ 
          height: 56, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--semi-color-border)',
          flexShrink: 0,
        }}>
          {!collapsed && (
            <span style={{ 
              fontSize: 18, 
              fontWeight: 'bold',
              color: 'var(--semi-color-primary)'
            }}>
              LAIYE
            </span>
          )}
          <Button 
            icon={<IconMenu />} 
            theme="borderless"
            onClick={() => setCollapsed(!collapsed)}
            style={{ 
              marginLeft: collapsed ? 'auto' : 0, 
              marginRight: collapsed ? 'auto' : 0 
            }}
          />
        </div>
        
        {/* 导航区域 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Sidebar collapsed={collapsed} />
        </div>
      </div>
      
      {/* 内容区域 */}
      <div style={{ 
        flex: 1,
        overflow: 'auto',
        backgroundColor: 'var(--semi-color-bg-0)',
      }}>
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
