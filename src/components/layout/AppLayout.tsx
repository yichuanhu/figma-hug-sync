import { useState, ReactNode } from 'react';
import { Button } from '@douyinfe/semi-ui';
import Sidebar from './Sidebar';
import laiyeLogo from '@/assets/laiye-logo.png';
import layoutIcon from '@/assets/icons/layout.svg';

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
          flexDirection: 'column',
          backgroundColor: '#F7F8FA',
          transition: 'width 0.2s',
          flexShrink: 0,
          position: 'relative',
          zIndex: 100,
        }}
      >
        {/* 顶部区域：Logo + 中心标题 */}
        <div style={{ 
          height: 56, 
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          {/* 左侧 Logo 区域 - 固定56px宽度 */}
          <div style={{
            width: 56,
            minWidth: 56,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img 
              src={laiyeLogo} 
              alt="Laiye" 
              style={{ height: 16, width: 'auto', margin: '0 12px' }}
            />
          </div>
          
          {/* 右侧空白区域 - 仅展开时显示，为卡片式菜单提供背景 */}
          {!collapsed && (
            <div style={{
              flex: 1,
              height: '100%',
            }} />
          )}
        </div>
        
        {/* 导航区域 */}
        <div style={{ flex: 1, overflow: 'visible' }}>
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        </div>
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
