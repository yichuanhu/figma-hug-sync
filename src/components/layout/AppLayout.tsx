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
          backgroundColor: '#fff',
          borderRight: '1px solid var(--semi-color-border)',
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
            borderRight: collapsed ? 'none' : '1px solid var(--semi-color-border)',
          }}>
            <img 
              src={laiyeLogo} 
              alt="Laiye" 
              style={{ height: 20, width: 'auto' }}
            />
          </div>
          
          {/* 右侧中心标题和收起按钮 - 仅展开时显示 */}
          {!collapsed && (
            <div style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px 0 16px',
            }}>
              <span style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: 'var(--semi-color-text-0)' 
              }}>
                开发中心
              </span>
              <Button 
                icon={<img src={layoutIcon} alt="toggle" style={{ width: 18, height: 18, flexShrink: 0 }} />} 
                theme="borderless"
                onClick={() => setCollapsed(!collapsed)}
                style={{ 
                  minWidth: 32,
                  padding: 7,
                }}
              />
            </div>
          )}
        </div>
        
        {/* 导航区域 */}
        <div style={{ flex: 1, overflow: 'visible' }}>
          <Sidebar collapsed={collapsed} />
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
