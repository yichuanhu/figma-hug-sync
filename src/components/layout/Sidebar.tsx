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
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

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
    setHoveredKey(null);
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const isSelected = selectedKey === item.key;
    const hasSelectedChild = item.children?.some(child => selectedKey === child.key);
    const isHovered = hoveredKey === item.key;

    return (
      <div 
        key={item.key} 
        style={{ position: 'relative' }}
        onMouseEnter={() => {
          if (collapsed && hasChildren) {
            setHoveredKey(item.key);
          }
        }}
        onMouseLeave={() => {
          if (collapsed && hasChildren) {
            setHoveredKey(null);
          }
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative',
            padding: isChild ? '10px 16px 10px 44px' : (collapsed ? '12px 0' : '12px 16px'),
            backgroundColor: isSelected ? '#F5F5F5' : 'transparent',
            color: 'var(--semi-color-text-0)',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          onClick={() => {
            if (hasChildren && !collapsed) {
              toggleExpand(item.key);
            } else if (!hasChildren) {
              handleSelect(item.key);
            }
          }}
        >
          {/* 选中状态的左侧黄条 */}
          {isSelected && (
            <div 
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                height: 20,
                width: 3,
                backgroundColor: '#FFE600',
                borderRadius: '0 2px 2px 0'
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
                color: 'var(--semi-color-text-2)' 
              }}
            >
              {item.icon}
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
              
              {/* Badge - 显示在文字右侧 */}
              {item.badge && (
                <span
                  style={{
                    backgroundColor: '#FF4D4F',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: 10,
                    marginRight: 8,
                    lineHeight: 1.2,
                  }}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              
              {/* 展开箭头 */}
              {hasChildren && (
                <span style={{ color: 'var(--semi-color-text-2)' }}>
                  {isExpanded ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}
                </span>
              )}
            </>
          )}
        </div>

        {/* 收起时的悬浮下拉菜单 */}
        {collapsed && hasChildren && isHovered && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: 0,
              backgroundColor: '#fff',
              borderRadius: 8,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              padding: '8px 0',
              minWidth: 140,
              zIndex: 1000,
            }}
          >
            {item.children!.map(child => {
              const isChildSelected = selectedKey === child.key;
              return (
                <div
                  key={child.key}
                  style={{
                    padding: '12px 24px',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: 'var(--semi-color-text-0)',
                    fontWeight: isChildSelected ? 500 : 400,
                    backgroundColor: isChildSelected ? '#F5F5F5' : 'transparent',
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChildSelected) {
                      e.currentTarget.style.backgroundColor = '#F5F5F5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isChildSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={() => handleSelect(child.key)}
                >
                  {isChildSelected && (
                    <div 
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: 20,
                        width: 3,
                        backgroundColor: '#FFE600',
                        borderRadius: '0 2px 2px 0'
                      }}
                    />
                  )}
                  {child.label}
                </div>
              );
            })}
          </div>
        )}

        {/* 展开时的子菜单 */}
        {hasChildren && isExpanded && !collapsed && (
          <div>
            {item.children!.map(child => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'visible' }}>
      {/* 主导航 */}
      <div style={{ flex: 1, overflowY: collapsed ? 'visible' : 'auto', overflowX: 'visible', paddingTop: 8, paddingBottom: 8 }}>
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
