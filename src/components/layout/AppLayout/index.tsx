import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import './index.less';

const getCenterAccentColor = (pathname: string): string | null => {
  if (pathname === '/process-development' || pathname.startsWith('/process-detail/') || pathname.startsWith('/dev-center/'))
    return '79, 190, 49';
  if (pathname.startsWith('/scheduling') || pathname.startsWith('/scheduling-center/'))
    return '79, 193, 206';
  if (pathname.startsWith('/operations'))
    return '202, 109, 255';
  if (pathname.startsWith('/requirements'))
    return '22, 93, 255';
  if (pathname.startsWith('/maintenance'))
    return '177, 160, 15';
  return null;
};

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const accentColor = getCenterAccentColor(location.pathname);

  return (
    <div className="app-layout">
      <div className={`app-layout-sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </div>

      <div className="app-layout-content">
        <div
          className="app-layout-content-card"
          style={accentColor ? { '--center-accent-color': accentColor } as React.CSSProperties : undefined}
        >
          <div className="app-layout-content-main">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
