import { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useLicense } from '@/contexts/LicenseContext';
import NoLicensePage from '@/pages/NoLicense';
import DetailSkeleton from '@/components/DetailSkeleton';
import './index.less';

// 这些路由下侧边栏强制收起且禁用hover浮动菜单
const noExpandRoutes = ['/personal-center'];

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [detailPanelVisible, setDetailPanelVisible] = useState(true);
  const location = useLocation();
  const { status } = useLicense();

  const disableExpand = useMemo(
    () => noExpandRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/')),
    [location.pathname]
  );

  const effectiveCollapsed = disableExpand || collapsed;

  const isPersonalCenter = location.pathname.startsWith('/personal-center');
  const contentCardClass = `app-layout-content-card${isPersonalCenter ? ' vignette-center' : ''}`;

  const renderContent = () => {
    if (status === 'loading') return <DetailSkeleton />;
    if (status !== 'valid') return <NoLicensePage />;
    return <Outlet />;
  };

  return (
    <div className="app-layout">
      {/* 侧边栏 */}
      <div className={`app-layout-sidebar ${effectiveCollapsed ? 'collapsed' : 'expanded'} ${detailPanelVisible ? 'detail-visible' : ''}`}>
        <Sidebar
          collapsed={effectiveCollapsed}
          onToggleCollapse={disableExpand ? undefined : () => setCollapsed(!collapsed)}
          disableHover={disableExpand}
          detailPanelVisible={detailPanelVisible}
          onToggleDetailPanel={() => setDetailPanelVisible(!detailPanelVisible)}
        />
      </div>

      {/* 内容区域 */}
      <div className="app-layout-content">
        <div className={contentCardClass}>
          <div className="app-layout-content-main">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
