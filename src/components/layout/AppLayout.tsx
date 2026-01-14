import { useState, ReactNode } from 'react';
import { Layout, Button } from '@douyinfe/semi-ui';
import { IconMenu } from '@douyinfe/semi-icons';
import Sidebar from './Sidebar';
import FooterNav from './FooterNav';

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
          borderRight: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Logo 区域 */}
        <div style={{ 
          height: 60, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid #e8e8e8'
        }}>
          {!collapsed && (
            <span style={{ 
              fontSize: 20, 
              fontWeight: 'bold',
              color: '#1890ff'
            }}>
              LAIYE
            </span>
          )}
          <Button 
            icon={<IconMenu />} 
            theme="borderless"
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
        
        {/* 主导航 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Sidebar collapsed={collapsed} />
        </div>
        
        {/* 底部导航 */}
        <div style={{ borderTop: '1px solid #e8e8e8' }}>
          <FooterNav collapsed={collapsed} />
        </div>
      </Sider>
      
      <Content style={{ 
        backgroundColor: '#f5f5f5', 
        overflow: 'auto',
        padding: 0
      }}>
        {children}
      </Content>
    </Layout>
  );
};

export default AppLayout;
