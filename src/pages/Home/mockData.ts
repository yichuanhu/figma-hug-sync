import type { ShortcutItem, MetricItem, NotificationItem, AnnouncementItem, ResourceItem, ActivityItem } from './types';

export const shortcuts: ShortcutItem[] = [
  {
    key: 'newProcess',
    titleKey: 'homepage.shortcuts.newProcess',
    descKey: 'homepage.shortcuts.newProcessDesc',
    icon: 'Workflow',
    color: 'var(--semi-color-primary)',
    bgColor: 'rgba(var(--semi-blue-0), 1)',
    path: '/process-development',
  },
  {
    key: 'newRobot',
    titleKey: 'homepage.shortcuts.newRobot',
    descKey: 'homepage.shortcuts.newRobotDesc',
    icon: 'Bot',
    color: 'rgba(var(--semi-purple-5), 1)',
    bgColor: 'rgba(var(--semi-purple-0), 1)',
    path: '/scheduling-center/resource-monitoring/worker-management',
  },
  {
    key: 'createTask',
    titleKey: 'homepage.shortcuts.createTask',
    descKey: 'homepage.shortcuts.createTaskDesc',
    icon: 'Play',
    color: 'rgba(var(--semi-orange-5), 1)',
    bgColor: 'rgba(var(--semi-orange-0), 1)',
    path: '/scheduling-center/task-execution/task-list',
  },
  {
    key: 'queueManagement',
    titleKey: 'homepage.shortcuts.queueManagement',
    descKey: 'homepage.shortcuts.queueManagementDesc',
    icon: 'ListStart',
    color: 'rgba(var(--semi-teal-5), 1)',
    bgColor: 'rgba(var(--semi-teal-0), 1)',
    path: '/dev-center/business-assets/queues',
  },
];

export const metrics: MetricItem[] = [
  { key: 'robots', labelKey: 'homepage.metrics.robots', value: 25, trend: 'up', trendValue: '+3' },
  { key: 'processes', labelKey: 'homepage.metrics.processes', value: 120, trend: 'up', trendValue: '+8' },
  { key: 'todayTasks', labelKey: 'homepage.metrics.todayTasks', value: 345, trend: 'up', trendValue: '+12%' },
  { key: 'successRate', labelKey: 'homepage.metrics.successRate', value: '98.5', unit: '%', trend: 'up', trendValue: '+0.3%' },
  { key: 'savedHours', labelKey: 'homepage.metrics.savedHours', value: 156, unit: 'h', trend: 'up', trendValue: '+24h' },
  { key: 'savedCost', labelKey: 'homepage.metrics.savedCost', value: '23', unit: '万', trend: 'up', trendValue: '+2.1万' },
  { key: 'weeklyNew', labelKey: 'homepage.metrics.weeklyNew', value: 12, trend: 'down', trendValue: '-3' },
];

export const notifications: NotificationItem[] = [
  { id: '1', titleKey: '', title: '流程「财务月报生成」执行失败', time: '10分钟前', read: false, type: 'error' },
  { id: '2', titleKey: '', title: '审批请求待处理：发布流程「数据同步」', time: '30分钟前', read: false, type: 'warning' },
  { id: '3', titleKey: '', title: '机器人「RPA-Worker-03」已离线', time: '1小时前', read: false, type: 'error' },
  { id: '4', titleKey: '', title: '流程「客户数据清洗」发布成功', time: '2小时前', read: true, type: 'success' },
  { id: '5', titleKey: '', title: '新版本 Creator v3.2.0 已发布', time: '3小时前', read: false, type: 'info' },
  { id: '6', titleKey: '', title: '队列「订单处理」消息积压告警', time: '4小时前', read: true, type: 'warning' },
];

export const announcements: AnnouncementItem[] = [
  { id: '1', title: '系统维护通知：3月15日 02:00-06:00', time: '2026-03-12', priority: 'urgent' },
  { id: '2', title: '2026 开发者大赛报名开启', time: '2026-03-10', priority: 'important' },
  { id: '3', title: 'WEP 平台 v4.5 版本更新说明', time: '2026-03-08', priority: 'normal' },
  { id: '4', title: '安全策略更新：密码复杂度要求调整', time: '2026-03-05', priority: 'important' },
];

export const resources: ResourceItem[] = [
  { id: '1', titleKey: '', title: 'Creator 下载', descKey: '', desc: '流程设计器客户端', icon: 'Download', url: '#' },
  { id: '2', titleKey: '', title: '用户手册', descKey: '', desc: '平台使用指南', icon: 'BookOpen', url: '#' },
  { id: '3', titleKey: '', title: 'API 文档', descKey: '', desc: '开发者接口参考', icon: 'FileCode', url: '#' },
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
];
