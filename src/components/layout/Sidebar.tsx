import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import HomeIcon from '@/components/icons/HomeIcon';
import RequirementsIcon from '@/components/icons/RequirementsIcon';
import DevelopmentIcon from '@/components/icons/DevelopmentIcon';
import SchedulingIcon from '@/components/icons/SchedulingIcon';
import OperationsIcon from '@/components/icons/OperationsIcon';
import BusinessIcon from '@/components/icons/BusinessIcon';

interface MenuItem {
  key: string;
  labelKey: string;
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
  const { t } = useTranslation();
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['developmentTaskManagement']);
  const [hoveredCenterKey, setHoveredCenterKey] = useState<string | null>(null);
  const [floatingExpandedKeys, setFloatingExpandedKeys] = useState<string[]>(['developmentTaskManagement']);

  // 根据当前路由获取激活的中心
  const getActiveCenterByPath = (pathname: string): string => {
    // 开发中心相关路由
    if (pathname.startsWith('/dev')) {
      return 'developmentCenter';
    }
    // 运营中心相关路由
    if (pathname.startsWith('/ops')) {
      return 'operationsCenter';
    }
    // 调度中心相关路由
    if (pathname.startsWith('/scheduling')) {
      return 'schedulingCenter';
    }
    // 需求中心相关路由
    if (pathname.startsWith('/requirements')) {
      return 'requirementsCenter';
    }
    // 运维中心相关路由
    if (pathname.startsWith('/maintenance')) {
      return 'maintenanceCenter';
    }
    // 首页
    if (pathname === '/') {
      return 'home';
    }
    return 'developmentCenter';
  };

  const activeCenterKey = getActiveCenterByPath(location.pathname);

  // 中心级别菜单（左侧图标栏）
  const centerMenuItems: MenuItem[] = [
    { key: 'home', labelKey: 'sidebar.home', icon: <HomeIcon size={20} />, path: '/' },
    { key: 'developmentCenter', labelKey: 'sidebar.developmentCenter', icon: <DevelopmentIcon size={20} />, path: '/dev/workbench' },
    { key: 'schedulingCenter', labelKey: 'sidebar.schedulingCenter', icon: <SchedulingIcon size={20} />, path: '/scheduling/workbench' },
    { key: 'operationsCenter', labelKey: 'sidebar.operationsCenter', icon: <BusinessIcon size={20} />, path: '/ops/workbench' },
    { key: 'requirementsCenter', labelKey: 'sidebar.requirementsCenter', icon: <RequirementsIcon size={20} />, path: '/requirements/workbench' },
    { key: 'maintenanceCenter', labelKey: 'sidebar.maintenanceCenter', icon: <OperationsIcon size={20} />, path: '/maintenance/workbench' },
  ];

  // 开发中心的详细菜单结构
  const developmentCenterMenu: MenuItem[] = [
    { key: 'developmentWorkbench', labelKey: 'sidebar.developmentWorkbench', icon: <IconGridView />, path: '/dev/workbench' },
    { 
      key: 'developmentTaskManagement', 
      labelKey: 'sidebar.developmentTaskManagement', 
      icon: <IconFile />,
      children: [
        { key: 'automationProcess', labelKey: 'sidebar.automationProcess', path: '/dev/task-mgmt/process-development' },
        { key: 'documentProcessing', labelKey: 'sidebar.documentProcessing' },
        { key: 'agentApplication', labelKey: 'sidebar.agentApplication' },
        { key: 'humanMachineProcess', labelKey: 'sidebar.humanMachineProcess' },
      ]
    },
    { 
      key: 'businessAssetConfig', 
      labelKey: 'sidebar.businessAssetConfig', 
      icon: <IconFolder />,
      children: [
        { key: 'queue', labelKey: 'sidebar.queue' },
        { key: 'credentials', labelKey: 'sidebar.credentials' },
        { key: 'parameters', labelKey: 'sidebar.parameters' },
        { key: 'files', labelKey: 'sidebar.files' },
      ]
    },
    { 
      key: 'capabilityAssetManagement', 
      labelKey: 'sidebar.capabilityAssetManagement', 
      icon: <IconFolder />,
      children: [
        { key: 'processAssets', labelKey: 'sidebar.processAssets' },
        { key: 'knowledgeAssets', labelKey: 'sidebar.knowledgeAssets' },
        { key: 'connectionAssets', labelKey: 'sidebar.connectionAssets' },
        { key: 'workerManagement', labelKey: 'sidebar.workerManagement', path: '/ops/asset-mgmt/worker-management' },
      ]
    },
    { 
      key: 'publishManagement', 
      labelKey: 'sidebar.publishManagement', 
      icon: <IconSend />,
      children: [
        { key: 'publishList', labelKey: 'sidebar.publishList' },
        { key: 'newPublish', labelKey: 'sidebar.newPublish' },
        { key: 'publishHistory', labelKey: 'sidebar.publishHistory' },
      ]
    },
  ];

  const bottomMenuItems: MenuItem[] = [
    { key: 'messageCenter', labelKey: 'sidebar.messageCenter', icon: <IconBell />, badge: 999 },
    { key: 'userGuide', labelKey: 'sidebar.userGuide', icon: <IconBookStroked /> },
    { key: 'resourceDownload', labelKey: 'sidebar.resourceDownload', icon: <IconCloud /> },
  ];

  // 根据当前路由获取选中的菜单key
  const getSelectedKeyByPath = (pathname: string): string => {
    if (pathname.includes('/worker-management')) {
      return 'workerManagement';
    }
    if (pathname.includes('/process-development') || pathname === '/') {
      return 'automationProcess';
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
    }
  };

  // 获取中心对应的详细菜单
  const getCenterMenu = (centerKey: string) => {
    if (centerKey === 'developmentCenter') {
      return developmentCenterMenu;
    }
    return [];
  };

  // 渲染左侧图标栏的菜单项
  const renderIconMenuItem = (item: MenuItem) => {
    const isActive = activeCenterKey === item.key;
    const hasSubMenu = getCenterMenu(item.key).length > 0;
    const isHovered = hoveredCenterKey === item.key;
    const label = t(item.labelKey);
    
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
        <Tooltip content={label} position="right">
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
              backgroundColor: 'var(--semi-color-bg-0)',
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
                {label}
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
                title={t('sidebar.expandSidebar')}
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
    const label = t(item.labelKey);

    return (
      <div key={item.key} style={{ marginBottom: 4 }}>
        <div style={{ padding: '0 8px' }}>
          <div
            className={`sidebar-menu-item ${isSelected ? 'selected' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: isChild ? '10px 12px 10px 40px' : '10px 12px',
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
                fontWeight: hasChildren ? 600 : (isSelected ? 600 : 400),
              }}
            >
              {label}
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
    const label = t(item.labelKey);

    return (
      <div 
        key={item.key} 
        style={{ marginBottom: 4 }}
      >
        <div style={{ padding: '0 8px' }}>
          <div
            className={`sidebar-menu-item ${isSelected ? 'selected' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: isChild ? '10px 12px 10px 38px' : '10px 12px',
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
                fontWeight: hasChildren ? 600 : (isSelected ? 600 : 400),
              }}
            >
              {label}
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
    const label = t(item.labelKey);
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
      <div key={item.key}>
        <Tooltip content={label} position="right">
          {iconButton}
        </Tooltip>
      </div>
    );
  };

  // 获取当前中心的详细菜单
  const currentCenterMenu = getCenterMenu(activeCenterKey);
  const currentCenterLabel = centerMenuItems.find(item => item.key === activeCenterKey)?.labelKey;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 左侧图标栏 */}
      <div
        style={{
          width: 60,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 12,
          borderRight: collapsed ? 'none' : '1px solid var(--semi-color-border)',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <img 
            src={laiyeLogo} 
            alt="Laiye" 
            style={{ 
              width: 28, 
              height: 28, 
              objectFit: 'contain' 
            }} 
          />
        </div>

        {/* 主菜单图标 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {centerMenuItems.map(renderIconMenuItem)}
        </div>

        {/* 底部菜单图标 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {bottomMenuItems.map(renderBottomMenuItem)}
          
          {/* 用户头像 */}
          <div style={{ marginTop: 8 }}>
            <Tooltip content="admin" position="right">
              <Avatar 
                size="small" 
                style={{ 
                  backgroundColor: '#1890FF',
                  cursor: 'pointer',
                }}
              >
                A
              </Avatar>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 右侧详细菜单 - 仅在展开时显示 */}
      {!collapsed && currentCenterMenu.length > 0 && (
        <div
          style={{
            width: 200,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--semi-color-bg-0)',
          }}
        >
          {/* 中心标题 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 12px 16px 16px',
              borderBottom: '1px solid var(--semi-color-border)',
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--semi-color-text-0)',
              }}
            >
              {currentCenterLabel ? t(currentCenterLabel) : ''}
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
              onClick={onToggleCollapse}
              title={t('sidebar.expandSidebar')}
            >
              <img src={layoutIcon} alt="collapse" style={{ width: 16, height: 16 }} />
            </div>
          </div>

          {/* 菜单列表 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 0',
            }}
          >
            {currentCenterMenu.map(item => renderDetailMenuItem(item))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
