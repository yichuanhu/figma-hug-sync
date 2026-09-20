import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Avatar } from '@douyinfe/semi-ui';
import { Home, Users, Wallet, AlignLeft, MoreHorizontal } from 'lucide-react';
import { cloudUser } from '@/cloud/mock';
import '@/cloud/styles/cloud.less';

const NAV_ITEMS = [
  { path: '/cloud/home', label: '首页', icon: Home, title: '首页', desc: '欢迎回到你的智能工作空间' },
  { path: '/cloud/teams', label: '团队管理', icon: Users, title: '团队管理', desc: '管理成员以及个人、团队资产的使用主体' },
  { path: '/cloud/billing', label: '费用与资源', icon: Wallet, title: '费用与资源', desc: '查看积分、资源包、套餐与订阅' },
];

const CloudLayout = () => {
  const location = useLocation();
  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path)) || NAV_ITEMS[0];

  return (
    <div className="cloud-root">
      <aside className="cloud-sidebar">
        <div className="cloud-sidebar-brand">
          <div className="logo">
            <AlignLeft size={20} strokeWidth={2} />
          </div>
          <div>
            <div className="name">UCI Cloud</div>
            <div className="slogan">AI WORKSPACE</div>
          </div>
        </div>

        <div className="cloud-sidebar-group-title">工作空间</div>
        <nav className="cloud-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `cloud-sidebar-item${isActive ? ' active' : ''}`}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="cloud-sidebar-footer">
          <Avatar size="small" style={{ background: '#5b6cf9', flexShrink: 0 }}>
            {cloudUser.initials}
          </Avatar>
          <div className="info">
            <div className="info-name">{cloudUser.name}</div>
            <div className="info-desc">{cloudUser.workspaceName}</div>
          </div>
          <MoreHorizontal size={18} color="rgba(255,255,255,0.5)" />
        </div>
      </aside>

      <div className="cloud-main">
        <header className="cloud-header">
          <div className="cloud-header-title">{current.title}</div>
          <div className="cloud-header-desc">{current.desc}</div>
        </header>
        <div className="cloud-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CloudLayout;
