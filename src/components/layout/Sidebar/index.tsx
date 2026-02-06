import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, Dropdown, Divider, Tooltip } from '@douyinfe/semi-ui';
import { User, Monitor, LogOut } from 'lucide-react';
import {
  IconBellStroked,
  IconBookStroked,
  IconCloudStroked,
  IconSourceControl,
  IconChevronDown,
  IconChevronUp,
  IconGridView,
  IconFolderStroked,
} from '@douyinfe/semi-icons';
import {
  LayoutGrid,
  ListStart,
  MonitorCheck,
  Parentheses,
  FolderCheck,
  Forward,
  Workflow,
  CalendarClock,
  Play,
  History,
  Bot,
  Settings,
  FileText,
  BarChart3,
  TrendingUp,
  Target,
  ClipboardList,
  CheckSquare,
  Users,
  Wrench,
  AlertTriangle,
  Activity,
  Database,
  Shield,
} from 'lucide-react';
import layoutIcon from '@/assets/icons/layout.svg';
import laiyeLogo from '@/assets/laiye-logo.png';

// 中心图标
import homeCenterIcon from '@/assets/icons/home-center.png';
import developmentCenterIcon from '@/assets/icons/development-center.png';
import requirementsCenterIcon from '@/assets/icons/requirements-center.png';
import schedulingCenterIcon from '@/assets/icons/scheduling-center.png';
import operationsCenterIcon from '@/assets/icons/operations-center.png';
import maintenanceCenterIcon from '@/assets/icons/maintenance-center.png';

import './index.less';

interface MenuItem {
  key: string;
  labelKey: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  badge?: number;
  path?: string;
  isGroupLabel?: boolean; // 是否为分组标题
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
}

// 根据路径获取需要展开的菜单组
const getExpandedKeysByPath = (pathname: string): string[] => {
  // 开发任务管理下的路由
  if (pathname === '/process-development' || pathname.startsWith('/process-detail/')) {
    return ['developmentTaskManagement'];
  }
  // 业务资产配置下的路由
  if (pathname.startsWith('/dev-center/business-assets/') || pathname.startsWith('/scheduling-center/business-assets/')) {
    return ['businessAssetConfig', 'schedulingBusinessAssetConfig'];
  }
  // 执行资源监控下的路由 (流程机器人管理)
  if (pathname.startsWith('/scheduling-center/resource-monitoring/worker-management')) {
    return ['executionResourceMonitoring'];
  }
  return [];
};

