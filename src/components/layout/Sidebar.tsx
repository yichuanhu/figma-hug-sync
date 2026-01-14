import { Nav, Badge, Avatar } from '@douyinfe/semi-ui';
import { 
  IconHome, 
  IconList, 
  IconCode, 
  IconSetting, 
  IconServer, 
  IconBell, 
  IconBookStroked, 
  IconCloud,
  IconChevronRight
} from '@douyinfe/semi-icons';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar = ({ collapsed }: SidebarProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 主导航 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Nav
          style={{ height: 'auto' }}
          defaultSelectedKeys={['流程开发']}
          defaultOpenKeys={['开发中心']}
          isCollapsed={collapsed}
          items={[
            { itemKey: '首页', text: '首页', icon: <IconHome /> },
            { 
              itemKey: '需求中心', 
              text: '需求中心', 
              icon: <IconList />,
            },
            { 
              itemKey: '开发中心', 
              text: '开发中心', 
              icon: <IconCode />,
              items: [
                { itemKey: '流程开发', text: '流程开发' },
                { itemKey: '组件开发', text: '组件开发' },
                { itemKey: '测试与质量', text: '测试与质量' },
                { itemKey: '开发效能', text: '开发效能' },
              ]
            },
            { 
              itemKey: '调度中心', 
              text: '调度中心', 
              icon: <IconSetting />,
            },
            { 
              itemKey: '运营中心', 
              text: '运营中心', 
              icon: <IconServer />,
            },
            { 
              itemKey: '运维中心', 
              text: '运维中心', 
              icon: <IconCloud />,
            },
          ]}
          footer={{
            collapseButton: false,
          }}
        />
      </div>

      {/* 底部导航 */}
      <div style={{ borderTop: '1px solid var(--semi-color-border)' }}>
        <Nav
          style={{ height: 'auto' }}
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
            { itemKey: '资源下载', text: '资源下载', icon: <IconCloud /> },
          ]}
          footer={{
            collapseButton: false,
          }}
        />
        
        {/* 用户信息 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '12px 24px',
          gap: 12,
          cursor: 'pointer',
          borderTop: '1px solid var(--semi-color-border)'
        }}>
          <Avatar size="small" color="blue">L</Avatar>
          {!collapsed && (
            <>
              <span style={{ fontSize: 14, flex: 1 }}>LingHui</span>
              <IconChevronRight style={{ color: 'var(--semi-color-text-2)' }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
