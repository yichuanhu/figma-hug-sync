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
import HomeIcon from '@/components/icons/HomeIcon';
import RequirementsIcon from '@/components/icons/RequirementsIcon';
import DevelopmentIcon from '@/components/icons/DevelopmentIcon';
import SchedulingIcon from '@/components/icons/SchedulingIcon';
import OperationsIcon from '@/components/icons/OperationsIcon';
import BusinessIcon from '@/components/icons/BusinessIcon';
import './Sidebar.less';

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

  const getActiveCenterByPath = (pathname: string): string => {
    if (pathname.startsWith('/dev')) return 'developmentCenter';
    if (pathname.startsWith('/ops')) return 'operationsCenter';
    if (pathname.startsWith('/scheduling')) return 'schedulingCenter';
    if (pathname.startsWith('/requirements')) return 'requirementsCenter';
    if (pathname.startsWith('/maintenance')) return 'maintenanceCenter';
    if (pathname === '/') return 'home';
    return 'developmentCenter';
  };

  const activeCenterKey = getActiveCenterByPath(location.pathname);

  const centerMenuItems: MenuItem[] = [
    { key: 'home', labelKey: 'sidebar.home', icon: <HomeIcon size={20} />, path: '/' },
    { key: 'developmentCenter', labelKey: 'sidebar.developmentCenter', icon: <DevelopmentIcon size={20} />, path: '/dev/workbench' },
    { key: 'schedulingCenter', labelKey: 'sidebar.schedulingCenter', icon: <SchedulingIcon size={20} />, path: '/scheduling/workbench' },
    { key: 'operationsCenter', labelKey: 'sidebar.operationsCenter', icon: <BusinessIcon size={20} />, path: '/ops/workbench' },
    { key: 'requirementsCenter', labelKey: 'sidebar.requirementsCenter', icon: <RequirementsIcon size={20} />, path: '/requirements/workbench' },
    { key: 'maintenanceCenter', labelKey: 'sidebar.maintenanceCenter', icon: <OperationsIcon size={20} />, path: '/maintenance/workbench' },
  ];

  const developmentCenterMenu: MenuItem[] = [
    { key: 'developmentWorkbench', labelKey: 'sidebar.developmentWorkbench', icon: <IconGridView />, path: '/dev/workbench' },
    { key: 'developmentTaskManagement', labelKey: 'sidebar.developmentTaskManagement', icon: <IconFile />,
      children: [
        { key: 'automationProcess', labelKey: 'sidebar.automationProcess', path: '/dev/task-mgmt/process-development' },
        { key: 'documentProcessing', labelKey: 'sidebar.documentProcessing' },
        { key: 'agentApplication', labelKey: 'sidebar.agentApplication' },
        { key: 'humanMachineProcess', labelKey: 'sidebar.humanMachineProcess' },
      ]
    },
    { key: 'businessAssetConfig', labelKey: 'sidebar.businessAssetConfig', icon: <IconFolder />,
      children: [
        { key: 'queue', labelKey: 'sidebar.queue' },
        { key: 'credentials', labelKey: 'sidebar.credentials' },
        { key: 'parameters', labelKey: 'sidebar.parameters' },
        { key: 'files', labelKey: 'sidebar.files' },
      ]
    },
    { key: 'capabilityAssetManagement', labelKey: 'sidebar.capabilityAssetManagement', icon: <IconFolder />,
      children: [
        { key: 'processAssets', labelKey: 'sidebar.processAssets' },
        { key: 'knowledgeAssets', labelKey: 'sidebar.knowledgeAssets' },
        { key: 'connectionAssets', labelKey: 'sidebar.connectionAssets' },
        { key: 'workerManagement', labelKey: 'sidebar.workerManagement', path: '/ops/asset-mgmt/worker-management' },
      ]
    },
    { key: 'publishManagement', labelKey: 'sidebar.publishManagement', icon: <IconSend />,
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

  const getSelectedKeyByPath = (pathname: string): string => {
    if (pathname.includes('/worker-management')) return 'workerManagement';
    if (pathname.includes('/process-development') || pathname === '/') return 'automationProcess';
    return '';
  };

  const selectedKey = getSelectedKeyByPath(location.pathname);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleFloatingExpand = (key: string) => {
    setFloatingExpandedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSelect = (key: string, path?: string) => {
    setHoveredCenterKey(null);
    if (path) navigate(path);
  };

  const handleCenterClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
      setHoveredCenterKey(null);
    }
  };

  const getCenterMenu = (centerKey: string) => centerKey === 'developmentCenter' ? developmentCenterMenu : [];

  const renderIconMenuItem = (item: MenuItem) => {
    const isActive = activeCenterKey === item.key;
    const hasSubMenu = getCenterMenu(item.key).length > 0;
    const isHovered = hoveredCenterKey === item.key;
    const label = t(item.labelKey);
    
    return (
      <div
        key={item.key}
        style={{ position: 'relative' }}
        onMouseEnter={() => { if (collapsed && hasSubMenu) setHoveredCenterKey(item.key); }}
        onMouseLeave={() => { if (collapsed && hasSubMenu) setHoveredCenterKey(null); }}
      >
        <Tooltip content={label} position="right">
          <div
            className={`sidebar icon-bar icon-btn ${isActive ? 'active' : ''}`}
            onClick={() => handleCenterClick(item)}
          >
            {item.icon}
          </div>
        </Tooltip>

        {collapsed && hasSubMenu && isHovered && (
          <div className="sidebar floating-menu">
            <div className="floating-header">
              <span className="floating-title">{label}</span>
              <div className="sidebar icon-bar icon-btn-small" onClick={(e) => { e.stopPropagation(); onToggleCollapse?.(); }} title={t('sidebar.expandSidebar')}>
                <img src={layoutIcon} alt="expand" className="layout-icon" />
              </div>
            </div>
            <div className="floating-list">
              {getCenterMenu(item.key).map(menuItem => renderFloatingMenuItem(menuItem))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFloatingMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = floatingExpandedKeys.includes(item.key);
    const isSelected = selectedKey === item.key;
    const label = t(item.labelKey);

    return (
      <div key={item.key} className="sidebar menu-item">
        <div
          className={`menu-content ${isChild ? 'floating-child' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => { hasChildren ? toggleFloatingExpand(item.key) : handleSelect(item.key, item.path); }}
        >
          {!isChild && item.icon && <div className="menu-icon">{item.icon}</div>}
          <span className={`menu-text ${hasChildren ? 'parent' : ''} ${isSelected ? 'selected' : ''}`}>{label}</span>
          {hasChildren && <span className="menu-arrow">{isExpanded ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}</span>}
        </div>
        {hasChildren && isExpanded && <div className="submenu">{item.children!.map(child => renderFloatingMenuItem(child, true))}</div>}
      </div>
    );
  };

  const renderDetailMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const isSelected = selectedKey === item.key;
    const label = t(item.labelKey);

    return (
      <div key={item.key} className="sidebar menu-item">
        <div
          className={`menu-content ${isChild ? 'child' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => { hasChildren ? toggleExpand(item.key) : handleSelect(item.key, item.path); }}
        >
          {!isChild && item.icon && <div className="menu-icon detail">{item.icon}</div>}
          <span className={`menu-text ${hasChildren ? 'parent' : ''} ${isSelected ? 'selected' : ''}`}>{label}</span>
          {hasChildren && <span className="menu-arrow">{isExpanded ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}</span>}
        </div>
        {hasChildren && isExpanded && <div className="submenu">{item.children!.map(child => renderDetailMenuItem(child, true))}</div>}
      </div>
    );
  };

  const renderBottomMenuItem = (item: MenuItem) => {
    const label = t(item.labelKey);
    return (
      <div key={item.key}>
        <Tooltip content={label} position="right">
          <div className="sidebar icon-bar icon-btn">
            {item.icon}
            {item.badge && <span className="badge-dot" />}
          </div>
        </Tooltip>
      </div>
    );
  };

  const currentCenterMenu = getCenterMenu(activeCenterKey);
  const currentCenterLabel = centerMenuItems.find(item => item.key === activeCenterKey)?.labelKey;

  return (
    <div className="sidebar">
      <div className={`icon-bar ${!collapsed ? 'with-border' : ''}`}>
        <div className="logo">
          <img src={laiyeLogo} alt="Laiye" className="logo-img" />
        </div>
        <div className="main-icons">{centerMenuItems.map(renderIconMenuItem)}</div>
        <div className="bottom-icons">
          {bottomMenuItems.map(renderBottomMenuItem)}
          <div className="avatar">
            <Tooltip content="admin" position="right">
              <Avatar size="small" style={{ backgroundColor: '#1890FF', cursor: 'pointer' }}>A</Avatar>
            </Tooltip>
          </div>
        </div>
      </div>

      {!collapsed && currentCenterMenu.length > 0 && (
        <div className="detail-panel">
          <div className="detail-header">
            <span className="detail-title">{currentCenterLabel ? t(currentCenterLabel) : ''}</span>
            <div className="sidebar icon-bar icon-btn-small" onClick={onToggleCollapse} title={t('sidebar.expandSidebar')}>
              <img src={layoutIcon} alt="collapse" className="layout-icon" />
            </div>
          </div>
          <div className="detail-list">{currentCenterMenu.map(item => renderDetailMenuItem(item))}</div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
