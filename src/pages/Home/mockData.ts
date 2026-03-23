import type { ShortcutItem, MetricItem, NotificationItem, AnnouncementItem, BannerItem, ResourceItem, ActivityItem } from './types';

export const shortcuts: ShortcutItem[] = [
  {
    key: 'newProcess',
    titleKey: 'homepage.shortcuts.newProcess',
    descKey: 'homepage.shortcuts.newProcessDesc',
    icon: 'Workflow',
    color: '#7B8FE8',
    bgColor: '#F5F7FE',
    borderColor: '#D9DFFA',
    path: '/process-development',
  },
  {
    key: 'newRobot',
    titleKey: 'homepage.shortcuts.newRobot',
    descKey: 'homepage.shortcuts.newRobotDesc',
    icon: 'Bot',
    color: '#E8739A',
    bgColor: '#FEF5F8',
    borderColor: '#F8D5E0',
    path: '/scheduling-center/resource-monitoring/worker-management',
  },
  {
    key: 'createTask',
    titleKey: 'homepage.shortcuts.createTask',
    descKey: 'homepage.shortcuts.createTaskDesc',
    icon: 'Play',
    color: '#F5A25D',
    bgColor: '#FFF8F2',
    borderColor: '#FAE0C8',
    path: '/scheduling-center/task-execution/task-list',
  },
];

export const metrics: MetricItem[] = [
  { key: 'robots', labelKey: 'homepage.metrics.robots', value: 25, trend: 'up', trendValue: '+3', icon: 'Bot', iconColor: '#3370FF', iconBgColor: '#F5F8FF', borderColor: '#E0EAFF' },
  { key: 'processes', labelKey: 'homepage.metrics.processes', value: 120, trend: 'up', trendValue: '+8', icon: 'Workflow', iconColor: '#7C3AED', iconBgColor: '#F8F5FF', borderColor: '#EDE5FA' },
  { key: 'todayTasks', labelKey: 'homepage.metrics.todayTasks', value: 345, trend: 'up', trendValue: '+12%', icon: 'Play', iconColor: '#FF7D00', iconBgColor: '#FFF9F5', borderColor: '#FAEADB' },
  { key: 'successRate', labelKey: 'homepage.metrics.successRate', value: '98.5', unit: '%', trend: 'up', trendValue: '+0.3%', icon: 'CheckCircle', iconColor: '#00B365', iconBgColor: '#F3FBF7', borderColor: '#D5F0E3' },
  { key: 'savedHours', labelKey: 'homepage.metrics.savedHours', value: 156, unit: 'h', trend: 'up', trendValue: '+24h', icon: 'Clock', iconColor: '#0FC6C2', iconBgColor: '#F3FFFE', borderColor: '#D5F5F3' },
  { key: 'savedCost', labelKey: 'homepage.metrics.savedCost', value: '23', unit: '万', trend: 'up', trendValue: '+2.1万', icon: 'TrendingUp', iconColor: '#F54A45', iconBgColor: '#FFF7F7', borderColor: '#FAE0E0' },
  { key: 'weeklyNew', labelKey: 'homepage.metrics.weeklyNew', value: 12, trend: 'down', trendValue: '-3', icon: 'FolderPlus', iconColor: '#3370FF', iconBgColor: '#F5F8FF', borderColor: '#E0EAFF' },
];

export const notifications: NotificationItem[] = [
  { id: '1', titleKey: '', title: 'Process "Monthly Financial Report" execution failed', time: '10 min ago', read: false, type: 'error', priority: 'URGENT' },
  { id: '2', titleKey: '', title: 'Pending approval: Publish process "Data Sync"', time: '30 min ago', read: false, type: 'warning', priority: 'IMPORTANT' },
  { id: '3', titleKey: '', title: 'Robot "RPA-Worker-03" is offline', time: '1 hour ago', read: false, type: 'error', priority: 'URGENT' },
  { id: '4', titleKey: '', title: 'Process "Customer Data Cleansing" published successfully', time: '2 hours ago', read: true, type: 'success', priority: 'NORMAL' },
  { id: '5', titleKey: '', title: 'New version Creator v3.2.0 released', time: '3 hours ago', read: false, type: 'info', priority: 'NORMAL' },
  { id: '6', titleKey: '', title: 'Queue "Order Processing" message backlog alert', time: '4 hours ago', read: true, type: 'warning', priority: 'IMPORTANT' },
];

