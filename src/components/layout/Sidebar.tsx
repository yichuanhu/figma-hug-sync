import { useState } from 'react';
import { Badge, Avatar } from '@douyinfe/semi-ui';
import { 
  IconHome, 
  IconList, 
  IconCode, 
  IconSetting, 
  IconServer, 
  IconBell, 
  IconBookStroked, 
  IconCloud,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp
} from '@douyinfe/semi-icons';

interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  badge?: number;
}

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar = ({ collapsed }: SidebarProps) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['开发中心']);
  const [selectedKey, setSelectedKey] = useState('流程开发');

  const mainMenuItems: MenuItem[] = [
    { key: '首页', label: '首页', icon: <IconHome /> },
    { key: '需求中心', label: '需求中心', icon: <IconList /> },
    { 
      key: '开发中心', 
      label: '开发中心', 
      icon: <IconCode />,
      children: [
        { key: '流程开发', label: '流程开发' },
        { key: '组件开发', label: '组件开发' },
        { key: '测试与质量', label: '测试与质量' },
        { key: '开发效能', label: '开发效能' },
      ]
    },
    { key: '调度中心', label: '调度中心', icon: <IconSetting /> },
    { key: '运营中心', label: '运营中心', icon: <IconServer /> },
    { key: '运维中心', label: '运维中心', icon: <IconCloud /> },
  ];

  const bottomMenuItems: MenuItem[] = [
    { key: '消息中心', label: '消息中心', icon: <IconBell />, badge: 999 },
    { key: '用户指南', label: '用户指南', icon: <IconBookStroked /> },
    { key: '资源下载', label: '资源下载', icon: <IconCloud /> },
  ];

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleSelect = (key: string) => {
    setSelectedKey(key);
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const isSelected = selectedKey === item.key;
    const hasSelectedChild = item.children?.some(child => selectedKey === child.key);

    return (
      <div key={item.key}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
            padding: isChild ? '10px 16px 10px 44px' : (collapsed ? '12px 0' : '12px 16px'),
            backgroundColor: isSelected ? 'rgba(0, 119, 250, 0.08)' : 'transparent',
            color: isSelected || hasSelectedChild ? 'var(--semi-color-primary)' : 'var(--semi-color-text-0)',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.key);
            } else {
              handleSelect(item.key);
            }
          }}
        >
          {/* 选中状态的左侧蓝条 */}
          {isSelected && isChild && (
            <div 
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: 'var(--semi-color-primary)'
              }}
            />
          )}

          {/* 图标 */}
          {item.icon && (
            <div 
              style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                marginRight: collapsed ? 0 : 12,
                color: isSelected || hasSelectedChild ? 'var(--semi-color-primary)' : 'var(--semi-color-text-2)' 
              }}
            >
              {item.badge ? (
                <Badge count={item.badge} overflowCount={99} type="danger">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </div>
          )}
          
          {/* 文字 */}
          {!collapsed && (
            <>
              <span 
                style={{ 
                  flex: 1,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                  fontWeight: isSelected ? 500 : 400,
                }}
              >
                {item.label}
              </span>
              
              {/* 展开箭头 */}
              {hasChildren && (
                <span style={{ color: 'var(--semi-color-text-2)' }}>
                  {isExpanded ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}
                </span>
              )}
            </>
          )}
        </div>

        {/* 子菜单 */}
        {hasChildren && isExpanded && !collapsed && (
          <div>
            {item.children!.map(child => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 主导航 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 8 }}>
        {mainMenuItems.map(item => renderMenuItem(item))}
      </div>

      {/* 底部导航 */}
      <div style={{ paddingTop: 8, paddingBottom: 8 }}>
        {bottomMenuItems.map(item => renderMenuItem(item))}
        
        {/* 用户信息 */}
        <div 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: 'pointer',
            transition: 'all 0.2s',
            padding: collapsed ? '12px 0' : '12px 16px',
            marginTop: 4
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Avatar 
            size="small" 
            style={{ 
              marginRight: collapsed ? 0 : 12,
              backgroundColor: '#FFE600',
              color: 'var(--semi-color-text-0)',
              flexShrink: 0
            }}
          >
            L
          </Avatar>
          {!collapsed && (
            <>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--semi-color-text-0)' }}>LingHui</span>
              <IconChevronRight size="small" style={{ color: 'var(--semi-color-text-2)' }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
