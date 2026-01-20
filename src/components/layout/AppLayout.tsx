import { useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '@douyinfe/semi-ui';
import Sidebar from './Sidebar';
import { generateBreadcrumbs } from '@/router/utils';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarWidth = collapsed ? 60 : 'auto';
  
  // 根据当前路由生成面包屑
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* 侧边栏 */}
      <div 
        style={{ 
          width: sidebarWidth, 
          minWidth: collapsed ? 60 : 'auto',
          height: '100vh',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: 'var(--semi-color-default)',
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
        overflow: 'hidden',
        backgroundColor: 'var(--semi-color-default)',
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          backgroundColor: 'var(--semi-color-bg-0)',
          borderRadius: 8,
          boxShadow: '0 0 1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.04)',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* 面包屑导航 */}
          {breadcrumbs.length > 0 && (
            <div style={{ padding: '12px 24px', flexShrink: 0 }}>
              <Breadcrumb>
                {breadcrumbs.map((item, index) => (
                  <Breadcrumb.Item
                    key={index}
                    onClick={item.path ? () => navigate(item.path!) : undefined}
                  >
                    {item.title}
                  </Breadcrumb.Item>
                ))}
              </Breadcrumb>
            </div>
          )}
          
          {/* 页面内容 */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
