import { Nav, Badge, Avatar } from '@douyinfe/semi-ui';
import { IconBell, IconBookStroked, IconDownload } from '@douyinfe/semi-icons';

interface FooterNavProps {
  collapsed: boolean;
}

const FooterNav = ({ collapsed }: FooterNavProps) => {
  return (
    <Nav
      style={{ maxWidth: collapsed ? 60 : 180 }}
      isCollapsed={collapsed}
      items={[
        { 
          itemKey: '消息中心', 
          text: '消息中心', 
          icon: (
            <Badge count={999} overflowCount={99} type="danger">
              <IconBell />
            </Badge>
          ),
        },
        { itemKey: '用户指南', text: '用户指南', icon: <IconBookStroked /> },
        { itemKey: '资源下载', text: '资源下载', icon: <IconDownload /> },
      ]}
      footer={{
        children: (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '12px 16px',
            gap: 8,
            cursor: 'pointer'
          }}>
            <Avatar size="small" color="blue">L</Avatar>
            {!collapsed && <span style={{ fontSize: 14 }}>LingHui</span>}
          </div>
        ),
      }}
    />
  );
};

export default FooterNav;