const Sidebar = ({ collapsed, onToggleCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // 根据当前路由计算初始展开的菜单
  const initialExpandedKeys = getExpandedKeysByPath(location.pathname);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(initialExpandedKeys);
  const [hoveredCenterKey, setHoveredCenterKey] = useState<string | null>(null);
  const [floatingExpandedKeys, setFloatingExpandedKeys] = useState<string[]>(initialExpandedKeys);

  // 当路由变化时，自动展开对应的菜单组
  useEffect(() => {
    const newExpandedKeys = getExpandedKeysByPath(location.pathname);
    if (newExpandedKeys.length > 0) {
      setExpandedKeys(prev => {
        const merged = [...new Set([...prev, ...newExpandedKeys])];
        return merged;
      });
      setFloatingExpandedKeys(prev => {
        const merged = [...new Set([...prev, ...newExpandedKeys])];
        return merged;
      });
    }
  }, [location.pathname]);

  // 根据当前路由获取激活的中心
  const getActiveCenterByPath = (pathname: string): string => {
    // 开发中心相关路由
    if (
      pathname === '/development-workbench' ||
      pathname === '/process-development' ||
      pathname.startsWith('/process-detail/') ||
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
    { key: 'home', labelKey: 'sidebar.home', icon: <img src={homeCenterIcon} alt="home" className="sidebar-center-icon" />, path: '/' },
    {
      key: 'developmentCenter',
      labelKey: 'sidebar.developmentCenter',
      icon: <img src={developmentCenterIcon} alt="development" className="sidebar-center-icon" />,
      path: '/development-workbench',
    },
    {
      key: 'schedulingCenter',
      labelKey: 'sidebar.schedulingCenter',
      icon: <img src={schedulingCenterIcon} alt="scheduling" className="sidebar-center-icon" />,
      path: '/scheduling-workbench',
    },
    {
      key: 'operationsCenter',
      labelKey: 'sidebar.operationsCenter',
      icon: <img src={operationsCenterIcon} alt="operations" className="sidebar-center-icon" />,
      path: '/operations-workbench',
    },
    {
      key: 'requirementsCenter',
      labelKey: 'sidebar.requirementsCenter',
      icon: <img src={requirementsCenterIcon} alt="requirements" className="sidebar-center-icon" />,
      path: '/requirements-workbench',
    },
    {
      key: 'maintenanceCenter',
      labelKey: 'sidebar.maintenanceCenter',
      icon: <img src={maintenanceCenterIcon} alt="maintenance" className="sidebar-center-icon" />,
      path: '/maintenance-workbench',
    },
  ];

  // 开发中心的详细菜单结构 - 使用分组标题样式
  const developmentCenterMenu: MenuItem[] = [
    { key: 'developmentWorkbench', labelKey: 'sidebar.developmentWorkbench', icon: <LayoutGrid size={20} strokeWidth={2} /> },
    // 开发任务管理 - 分组标题
    { key: 'developmentTaskManagement', labelKey: 'sidebar.developmentTaskManagement', isGroupLabel: true },
    { key: 'automationProcess', labelKey: 'sidebar.automationProcess', icon: <Workflow size={20} strokeWidth={2} />, path: '/process-development' },
    // 业务资产配置 - 分组标题
    { key: 'businessAssetConfig', labelKey: 'sidebar.businessAssetConfig', isGroupLabel: true },
    { key: 'devQueue', labelKey: 'sidebar.queue', icon: <ListStart size={20} strokeWidth={2} />, path: '/dev-center/business-assets/queues' },
    { key: 'devCredentials', labelKey: 'sidebar.credentials', icon: <MonitorCheck size={20} strokeWidth={2} />, path: '/dev-center/business-assets/credentials' },
    { key: 'devParameters', labelKey: 'sidebar.parameters', icon: <Parentheses size={20} strokeWidth={2} />, path: '/dev-center/business-assets/parameters' },
    { key: 'files', labelKey: 'sidebar.files', icon: <FolderCheck size={20} strokeWidth={2} />, path: '/dev-center/business-assets/files' },
    // 发布管理 - 分组标题
    { key: 'publishManagement', labelKey: 'sidebar.publishManagement', isGroupLabel: true },
    { key: 'processPublish', labelKey: 'sidebar.processPublish', icon: <Forward size={20} strokeWidth={2} />, path: '/dev-center/release-management' },
  ];

  const bottomMenuItems: MenuItem[] = [
    { key: 'messageCenter', labelKey: 'sidebar.messageCenter', icon: <IconBellStroked />, badge: 999 },
    { key: 'userGuide', labelKey: 'sidebar.userGuide', icon: <IconBookStroked /> },
    { key: 'resourceDownload', labelKey: 'sidebar.resourceDownload', icon: <IconCloudStroked /> },
  ];

  // 调度中心的详细菜单结构 - 使用分组标题样式
  const schedulingCenterMenu: MenuItem[] = [
    { key: 'schedulingWorkbench', labelKey: 'sidebar.schedulingWorkbench', icon: <LayoutGrid size={20} strokeWidth={2} /> },
    // 1. 执行资产 - 分组标题
    { key: 'executionAssets', labelKey: 'sidebar.executionAssets', isGroupLabel: true },
    { key: 'schedulingAutomationProcess', labelKey: 'sidebar.automationProcess', icon: <Workflow size={20} strokeWidth={2} />, path: '/scheduling-center/execution-assets/automation-process' },
    { key: 'documentProcessing', labelKey: 'sidebar.documentProcessing', icon: <FileText size={20} strokeWidth={2} /> },
    { key: 'agentApplication', labelKey: 'sidebar.agentApplication', icon: <Bot size={20} strokeWidth={2} /> },
    { key: 'humanMachineTask', labelKey: 'sidebar.humanMachineTask', icon: <Users size={20} strokeWidth={2} /> },
    // 2. 执行资源监控 - 分组标题
    { key: 'executionResourceMonitoring', labelKey: 'sidebar.executionResourceMonitoring', isGroupLabel: true },
    { key: 'workerManagement', labelKey: 'sidebar.processRobot', icon: <Bot size={20} strokeWidth={2} />, path: '/scheduling-center/resource-monitoring/worker-management' },
    // 3. 业务资产配置 - 分组标题
    { key: 'schedulingBusinessAssetConfig', labelKey: 'sidebar.businessAssetConfig', isGroupLabel: true },
    { key: 'schedulingQueue', labelKey: 'sidebar.queue', icon: <ListStart size={20} strokeWidth={2} />, path: '/scheduling-center/business-assets/queues' },
    { key: 'schedulingCredentials', labelKey: 'sidebar.credentials', icon: <MonitorCheck size={20} strokeWidth={2} />, path: '/scheduling-center/business-assets/credentials' },
    { key: 'schedulingParameters', labelKey: 'sidebar.parameters', icon: <Parentheses size={20} strokeWidth={2} />, path: '/scheduling-center/business-assets/parameters' },
    { key: 'schedulingFiles', labelKey: 'sidebar.files', icon: <FolderCheck size={20} strokeWidth={2} />, path: '/scheduling-center/business-assets/files' },
    // 4. 任务执行 - 分组标题
    { key: 'taskExecution', labelKey: 'sidebar.taskExecution', isGroupLabel: true },
    { key: 'autoExecutionPolicy', labelKey: 'sidebar.autoExecutionPolicy', icon: <CalendarClock size={20} strokeWidth={2} />, path: '/scheduling-center/task-execution/auto-execution-policy' },
    { key: 'executionTemplate', labelKey: 'sidebar.executionTemplate', icon: <Play size={20} strokeWidth={2} />, path: '/scheduling-center/task-execution/templates' },
    { key: 'taskList', labelKey: 'sidebar.taskList', icon: <ClipboardList size={20} strokeWidth={2} />, path: '/scheduling-center/task-execution/task-list' },
  ];

  // 运营中心的详细菜单结构 - 使用分组标题样式
  const operationsCenterMenu: MenuItem[] = [
    { key: 'operationsWorkbench', labelKey: 'sidebar.operationsWorkbench', icon: <LayoutGrid size={20} strokeWidth={2} /> },
    // 数据分析 - 分组标题
    { key: 'dataAnalysis', labelKey: 'sidebar.dataAnalysis', isGroupLabel: true },
    { key: 'executionReport', labelKey: 'sidebar.executionReport', icon: <BarChart3 size={20} strokeWidth={2} /> },
    { key: 'performanceAnalysis', labelKey: 'sidebar.performanceAnalysis', icon: <TrendingUp size={20} strokeWidth={2} /> },
    // 运营管理 - 分组标题
    { key: 'operationsManagement', labelKey: 'sidebar.operationsManagement', isGroupLabel: true },
    { key: 'targetManagement', labelKey: 'sidebar.targetManagement', icon: <Target size={20} strokeWidth={2} /> },
    { key: 'reportExport', labelKey: 'sidebar.reportExport', icon: <FileText size={20} strokeWidth={2} /> },
  ];

  // 需求中心的详细菜单结构 - 使用分组标题样式
  const requirementsCenterMenu: MenuItem[] = [
    { key: 'requirementsWorkbench', labelKey: 'sidebar.requirementsWorkbench', icon: <LayoutGrid size={20} strokeWidth={2} /> },
    // 需求管理 - 分组标题
    { key: 'requirementsManagement', labelKey: 'sidebar.requirementsManagement', isGroupLabel: true },
    { key: 'requirementsList', labelKey: 'sidebar.requirementsList', icon: <ClipboardList size={20} strokeWidth={2} /> },
    { key: 'requirementsReview', labelKey: 'sidebar.requirementsReview', icon: <CheckSquare size={20} strokeWidth={2} /> },
    // 协作管理 - 分组标题
    { key: 'collaborationManagement', labelKey: 'sidebar.collaborationManagement', isGroupLabel: true },
    { key: 'teamMembers', labelKey: 'sidebar.teamMembers', icon: <Users size={20} strokeWidth={2} /> },
  ];

  // 运维中心的详细菜单结构 - 使用分组标题样式
  const maintenanceCenterMenu: MenuItem[] = [
    { key: 'maintenanceWorkbench', labelKey: 'sidebar.maintenanceWorkbench', icon: <LayoutGrid size={20} strokeWidth={2} /> },
    // 系统运维 - 分组标题
    { key: 'systemMaintenance', labelKey: 'sidebar.systemMaintenance', isGroupLabel: true },
    { key: 'systemConfig', labelKey: 'sidebar.systemConfig', icon: <Settings size={20} strokeWidth={2} /> },
    { key: 'troubleshooting', labelKey: 'sidebar.troubleshooting', icon: <Wrench size={20} strokeWidth={2} /> },
    // 监控告警 - 分组标题
    { key: 'monitoringAlerts', labelKey: 'sidebar.monitoringAlerts', isGroupLabel: true },
    { key: 'alertManagement', labelKey: 'sidebar.alertManagement', icon: <AlertTriangle size={20} strokeWidth={2} /> },
    { key: 'systemMonitoring', labelKey: 'sidebar.systemMonitoring', icon: <Activity size={20} strokeWidth={2} /> },
    // 数据管理 - 分组标题
    { key: 'dataManagement', labelKey: 'sidebar.dataManagement', isGroupLabel: true },
    { key: 'databaseManagement', labelKey: 'sidebar.databaseManagement', icon: <Database size={20} strokeWidth={2} /> },
    { key: 'securityManagement', labelKey: 'sidebar.securityManagement', icon: <Shield size={20} strokeWidth={2} /> },
  ];

  // 根据当前路由获取选中的菜单key
  const getSelectedKeyByPath = (pathname: string): string => {
    if (pathname.startsWith('/scheduling-center/resource-monitoring/worker-management')) {
      return 'workerManagement';
    }
    if (pathname === '/process-development' || pathname === '/') {
      return 'automationProcess';
    }
    if (pathname === '/dev-center/business-assets/queues') {
      return 'devQueue';
    }
    if (pathname === '/dev-center/business-assets/credentials') {
      return 'devCredentials';
    }
    if (pathname === '/dev-center/business-assets/parameters') {
      return 'devParameters';
    }
    if (pathname === '/dev-center/business-assets/files') {
      return 'files';
    }
    if (pathname === '/scheduling-center/business-assets/queues') {
      return 'schedulingQueue';
    }
    if (pathname === '/scheduling-center/business-assets/credentials') {
      return 'schedulingCredentials';
    }
    if (pathname === '/scheduling-center/business-assets/parameters') {
      return 'schedulingParameters';
    }
    if (pathname === '/scheduling-center/business-assets/files') {
      return 'schedulingFiles';
    }
    if (pathname === '/scheduling-center/execution-assets/automation-process') {
      return 'schedulingAutomationProcess';
    }
    if (pathname === '/scheduling-center/task-execution/task-list') {
      return 'taskList';
    }
    if (pathname === '/scheduling-center/task-execution/templates') {
      return 'executionTemplate';
    }
    if (pathname === '/scheduling-center/task-execution/auto-execution-policy') {
      return 'autoExecutionPolicy';
    }
    if (pathname === '/dev-center/release-management') {
      return 'processPublish';
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
    switch (centerKey) {
      case 'developmentCenter':
        return developmentCenterMenu;
      case 'schedulingCenter':
        return schedulingCenterMenu;
      case 'operationsCenter':
        return operationsCenterMenu;
      case 'requirementsCenter':
        return requirementsCenterMenu;
      case 'maintenanceCenter':
        return maintenanceCenterMenu;
      default:
        return [];
    }
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

  // 渲染详细菜单项 - 支持分组标题样式
  const renderDetailMenuItem = (item: MenuItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const isSelected = selectedKey === item.key;
    const label = t(item.labelKey);

    // 分组标题样式
    if (item.isGroupLabel) {
      return (
        <div key={item.key} className="sidebar-group-label">
          {label}
        </div>
      );
    }

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
            {/* 图标 */}
            {item.icon && <div className="sidebar-menu-icon detail-icon">{item.icon}</div>}

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

          {/* 用户头像 - 带下拉菜单 */}
          <div className="sidebar-avatar">
            <Dropdown
              trigger="hover"
              position="rightBottom"
              showTick={false}
              render={
                <div className="sidebar-user-dropdown">
                  {/* 用户信息区域 */}
                  <div className="sidebar-user-info">
                    <Avatar size="small" className="sidebar-avatar-user">
                      L
                    </Avatar>
                    <div className="sidebar-user-details">
                      <div className="sidebar-user-name">Ling hui</div>
                      <div className="sidebar-user-account">alim huang</div>
                    </div>
                  </div>
                  
                  {/* 组织信息 */}
                  <div className="sidebar-user-org">
                    <Monitor size={14} strokeWidth={2} className="sidebar-user-org-icon" />
                    <span className="sidebar-user-org-text">来也科技股份有限公司有限...</span>
                  </div>
                  
                  <Divider margin="12px 0" />
                  
                  {/* 菜单项 */}
                  <Dropdown.Menu>
                    <Dropdown.Item 
                      icon={<Monitor size={16} strokeWidth={2} />}
                    >
                      <span className="sidebar-menu-item-content">
                        {t('sidebar.userMenu.adminConsole')}
                        <span className="sidebar-menu-external-icon">↗</span>
                      </span>
                    </Dropdown.Item>
                    <Dropdown.Item 
                      icon={<User size={16} />}
                      onClick={() => navigate('/personal-center/personal-credentials')}
                    >
                      {t('sidebar.userMenu.personalCenter')}
                    </Dropdown.Item>
                    <Dropdown.Item 
                      icon={<IconExit />}
                    >
                      {t('sidebar.userMenu.logout')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </div>
              }
            >
              <Avatar size="small" className="sidebar-avatar-user">
                L
              </Avatar>
            </Dropdown>
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
