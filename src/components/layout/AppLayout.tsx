import { useState, ReactNode } from 'react';
import { Layout, Button } from '@douyinfe/semi-ui';
import { IconMenu } from '@douyinfe/semi-icons';
import Sidebar from './Sidebar';

const { Sider, Content } = Layout;

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider 
        style={{ 
          backgroundColor: '#fff',
          borderRight: '1px solid var(--semi-color-border)',
          display: 'flex',
          flexDirection: 'column',
          width: collapsed ? 60 : 180,
          minWidth: collapsed ? 60 : 180,
        }}
      >
        {/* Logo 区域 */}
        <div style={{ 
          height: 56, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--semi-color-border)'
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
            style={{ marginLeft: collapsed ? 'auto' : 0, marginRight: collapsed ? 'auto' : 0 }}
          />
        </div>
        
        {/* 导航区域 */}
        <Sidebar collapsed={collapsed} />
      </Sider>
      
      <Content style={{ 
        backgroundColor: 'var(--semi-color-bg-0)', 
        overflow: 'auto',
        padding: 0
      }}>
        {children}
      </Content>
    </Layout>
  );
};

export default AppLayout;
