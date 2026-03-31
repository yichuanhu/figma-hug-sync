import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, Popover, Tooltip } from '@douyinfe/semi-ui';
import { UserInfoDropdown } from '../UserInfoDropdown';
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
  Home,
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
  Code,
  Share2,
} from 'lucide-react';
const LayoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M3 15.75C2.17157 15.75 1.5 15.0784 1.5 14.25L1.5 3.75C1.5 2.92157 2.17157 2.25 3 2.25L15 2.25C15.8284 2.25 16.5 2.92157 16.5 3.75L16.5 14.25C16.5 15.0784 15.8284 15.75 15 15.75L3 15.75ZM3 3.75L3 14.25L6.375 14.25L6.375 3.75L3 3.75ZM7.875 3.75L7.875 14.25L15 14.25L15 3.75L7.875 3.75Z" fill="currentColor"/>
  </svg>
);
import laiyeLogo from '@/assets/laiye-logo.png';

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
  disableHover?: boolean;
  detailPanelVisible?: boolean;
  onToggleDetailPanel?: () => void;
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

const Sidebar = ({ collapsed, onToggleCollapse, disableHover = false, detailPanelVisible = true, onToggleDetailPanel }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // 根据当前路由计算初始展开的菜单
  const initialExpandedKeys = getExpandedKeysByPath(location.pathname);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(initialExpandedKeys);
  const [hoveredCenterKey, setHoveredCenterKey] = useState<string | null>(null);
  const [floatingExpandedKeys, setFloatingExpandedKeys] = useState<string[]>(initialExpandedKeys);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef<number>(0);

  // 拖拽手柄逻辑
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - dragStartX.current;
      const threshold = 50;
      if (collapsed && delta > threshold) {
        onToggleCollapse?.();
        cleanup();
      } else if (!collapsed && delta < -threshold) {
        onToggleCollapse?.();
        cleanup();
      }
    };

    const handleMouseUp = () => {
      cleanup();
    };

    const cleanup = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [collapsed, onToggleCollapse]);

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
    if (
      pathname === '/process-development' ||
      pathname.startsWith('/process-detail/') ||
      pathname.startsWith('/dev-center/')
    ) {
      return 'developmentCenter';
    }
    if (
      pathname.startsWith('/scheduling') ||
      pathname.startsWith('/scheduling-center/')
    ) {
      return 'schedulingCenter';
    }
    if (pathname.startsWith('/operations')) {
      return 'operationsCenter';
    }
    if (pathname.startsWith('/requirements')) {
      return 'requirementsCenter';
    }
    if (pathname.startsWith('/sharing')) {
      return 'sharingCenter';
    }
    if (pathname.startsWith('/maintenance')) {
      return 'maintenanceCenter';
    }
    if (pathname === '/') {
      return 'home';
    }
    if (pathname.startsWith('/personal-center')) {
      return 'personalCenter';
    }
    return 'developmentCenter';
  };

  const activeCenterKey = getActiveCenterByPath(location.pathname);

  // 获取中心菜单中第一个有 path 的菜单项
  const getFirstPathInMenu = (menu: MenuItem[]): string | undefined => {
    for (const item of menu) {
      if (item.isGroupLabel) continue;
      if (item.path) return item.path;
      if (item.children) {
        for (const child of item.children) {
          if (child.path) return child.path;
        }
      }
    }
    return undefined;
  };

  // 中心级别菜单（左侧图标栏）
  const centerMenuItems: MenuItem[] = [
    { key: 'home', labelKey: 'sidebar.home', icon: <Home size={20} strokeWidth={2} />, path: '/' },
    {
      key: 'requirementsCenter',
      labelKey: 'sidebar.requirementsCenter',
      icon: <ClipboardList size={20} strokeWidth={2} />,
      path: '/requirements/list',
    },
    {
      key: 'developmentCenter',
      labelKey: 'sidebar.developmentCenter',
      icon: <Code size={20} strokeWidth={2} />,
    },
    {
      key: 'schedulingCenter',
      labelKey: 'sidebar.schedulingCenter',
      icon: <CalendarClock size={20} strokeWidth={2} />,
    },
    {
      key: 'operationsCenter',
      labelKey: 'sidebar.operationsCenter',
      icon: <BarChart3 size={20} strokeWidth={2} />,
    },
    {
      key: 'sharingCenter',
      labelKey: 'sidebar.sharingCenter',
      icon: <Share2 size={20} strokeWidth={2} />,
    },
    {
      key: 'maintenanceCenter',
      labelKey: 'sidebar.maintenanceCenter',
      icon: <Wrench size={20} strokeWidth={2} />,
      path: '/maintenance',
    },
  ];

  // 开发中心的详细菜单结构 - 使用分组标题样式
  const developmentCenterMenu: MenuItem[] = [
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
  ];

  // 调度中心的详细菜单结构 - 使用分组标题样式
  const schedulingCenterMenu: MenuItem[] = [
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
    { key: 'taskList', labelKey: 'sidebar.taskList', icon: <ClipboardList size={20} strokeWidth={2} />, path: '/scheduling-center/task-execution/task-list' },
  ];

  // 运营中心的详细菜单结构 - 使用分组标题样式
  const operationsCenterMenu: MenuItem[] = [
    // 数据分析 - 分组标题
    { key: 'dataAnalysis', labelKey: 'sidebar.dataAnalysis', isGroupLabel: true },
    { key: 'opsDashboard', labelKey: 'sidebar.opsDashboard', icon: <BarChart3 size={20} strokeWidth={2} />, path: '/operations/dashboard' },
    { key: 'roiAnalysis', labelKey: 'sidebar.roiAnalysis', icon: <TrendingUp size={20} strokeWidth={2} />, path: '/operations/roi-analysis' },
    { key: 'resourceEfficiency', labelKey: 'sidebar.resourceEfficiency', icon: <Activity size={20} strokeWidth={2} />, path: '/operations/resource-efficiency' },
    { key: 'businessOutcomes', labelKey: 'sidebar.businessOutcomes', icon: <Target size={20} strokeWidth={2} />, path: '/operations/business-outcomes' },
    // 运营管理 - 分组标题
    { key: 'operationsManagement', labelKey: 'sidebar.operationsManagement', isGroupLabel: true },
    { key: 'costManagement', labelKey: 'sidebar.costManagement', icon: <FileText size={20} strokeWidth={2} />, path: '/operations/cost-management' },
    { key: 'platformOperations', labelKey: 'sidebar.platformOperations', icon: <Settings size={20} strokeWidth={2} />, path: '/operations/platform-operations' },
  ];

  // 需求中心的详细菜单结构 - 使用分组标题样式
  const requirementsCenterMenu: MenuItem[] = [
    // 需求管理 - 分组标题
    { key: 'requirementsManagement', labelKey: 'sidebar.requirementsManagement', isGroupLabel: true },
    { key: 'requirementsList', labelKey: 'sidebar.requirementsList', icon: <ClipboardList size={20} strokeWidth={2} />, path: '/requirements/list' },
    { key: 'requirementsReview', labelKey: 'sidebar.requirementsReview', icon: <CheckSquare size={20} strokeWidth={2} />, path: '/requirements/review' },
    // 协作管理 - 分组标题
    { key: 'collaborationManagement', labelKey: 'sidebar.collaborationManagement', isGroupLabel: true },
    { key: 'teamMembers', labelKey: 'sidebar.teamMembers', icon: <Users size={20} strokeWidth={2} />, path: '/requirements/team' },
  ];

  // 运维中心的详细菜单结构 - 使用分组标题样式
  const maintenanceCenterMenu: MenuItem[] = [
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

  // 共享中心的详细菜单结构
  const sharingCenterMenu: MenuItem[] = [
    // 可执行组件 - 分组标题
    { key: 'executableComponents', labelKey: 'sidebar.executableComponents', isGroupLabel: true },
    { key: 'creatorComponents', labelKey: 'sidebar.creatorComponents', icon: <IconGridView />, path: '/sharing/components/creator' },
    // AI Skills - 分组标题
    { key: 'aiSkills', labelKey: 'sidebar.aiSkills', isGroupLabel: true },
    { key: 'apaSkills', labelKey: 'sidebar.apaSkills', icon: <Bot size={20} strokeWidth={2} />, path: '/sharing/skills/apa' },
    { key: 'acpSkills', labelKey: 'sidebar.acpSkills', icon: <Workflow size={20} strokeWidth={2} />, path: '/sharing/skills/acp' },
    // 案例展示 - 分组标题
    { key: 'showcasesGroup', labelKey: 'sidebar.showcasesGroup', isGroupLabel: true },
    { key: 'showcasesList', labelKey: 'sidebar.showcasesList', icon: <IconBookStroked />, path: '/sharing/showcases' },
  ];

  // 根据当前路由获取选中的菜单key
  const getSelectedKeyByPath = (pathname: string): string => {
    if (pathname.startsWith('/scheduling-center/resource-monitoring/worker-management')) {
      return 'workerManagement';
    }
    if (pathname === '/process-development') {
      return 'automationProcess';
    }
    if (pathname === '/') {
      return 'home';
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
    if (pathname.startsWith('/requirements/list')) {
      return 'requirementsList';
    }
    if (pathname.startsWith('/requirements/review')) {
      return 'requirementsReview';
    }
    if (pathname.startsWith('/requirements/team')) {
      return 'teamMembers';
    }
    if (pathname === '/operations/dashboard') {
      return 'opsDashboard';
    }
    if (pathname === '/operations/roi-analysis') {
      return 'roiAnalysis';
    }
    if (pathname === '/operations/resource-efficiency') {
      return 'resourceEfficiency';
    }
    if (pathname === '/operations/business-outcomes') {
      return 'businessOutcomes';
    }
    if (pathname === '/operations/cost-management') {
      return 'costManagement';
    }
    if (pathname === '/operations/platform-operations') {
      return 'platformOperations';
    }
    if (pathname === '/sharing/components/creator') {
      return 'creatorComponents';
    }
    if (pathname === '/sharing/skills/apa') {
      return 'apaSkills';
    }
    if (pathname === '/sharing/skills/acp') {
      return 'acpSkills';
    }
    if (pathname === '/sharing/showcases') {
      return 'showcasesList';
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
    const centerMenu = getCenterMenu(item.key);
    const targetPath = item.path || getFirstPathInMenu(centerMenu);
    if (targetPath) {
      navigate(targetPath);
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
      case 'sharingCenter':
        return sharingCenterMenu;
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
        <span className="sidebar-center-icon">{item.icon}</span>
        <span className="sidebar-center-icon">{item.icon}</span>
        <span className="sidebar-icon-btn-label">{label}</span>
      </div>
    );

    return (
      <div
        key={item.key}
        className="sidebar-icon-btn-wrapper"
        onMouseEnter={() => {
          if (collapsed && hasSubMenu && !disableHover) {
            setHoveredCenterKey(item.key);
          }
        }}
        onMouseLeave={() => {
          if (collapsed && hasSubMenu && !disableHover) {
            setHoveredCenterKey(null);
          }
        }}
      >
        {iconButton}

        {/* 收起时的浮动菜单 */}
        {collapsed && hasSubMenu && isHovered && (
          <div className="sidebar-floating-menu">
            <div className="sidebar-floating-menu-header">
              <span className="sidebar-floating-menu-title">{label}</span>
              <div
                className="sidebar-icon-btn-small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDetailPanel?.();
                }}
                title={t('sidebar.expandSidebar')}
              >
                <LayoutIcon />
              </div>
            </div>
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

    // 分组标题 - 与展开时保持一致的样式，不可选中
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
        <span className="sidebar-center-icon" style={{ position: 'relative' }}>
          {item.icon}
          {item.badge && <span className="sidebar-badge-dot" />}
        </span>
        {!collapsed && <span className="sidebar-icon-btn-label">{label}</span>}
      </div>
    );

    return (
      <div key={item.key}>
        {collapsed ? (
          <Tooltip content={label} position="right">
            {iconButton}
          </Tooltip>
        ) : (
          iconButton
        )}
      </div>
    );
  };

  // 获取当前中心的详细菜单
  const currentCenterMenu = getCenterMenu(activeCenterKey);
  const currentCenterLabel = centerMenuItems.find((item) => item.key === activeCenterKey)?.labelKey;

  return (
    <div className="sidebar">
      {/* 左侧图标栏 */}
      <div className={`sidebar-icon-bar ${!collapsed ? 'with-border' : ''} ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={laiyeLogo} alt="Laiye" className="sidebar-logo-img" />
          {!collapsed && <span className="sidebar-logo-title">数字员工平台</span>}
        </div>

        {/* 主菜单图标 */}
        <div className="sidebar-main-icons">{centerMenuItems.map(renderIconMenuItem)}</div>

        {/* 底部菜单图标 */}
        <div className="sidebar-bottom-icons">
          {/* 头像 + 消息铃铛 */}
          <div className={`sidebar-bottom-section ${collapsed ? 'collapsed' : ''}`}>
            {/* 用户头像 - 带下拉菜单 */}
            <Popover
              trigger="hover"
              position="rightBottom"
              showArrow={false}
              spacing={4}
              mouseLeaveDelay={100}
              mouseEnterDelay={0}
              content={
                <UserInfoDropdown
                  name="Ling hui"
                  username="alim huang"
                  companyName="来也科技股份有限公司有限..."
                  actions={[
                    {
                      key: 'admin',
                      label: t('sidebar.userMenu.adminConsole'),
                    },
                    {
                      key: 'settings',
                      label: t('sidebar.userMenu.personalCenter'),
                      onClick: () => navigate('/personal-center/personal-credentials'),
                    },
                    {
                      key: 'logout',
                      label: t('sidebar.userMenu.logout'),
                    },
                  ]}
                />
              }
            >
              <Avatar size="small" className="sidebar-avatar-user">
                L
              </Avatar>
            </Popover>

            {/* 消息铃铛 */}
            <div className="sidebar-bottom-bell">
              <Tooltip content={t('sidebar.notifications')} position="right" disabled={!collapsed}>
                <div className="sidebar-icon-btn-small" style={{ cursor: 'pointer' }}>
                  <IconBellStroked style={{ fontSize: 18 }} />
                </div>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* 拖拽手柄 */}
        <div
          className={`sidebar-drag-handle ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleDragStart}
        />
      </div>

      {/* 右侧详细菜单 - 由 detailPanelVisible 独立控制 */}
      {detailPanelVisible && currentCenterMenu.length > 0 && (
        <div className="sidebar-detail-panel">
          {/* 中心标题 */}
          <div className="sidebar-detail-header">
            <span className="sidebar-detail-title">{currentCenterLabel ? t(currentCenterLabel) : ''}</span>
            <div className="sidebar-icon-btn-small" onClick={onToggleDetailPanel} title={t('sidebar.collapseSidebar')}>
              <LayoutIcon />
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
