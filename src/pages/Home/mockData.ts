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
  { key: 'robots', labelKey: 'homepage.metrics.robots', value: 25, trend: 'up', trendValue: '+3', icon: 'Bot', iconColor: '#3370FF', iconBgColor: '#EEF3FF' },
  { key: 'processes', labelKey: 'homepage.metrics.processes', value: 120, trend: 'up', trendValue: '+8', icon: 'Workflow', iconColor: '#7C3AED', iconBgColor: '#F3EEFF' },
  { key: 'todayTasks', labelKey: 'homepage.metrics.todayTasks', value: 345, trend: 'up', trendValue: '+12%', icon: 'Play', iconColor: '#FF7D00', iconBgColor: '#FFF3E8' },
  { key: 'successRate', labelKey: 'homepage.metrics.successRate', value: '98.5', unit: '%', trend: 'up', trendValue: '+0.3%', icon: 'CheckCircle', iconColor: '#00B365', iconBgColor: '#E8F8F0' },
  { key: 'savedHours', labelKey: 'homepage.metrics.savedHours', value: 156, unit: 'h', trend: 'up', trendValue: '+24h', icon: 'Clock', iconColor: '#0FC6C2', iconBgColor: '#E8FFFE' },
  { key: 'savedCost', labelKey: 'homepage.metrics.savedCost', value: '23', unit: '万', trend: 'up', trendValue: '+2.1万', icon: 'TrendingUp', iconColor: '#F54A45', iconBgColor: '#FFF0F0' },
  { key: 'weeklyNew', labelKey: 'homepage.metrics.weeklyNew', value: 12, trend: 'down', trendValue: '-3', icon: 'FolderPlus', iconColor: '#3370FF', iconBgColor: '#EEF3FF' },
];

export const notifications: NotificationItem[] = [
  { id: '1', titleKey: '', title: '流程「财务月报生成」执行失败', time: '10分钟前', read: false, type: 'error' },
  { id: '2', titleKey: '', title: '审批请求待处理：发布流程「数据同步」', time: '30分钟前', read: false, type: 'warning' },
  { id: '3', titleKey: '', title: '机器人「RPA-Worker-03」已离线', time: '1小时前', read: false, type: 'error' },
  { id: '4', titleKey: '', title: '流程「客户数据清洗」发布成功', time: '2小时前', read: true, type: 'success' },
  { id: '5', titleKey: '', title: '新版本 Creator v3.2.0 已发布', time: '3小时前', read: false, type: 'info' },
  { id: '6', titleKey: '', title: '队列「订单处理」消息积压告警', time: '4小时前', read: true, type: 'warning' },
];

export const banners: BannerItem[] = [
  {
    id: '1',
    title: 'APA Creator 最新发布',
    subtitle: '全新流程设计器，更强大的自动化编排能力',
    version: 'v3.2.0',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: 'Palette',
  },
  {
    id: '2',
    title: 'APA Worker 最新发布',
    subtitle: '性能优化升级，支持更多自动化场景',
    version: 'v2.8.0',
    gradient: 'linear-gradient(135deg, #2BC0E4 0%, #5B86E5 100%)',
    icon: 'Cpu',
  },
];

export const announcements: AnnouncementItem[] = [
  { id: '1', title: '系统维护通知：3月15日 02:00-06:00', subtitle: '届时平台将暂停服务，请提前做好准备', time: '2026-03-12', priority: 'urgent' },
  { id: '2', title: '2026 开发者大赛报名开启', subtitle: '参与赢取丰厚奖品，展示你的自动化方案', time: '2026-03-10', priority: 'important' },
  { id: '3', title: 'WEP 平台 v4.5 版本更新说明', subtitle: '新增多项功能优化和问题修复', time: '2026-03-08', priority: 'normal' },
  { id: '4', title: '安全策略更新：密码复杂度要求调整', subtitle: '请及时更新密码以符合新规范', time: '2026-03-05', priority: 'important' },
];

export const resources: ResourceItem[] = [
  { id: '1', titleKey: '', title: 'Creator 下载', descKey: '', desc: '流程设计器客户端', icon: 'Telescope', iconColor: '#3370FF', iconBgColor: '#EEF3FF', url: '#' },
  { id: '2', titleKey: '', title: '用户手册', descKey: '', desc: '平台使用指南', icon: 'BookOpen', iconColor: '#7C3AED', iconBgColor: '#F3EEFF', url: '#' },
  { id: '3', titleKey: '', title: 'API 文档', descKey: '', desc: '开发者接口参考', icon: 'FileCode', iconColor: '#0FC6C2', iconBgColor: '#E8FFFE', url: '#' },
];

export const recentActivities: ActivityItem[] = [
  { id: '1', type: 'create', description: '创建流程', target: '财务报表自动生成', time: '今天 10:25' },
  { id: '2', type: 'execute', description: '执行任务', target: '数据同步-每日', time: '今天 09:15' },
  { id: '3', type: 'publish', description: '发布流程', target: '客户数据清洗 v2.1', time: '今天 08:30' },
  { id: '4', type: 'update', description: '更新凭据', target: 'SAP-Production', time: '昨天 17:45' },
  { id: '5', type: 'create', description: '创建机器人', target: 'RPA-Worker-05', time: '昨天 16:20' },
  { id: '6', type: 'execute', description: '执行任务', target: '邮件通知-批量发送', time: '昨天 14:10' },
  { id: '7', type: 'delete', description: '删除队列', target: '测试队列-临时', time: '昨天 11:30' },
  { id: '8', type: 'update', description: '更新参数', target: '超时配置-全局', time: '3月11日 09:00' },
  { id: '9', type: 'publish', description: '发布流程', target: '订单自动审核 v1.3', time: '3月10日 15:40' },
  { id: '10', type: 'execute', description: '执行任务', target: '库存盘点-周报', time: '3月10日 10:00' },
];
