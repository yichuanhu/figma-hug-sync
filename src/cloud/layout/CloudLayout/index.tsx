import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Wallet } from 'lucide-react';
import { Avatar, Popover } from '@douyinfe/semi-ui';
import { UserInfoDropdown } from '@/components/layout/UserInfoDropdown';
import laiyeLogo from '@/assets/laiye-logo.png';
import { cloudUser } from '@/cloud/mock';
import './index.less';

const NAV_ITEMS = [
  { path: '/cloud/home', label: '首页', icon: Home, title: '首页', desc: '欢迎回到你的智能工作空间' },
  { path: '/cloud/teams', label: '团队管理', icon: Users, title: '团队管理', desc: '管理成员以及个人、团队资产的使用主体' },
  { path: '/cloud/billing', label: '费用与资源', icon: Wallet, title: '费用与资源', desc: '查看积分、资源包、套餐与订阅' },
];

const CloudLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path)) || NAV_ITEMS[0];

  return (
    <div className="cloud-root">
      <aside className="cloud-sidebar">
        <div className="cloud-sidebar-brand">
          <img src={laiyeLogo} alt="Laiye" />
        </div>
        <nav className="cloud-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `cloud-sidebar-item${isActive ? ' active' : ''}`}>
                <Icon size={18} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="cloud-sidebar-footer">
          <Popover
            trigger="hover"
            position="rightBottom"
            showArrow={false}
            spacing={4}
            mouseLeaveDelay={300}
            mouseEnterDelay={0}
            content={
              <UserInfoDropdown
                name={cloudUser.name}
                username={cloudUser.email}
                companyName={cloudUser.workspaceName}
                actions={[
                  {
                    key: 'logout',
                    label: '退出登录',
                  },
                ]}
              />
            }
          >
            <Avatar size="small" className="cloud-user-avatar">
              {cloudUser.initials}
            </Avatar>
          </Popover>
        </div>
      </aside>

      <div className="cloud-main">
        <div className="cloud-surface">
          <header className="cloud-header">
            <div className="cloud-header-title">{current.title}</div>
            <div className="cloud-header-desc">{current.desc}</div>
          </header>
          <div className="cloud-content"><Outlet /></div>
        </div>
      </div>
    </div>
  );
};

export default CloudLayout;
