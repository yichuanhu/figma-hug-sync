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
  IconSend,
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

import './index.less';

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
    if (
      pathname === '/development-workbench' ||
      pathname === '/process-development' ||
      pathname.startsWith('/process-detail/') ||
      pathname === '/worker-management' ||
      pathname.startsWith('/worker-management/') ||
      pathname.startsWith('/dev-center/')
    ) {
      return 'developmentCenter';
    }
    // 调度中心相关路由
    if (
      pathname === '/scheduling-workbench' ||
      pathname.startsWith('/scheduling') ||
      pathname.startsWith('/scheduling-center/')
    ) {
      return 'schedulingCenter';
    }
    // 运营中心相关路由
    if (pathname === '/operations-workbench' || pathname.startsWith('/operations')) {
      return 'operationsCenter';
    }
    // 需求中心相关路由
    if (pathname === '/requirements-workbench' || pathname.startsWith('/requirements')) {
      return 'requirementsCenter';
    }
    // 运维中心相关路由
    if (pathname === '/maintenance-workbench' || pathname.startsWith('/maintenance')) {
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
    {
      key: 'developmentCenter',
      labelKey: 'sidebar.developmentCenter',
      icon: <DevelopmentIcon size={20} />,
      path: '/development-workbench',
    },
    {
      key: 'schedulingCenter',
      labelKey: 'sidebar.schedulingCenter',
      icon: <SchedulingIcon size={20} />,
      path: '/scheduling-workbench',
    },
    {
      key: 'operationsCenter',
      labelKey: 'sidebar.operationsCenter',
      icon: <BusinessIcon size={20} />,
      path: '/operations-workbench',
    },
    {
      key: 'requirementsCenter',
      labelKey: 'sidebar.requirementsCenter',
      icon: <RequirementsIcon size={20} />,
      path: '/requirements-workbench',
    },
    {
      key: 'maintenanceCenter',
      labelKey: 'sidebar.maintenanceCenter',
      icon: <OperationsIcon size={20} />,
      path: '/maintenance-workbench',
    },
  ];

  // 开发中心的详细菜单结构
  const developmentCenterMenu: MenuItem[] = [
    { key: 'developmentWorkbench', labelKey: 'sidebar.developmentWorkbench', icon: <IconGridView /> },
    {
      key: 'developmentTaskManagement',
      labelKey: 'sidebar.developmentTaskManagement',
      icon: <IconFile />,
      children: [
        { key: 'automationProcess', labelKey: 'sidebar.automationProcess', path: '/process-development' },
        { key: 'documentProcessing', labelKey: 'sidebar.documentProcessing' },
        { key: 'agentApplication', labelKey: 'sidebar.agentApplication' },
        { key: 'humanMachineProcess', labelKey: 'sidebar.humanMachineProcess' },
      ],
    },
    {
      key: 'businessAssetConfig',
      labelKey: 'sidebar.businessAssetConfig',
      icon: <IconFolder />,
      children: [
        { key: 'queue', labelKey: 'sidebar.queue' },
        { key: 'devCredentials', labelKey: 'sidebar.credentials', path: '/dev-center/business-assets/credentials' },
        { key: 'parameters', labelKey: 'sidebar.parameters' },
        { key: 'files', labelKey: 'sidebar.files' },
      ],
    },
    {
      key: 'capabilityAssetManagement',
      labelKey: 'sidebar.capabilityAssetManagement',
      icon: <IconFolder />,
      children: [
        { key: 'processAssets', labelKey: 'sidebar.processAssets' },
        { key: 'knowledgeAssets', labelKey: 'sidebar.knowledgeAssets' },
        { key: 'connectionAssets', labelKey: 'sidebar.connectionAssets' },
        { key: 'workerManagement', labelKey: 'sidebar.workerManagement', path: '/worker-management' },
      ],
    },
    {
      key: 'publishManagement',
      labelKey: 'sidebar.publishManagement',
      icon: <IconSend />,
      children: [
        { key: 'publishList', labelKey: 'sidebar.publishList' },
        { key: 'newPublish', labelKey: 'sidebar.newPublish' },
        { key: 'publishHistory', labelKey: 'sidebar.publishHistory' },
      ],
    },
  ];

  const bottomMenuItems: MenuItem[] = [
    { key: 'messageCenter', labelKey: 'sidebar.messageCenter', icon: <IconBell />, badge: 999 },
    { key: 'userGuide', labelKey: 'sidebar.userGuide', icon: <IconBookStroked /> },
    { key: 'resourceDownload', labelKey: 'sidebar.resourceDownload', icon: <IconCloud /> },
  ];

  // 调度中心的详细菜单结构
  const schedulingCenterMenu: MenuItem[] = [
    { key: 'schedulingWorkbench', labelKey: 'sidebar.schedulingWorkbench', icon: <IconGridView /> },
    {
      key: 'schedulingBusinessAssetConfig',
      labelKey: 'sidebar.businessAssetConfig',
      icon: <IconFolder />,
      children: [
        { key: 'schedulingQueue', labelKey: 'sidebar.queue' },
        { key: 'schedulingCredentials', labelKey: 'sidebar.credentials', path: '/scheduling-center/business-assets/credentials' },
        { key: 'schedulingParameters', labelKey: 'sidebar.parameters' },
        { key: 'schedulingFiles', labelKey: 'sidebar.files' },
      ],
    },
  ];

  // 根据当前路由获取选中的菜单key
  const getSelectedKeyByPath = (pathname: string): string => {
    if (pathname === '/worker-management' || pathname.startsWith('/worker-management/')) {
      return 'workerManagement';
    }
    if (pathname === '/process-development' || pathname === '/') {
      return 'automationProcess';
    }
    if (pathname === '/dev-center/business-assets/credentials') {
      return 'devCredentials';
    }
    if (pathname === '/scheduling-center/business-assets/credentials') {
      return 'schedulingCredentials';
    }
    return '';
  };

  const selectedKey = getSelectedKeyByPath(location.pathname);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const toggleFloatingExpand = (key: string) => {
    setFloatingExpandedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
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
    if (centerKey === 'schedulingCenter') {
      return schedulingCenterMenu;
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
        onClick={() => handleCenterClick(item)}
      >
        {item.icon}
      </div>
    );

    return (
      <div
        key={item.key}
        className="sidebar-icon-btn-wrapper"
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
          <div className="sidebar-floating-menu">
            {/* 浮动菜单标题和展开按钮 */}
            <div className="sidebar-floating-menu-header">
              <span className="sidebar-floating-menu-title">{label}</span>
              <div
                className="sidebar-icon-btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.();
                }}
                title={t('sidebar.expandSidebar')}
              >
                <img src={layoutIcon} alt="expand" className="sidebar-layout-icon" />
              </div>
            </div>
            {/* 菜单列表 - 可滚动 */}
            <div className="sidebar-floating-menu-list">
              {getCenterMenu(item.key).map((menuItem) => renderFloatingMenuItem(menuItem))}
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
      <div key={item.key} className="sidebar-menu-item">
        <div className="sidebar-menu-item-wrapper">
          <div
            className={`sidebar-menu-content ${isChild ? 'floating-child' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => {
              if (hasChildren) {
                toggleFloatingExpand(item.key);
              } else {
                handleSelect(item.key, item.path);
              }
            }}
          >
            {/* 图标 - 只有一级菜单显示 */}
            {!isChild && item.icon && <div className="sidebar-menu-icon">{item.icon}</div>}

            <span className={`sidebar-menu-text ${hasChildren ? 'parent' : ''} ${isSelected ? 'selected' : ''}`}>
              {label}
            </span>

            {hasChildren && (
              <span className="sidebar-menu-arrow">
                {isExpanded ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="sidebar-submenu">{item.children!.map((child) => renderFloatingMenuItem(child, true))}</div>
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
      <div key={item.key} className="sidebar-menu-item">
        <div className="sidebar-menu-item-wrapper">
          <div
            className={`sidebar-menu-content ${isChild ? 'child' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => {
              if (hasChildren) {
                toggleExpand(item.key);
              } else {
                handleSelect(item.key, item.path);
              }
            }}
          >
            {/* 图标 - 只有一级菜单显示 */}
            {!isChild && item.icon && <div className="sidebar-menu-icon detail-icon">{item.icon}</div>}

            {/* 文字 */}
            <span className={`sidebar-menu-text ${hasChildren ? 'parent' : ''} ${isSelected ? 'selected' : ''}`}>
              {label}
            </span>

            {/* 展开箭头 */}
            {hasChildren && (
              <span className="sidebar-menu-arrow">
                {isExpanded ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}
              </span>
            )}
          </div>
        </div>

        {/* 展开的子菜单 */}
        {hasChildren && isExpanded && (
          <div className="sidebar-submenu">{item.children!.map((child) => renderDetailMenuItem(child, true))}</div>
        )}
      </div>
    );
  };

  // 渲染底部菜单项
  const renderBottomMenuItem = (item: MenuItem) => {
    const label = t(item.labelKey);
    const iconButton = (
      <div className="sidebar-icon-btn">
        {item.icon}
        {item.badge && <span className="sidebar-badge-dot" />}
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
  const currentCenterLabel = centerMenuItems.find((item) => item.key === activeCenterKey)?.labelKey;

  return (
    <div className="sidebar">
      {/* 左侧图标栏 */}
      <div className={`sidebar-icon-bar ${!collapsed ? 'with-border' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={laiyeLogo} alt="Laiye" className="sidebar-logo-img" />
        </div>

        {/* 主菜单图标 */}
        <div className="sidebar-main-icons">{centerMenuItems.map(renderIconMenuItem)}</div>

        {/* 底部菜单图标 */}
        <div className="sidebar-bottom-icons">
          {bottomMenuItems.map(renderBottomMenuItem)}

          {/* 用户头像 */}
          <div className="sidebar-avatar">
            <Tooltip content="admin" position="right">
              <Avatar size="small" className="sidebar-avatar-user">
                A
              </Avatar>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 右侧详细菜单 - 仅在展开时显示 */}
      {!collapsed && currentCenterMenu.length > 0 && (
        <div className="sidebar-detail-panel">
          {/* 中心标题 */}
          <div className="sidebar-detail-header">
            <span className="sidebar-detail-title">{currentCenterLabel ? t(currentCenterLabel) : ''}</span>
            <div className="sidebar-icon-btn-small" onClick={onToggleCollapse} title={t('sidebar.expandSidebar')}>
              <img src={layoutIcon} alt="collapse" className="sidebar-layout-icon" />
            </div>
          </div>

          {/* 菜单列表 */}
          <div className="sidebar-detail-list">{currentCenterMenu.map((item) => renderDetailMenuItem(item))}</div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