export const banners: BannerItem[] = [
  {
    id: '1',
    title: 'APA Creator 最新发布',
    subtitle: 'New process designer with powerful automation orchestration',
    version: 'v3.2.0',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: 'Palette',
    image: 'apa-creator-release',
  },
  {
    id: '2',
    title: 'APA Worker 最新发布',
    subtitle: 'Performance upgrade, supporting more automation scenarios',
    version: 'v2.8.0',
    gradient: 'linear-gradient(135deg, #2BC0E4 0%, #5B86E5 100%)',
    icon: 'Cpu',
    image: 'apa-worker-release',
  },
];

export const announcements: AnnouncementItem[] = [
  { id: '1', title: 'System Maintenance: Mar 15 02:00-06:00', subtitle: 'Platform will be down for maintenance, please plan ahead', time: '2026-03-12', priority: 'urgent' },
  { id: '2', title: '2026 Developer Contest Registration Open', subtitle: 'Win prizes and showcase your automation solutions', time: '2026-03-10', priority: 'important' },
  { id: '3', title: 'WEP Platform v4.5 Release Notes', subtitle: 'Multiple feature improvements and bug fixes', time: '2026-03-08', priority: 'normal' },
  { id: '4', title: 'Security Policy Update: Password Complexity Requirements', subtitle: 'Please update your password to comply with new policies', time: '2026-03-05', priority: 'important' },
];

export const resources: ResourceItem[] = [
  { id: '1', titleKey: '', title: 'Creator Download', descKey: '', desc: 'Process Designer Client', icon: 'Telescope', iconColor: '#3370FF', iconBgColor: '#EEF3FF', url: '#' },
  { id: '2', titleKey: '', title: 'User Manual', descKey: '', desc: 'Platform User Guide', icon: 'BookOpen', iconColor: '#7C3AED', iconBgColor: '#F3EEFF', url: '#' },
  { id: '3', titleKey: '', title: 'API Documentation', descKey: '', desc: 'Developer API Reference', icon: 'FileCode', iconColor: '#0FC6C2', iconBgColor: '#E8FFFE', url: '#' },
];

export const recentActivities: ActivityItem[] = [
  { id: '1', type: 'create', description: 'Created process', target: 'Auto Financial Report', time: 'Today 10:25' },
  { id: '2', type: 'execute', description: 'Executed task', target: 'Data Sync - Daily', time: 'Today 09:15' },
  { id: '3', type: 'publish', description: 'Published process', target: 'Customer Data Cleansing v2.1', time: 'Today 08:30' },
  { id: '4', type: 'update', description: 'Updated credentials', target: 'SAP-Production', time: 'Yesterday 17:45' },
  { id: '5', type: 'create', description: 'Created robot', target: 'RPA-Worker-05', time: 'Yesterday 16:20' },
  { id: '6', type: 'execute', description: 'Executed task', target: 'Email Notification - Batch', time: 'Yesterday 14:10' },
  { id: '7', type: 'delete', description: 'Deleted queue', target: 'Test Queue - Temp', time: 'Yesterday 11:30' },
  { id: '8', type: 'update', description: 'Updated parameters', target: 'Timeout Config - Global', time: 'Mar 11 09:00' },
  { id: '9', type: 'publish', description: 'Published process', target: 'Auto Order Review v1.3', time: 'Mar 10 15:40' },
  { id: '10', type: 'execute', description: 'Executed task', target: 'Inventory Audit - Weekly', time: 'Mar 10 10:00' },
];
