import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, Tooltip } from '@douyinfe/semi-ui';
import { 
  IconBell, 
  IconBookStroked, 
  IconCloud,
  IconChevronDown,
  IconChevronUp,
  IconGridView,
  IconFile,
  IconFolder,
  IconSend
} from '@douyinfe/semi-icons';
import layoutIcon from '@/assets/icons/layout.svg';
import laiyeLogo from '@/assets/laiye-logo.png';

// 自定义导航图标
import { 
  HomeIcon, 
  RequirementsIcon, 
  DevelopmentIcon, 
  SchedulingIcon, 
  OperationsIcon, 
  BusinessIcon 
} from '@/components/icons';

interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  badge?: number;
  path?: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar = ({ collapsed, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['开发任务管理']);
  const [hoveredCenterKey, setHoveredCenterKey] = useState<string | null>(null);
  const [floatingExpandedKeys, setFloatingExpandedKeys] = useState<string[]>(['开发任务管理']);
  const [activeCenterKey, setActiveCenterKey] = useState<string>('开发中心');

  // 中心级别菜单（左侧图标栏）
  const centerMenuItems: MenuItem[] = [
    { key: '首页', label: '首页', icon: <HomeIcon size={20} />, path: '/' },
    { key: '开发中心', label: '开发中心', icon: <DevelopmentIcon size={20} /> },
    { key: '调度中心', label: '调度中心', icon: <SchedulingIcon size={20} /> },
    { key: '运营中心', label: '运营中心', icon: <BusinessIcon size={20} /> },
    { key: '需求中心', label: '需求中心', icon: <RequirementsIcon size={20} /> },
    { key: '运维中心', label: '运维中心', icon: <OperationsIcon size={20} /> },
  ];

  // 开发中心的详细菜单结构
  const developmentCenterMenu: MenuItem[] = [
    { key: '开发工作台', label: '开发工作台', icon: <IconGridView /> },
    { 
      key: '开发任务管理', 
      label: '开发任务管理', 
      icon: <IconFile />,
      children: [
        { key: '自动化流程', label: '自动化流程', path: '/process-development' },
        { key: '文档处理应用', label: '文档处理应用' },
        { key: '智能体应用', label: '智能体应用' },
        { key: '人机协同流程', label: '人机协同流程' },
      ]
    },
    { 
      key: '业务资产配置', 
      label: '业务资产配置', 
      icon: <IconFolder />,
      children: [
        { key: '队列', label: '队列' },
        { key: '凭据', label: '凭据' },
        { key: '参数', label: '参数' },
        { key: '文件', label: '文件' },
      ]
    },
    { 
      key: '能力资产管理', 
      label: '能力资产管理', 
      icon: <IconFolder />,
      children: [
        { key: '流程资产', label: '流程资产' },
        { key: '知识资产', label: '知识资产' },
        { key: '连接资产', label: '连接资产' },
        { key: '流程机器人管理', label: '流程机器人管理', path: '/worker-management' },
      ]
    },
    { 
      key: '发布管理', 
      label: '发布管理', 
      icon: <IconSend />,
      children: [
        { key: '发布列表', label: '发布列表' },
        { key: '新建发布', label: '新建发布' },
        { key: '发布历史', label: '发布历史' },
      ]
    },
  ];

  const bottomMenuItems: MenuItem[] = [
    { key: '消息中心', label: '消息中心', icon: <IconBell />, badge: 999 },
    { key: '用户指南', label: '用户指南', icon: <IconBookStroked /> },
    { key: '资源下载', label: '资源下载', icon: <IconCloud /> },
  ];

  // 根据当前路由获取选中的菜单key
  const getSelectedKeyByPath = (pathname: string): string => {
    if (pathname === '/worker-management' || pathname.startsWith('/worker-management/')) {
      return '流程机器人管理';
    }
    if (pathname === '/process-development' || pathname === '/') {
      return '自动化流程';
    }
    return '';
  };

  const selectedKey = getSelectedKeyByPath(location.pathname);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const toggleFloatingExpand = (key: string) => {
    setFloatingExpandedKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleSelect = (key: string, path?: string) => {
    setHoveredCenterKey(null);
    if (path) {
      navigate(path);
    }
  };

  const handleCenterClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
      setHoveredCenterKey(null);
    } else {
      setActiveCenterKey(item.key);
    }
  };

  // 获取中心对应的详细菜单
  const getCenterMenu = (centerKey: string) => {
    if (centerKey === '开发中心') {
      return developmentCenterMenu;
    }
    return [];
  };

  // 渲染左侧图标栏的菜单项
  const renderIconMenuItem = (item: MenuItem) => {
    const isActive = activeCenterKey === item.key;
    const hasSubMenu = getCenterMenu(item.key).length > 0;
    const isHovered = hoveredCenterKey === item.key;
    
    const iconButton = (
      <div
        className={`sidebar-icon-btn ${isActive ? 'active' : ''}`}
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: 8,
          color: isActive ? '#1890FF' : 'var(--semi-color-text-2)',
          marginBottom: 4,
        }}
        onClick={() => handleCenterClick(item)}
      >
        {item.icon}
      </div>
    );

    return (
      <div
        key={item.key}
        style={{
          position: 'relative',
        }}
        onMouseEnter={() => {
          if (collapsed && hasSubMenu) {
            setHoveredCenterKey(item.key);
          }
        }}
        onMouseLeave={() => {
          if (collapsed && hasSubMenu) {
            setHoveredCenterKey(null);
          }
        }}
      >
        <Tooltip content={item.label} position="right">
          {iconButton}
        </Tooltip>

        {/* 收起时的浮动菜单 */}
        {collapsed && hasSubMenu && isHovered && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: 0,
              marginLeft: 16,
              backgroundColor: '#fff',
              borderRadius: 8,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              minWidth: 180,
              maxWidth: 280,
              width: 'fit-content',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              height: 480,
              maxHeight: 'calc(100vh - 120px)',
            }}
          >
            {/* 浮动菜单标题和展开按钮 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 12px 12px 16px',
              borderBottom: '1px solid var(--semi-color-border)',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--semi-color-text-0)',
                whiteSpace: 'nowrap',
              }}>
                {item.label}
              </span>
              <div
                className="sidebar-icon-btn"
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: 6,
                  color: 'var(--semi-color-text-2)',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.();
                }}
                title="展开侧边栏"
              >
                <img src={layoutIcon} alt="expand" style={{ width: 16, height: 16 }} />
              </div>
            </div>
            {/* 菜单列表 - 可滚动 */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '8px 0',
            }}>
              {getCenterMenu(item.key).map(menuItem => renderFloatingMenuItem(menuItem))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染浮动菜单项
  const renderFloatingMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = floatingExpandedKeys.includes(item.key);
    const isSelected = selectedKey === item.key;

    return (
      <div key={item.key} style={{ marginBottom: 2 }}>
        <div style={{ padding: '0 8px' }}>
          <div
            className={`sidebar-menu-item ${isSelected ? 'selected' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              height: 36,
              padding: isChild ? '0 16px 0 28px' : '0 12px',
              borderRadius: 6,
              color: 'var(--semi-color-text-0)',
            }}
            onClick={() => {
              if (hasChildren) {
                toggleFloatingExpand(item.key);
              } else {
                handleSelect(item.key, item.path);
              }
            }}
          >
            {/* 图标 - 只有一级菜单显示 */}
            {!isChild && item.icon && (
              <div 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  marginRight: 8,
                  color: 'var(--semi-color-text-2)' 
                }}
              >
                {item.icon}
              </div>
            )}
            
            <span 
              style={{ 
                flex: 1,
                fontSize: 14,
                whiteSpace: 'nowrap',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {item.label}
            </span>
            
            {hasChildren && (
              <span style={{ color: 'var(--semi-color-text-2)' }}>
                {isExpanded ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderFloatingMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  // 渲染详细菜单项
  const renderDetailMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const isSelected = selectedKey === item.key;

    return (
      <div 
        key={item.key} 
        style={{ marginBottom: isChild ? 0 : 2 }}
      >
        <div style={{ padding: '0 8px' }}>
          <div
            className={`sidebar-menu-item ${isSelected ? 'selected' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              height: 36,
              padding: isChild ? '0 12px 0 44px' : '0 12px',
              borderRadius: 6,
              color: 'var(--semi-color-text-0)',
            }}
            onClick={() => {
              if (hasChildren) {
                toggleExpand(item.key);
              } else {
                handleSelect(item.key, item.path);
              }
            }}
          >
            {/* 图标 - 只有一级菜单显示 */}
            {!isChild && item.icon && (
              <div 
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  marginRight: 8,
                  color: 'var(--semi-color-text-2)',
                  fontSize: 16,
                }}
              >
                {item.icon}
              </div>
            )}
            
            {/* 文字 */}
            <span 
              style={{ 
                flex: 1,
                fontSize: 14,
                whiteSpace: 'nowrap',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {item.label}
            </span>
            
            {/* 展开箭头 */}
            {hasChildren && (
              <span style={{ color: 'var(--semi-color-text-3)', display: 'flex', alignItems: 'center' }}>
                {isExpanded ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}
              </span>
            )}
          </div>
        </div>

        {/* 展开的子菜单 */}
        {hasChildren && isExpanded && (
          <div style={{ marginTop: 2 }}>
            {item.children!.map(child => renderDetailMenuItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  // 渲染底部菜单项
  const renderBottomMenuItem = (item: MenuItem) => {
    const iconButton = (
      <div
        className="sidebar-icon-btn"
        style={{
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: 8,
          position: 'relative',
          color: 'var(--semi-color-text-2)',
          marginBottom: 4,
        }}
      >
        {item.icon}
        {item.badge && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              backgroundColor: '#FF4D4F',
              borderRadius: '50%',
            }}
          />
        )}
      </div>
    );

    return (
      <Tooltip key={item.key} content={item.label} position="right">
        {iconButton}
      </Tooltip>
    );
  };

  // 获取当前中心的详细菜单
  const getCurrentCenterMenu = () => {
    return getCenterMenu(activeCenterKey);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'visible' }}>
      {/* 左侧图标栏 - 包含Logo */}
      <div 
        style={{ 
          width: 60, 
          minWidth: 60,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          paddingBottom: 8,
          overflow: 'visible',
        }}
      >
        {/* Logo区域 */}
        <div style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <img 
            src={laiyeLogo} 
            alt="Laiye" 
            style={{ height: 16, width: 'auto' }}
          />
        </div>
        {/* 中心图标 */}
        <div style={{ flex: 1, overflow: 'visible' }}>
          {centerMenuItems.map(item => renderIconMenuItem(item))}
        </div>
        
        {/* 底部图标 */}
        <div>
          {bottomMenuItems.map(item => renderBottomMenuItem(item))}
          {/* 用户头像 */}
          <Tooltip content="个人中心" position="right">
            <div
              className="sidebar-icon-btn"
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 8,
                marginTop: 4,
              }}
            >
              <Avatar 
                size="small" 
                style={{ 
                  backgroundColor: '#FFE600',
                  color: 'var(--semi-color-text-0)',
                }}
              >
                L
              </Avatar>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* 右侧详细菜单 - 仅在未收起时显示 */}
      {!collapsed && (
        <div style={{ 
          minWidth: 180,
          maxWidth: 280,
          width: 'fit-content',
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          backgroundColor: '#fff',
          borderRadius: 8,
          margin: '8px 8px 8px 16px',
          boxShadow: '0 0 1px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.04)',
        }}>
          {/* 菜单标题栏 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 8px 12px 16px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 18, 
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--semi-color-text-2)',
              }}>
                {centerMenuItems.find(c => c.key === activeCenterKey)?.icon}
              </div>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--semi-color-text-0)',
                whiteSpace: 'nowrap',
              }}>
                {activeCenterKey}
              </span>
            </div>
            <div
              className="sidebar-icon-btn"
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 6,
                flexShrink: 0,
              }}
              onClick={onToggleCollapse}
              title="收起侧边栏"
            >
              <img src={layoutIcon} alt="collapse" style={{ width: 18, height: 18 }} />
            </div>
          </div>
          
          {/* 菜单列表 */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
            {getCurrentCenterMenu().map(item => renderDetailMenuItem(item))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
