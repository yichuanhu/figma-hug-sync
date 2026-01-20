import { useState, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '@douyinfe/semi-ui';
import Sidebar from '../Sidebar';
import { generateBreadcrumbs } from '@/router/utils';
import './index.less';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // 根据当前路由生成面包屑
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  return (
    <div className="app-layout">
      {/* 侧边栏 */}
      <div className={`app-layout sidebar-container ${collapsed ? 'collapsed' : 'expanded'}`}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </div>
      
      {/* 内容区域 */}
      <div className="app-layout content-area">
        <div className="content-card">
          {/* 面包屑导航 */}
          {breadcrumbs.length > 0 && (
            <div className="breadcrumb-container">
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
          <div className="page-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
