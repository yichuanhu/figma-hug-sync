/**
 * 路由面包屑配置
 * 所有页面的面包屑统一由路由配置生成，禁止页面自定义
 */

export interface BreadcrumbItem {
  /** i18n key */
  labelKey: string;
  /** 点击跳转路径 */
  path?: string;
  /** 动态参数 key，从 URL params 或 BreadcrumbContext 中解析 */
  paramKey?: string;
}

export interface RouteConfig {
  path: string;
  breadcrumb: BreadcrumbItem[];
}

export const routeConfigs: RouteConfig[] = [
  // 首页 - 无面包屑
  { path: '/', breadcrumb: [] },

  // ==================== 开发中心 ====================
  {
    path: '/development-workbench',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.developmentCenter' },
      { labelKey: 'sidebar.developmentWorkbench' },
    ],
  },
  {
    path: '/process-development',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.developmentCenter' },
      { labelKey: 'sidebar.automationProcess' },
    ],
  },
  {
    path: '/dev-center/business-assets/credentials',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.developmentCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'credential.title' },
    ],
  },
  {
    path: '/dev-center/business-assets/parameters',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.developmentCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'parameter.title' },
    ],
  },
  {
    path: '/dev-center/business-assets/queues',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.developmentCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'queue.title' },
    ],
  },
  {
    path: '/dev-center/business-assets/queues/:queueId/messages',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.developmentCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'queue.title', path: '/dev-center/business-assets/queues' },
      { labelKey: '', paramKey: 'queueName' },
      { labelKey: 'queueMessage.title' },
    ],
  },
  {
    path: '/dev-center/business-assets/files',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.developmentCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'file.title' },
    ],
  },
  {
    path: '/dev-center/release-management',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.developmentCenter' },
      { labelKey: 'sidebar.publishManagement' },
    ],
  },
  {
    path: '/dev-center/release-management/create',
    breadcrumb: [
      { labelKey: 'sidebar.developmentCenter' },
      { labelKey: 'sidebar.publishManagement', path: '/dev-center/release-management' },
      { labelKey: 'release.create.title' },
    ],
  },

  // ==================== 调度中心 ====================
  {
    path: '/scheduling-workbench',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.schedulingWorkbench' },
    ],
  },
  {
    path: '/scheduling-center/resource-monitoring/worker-management',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.executionResourceMonitoring' },
      { labelKey: 'sidebar.workerManagement' },
    ],
  },
  {
    path: '/scheduling-center/business-assets/credentials',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'credential.title' },
    ],
  },
  {
    path: '/scheduling-center/business-assets/parameters',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'parameter.title' },
    ],
  },
  {
    path: '/scheduling-center/business-assets/queues',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'queue.title' },
    ],
  },
  {
    path: '/scheduling-center/business-assets/queues/:queueId/messages',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'queue.title', path: '/scheduling-center/business-assets/queues' },
      { labelKey: '', paramKey: 'queueName' },
      { labelKey: 'queueMessage.title' },
    ],
  },
  {
    path: '/scheduling-center/business-assets/files',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.businessAssetConfig' },
      { labelKey: 'file.title' },
    ],
  },
  {
    path: '/scheduling-center/execution-assets/automation-process',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.automationProcess' },
    ],
  },
  {
    path: '/scheduling-center/task-execution/task-list',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.taskExecution' },
      { labelKey: 'sidebar.taskList' },
    ],
  },
  {
    path: '/scheduling-center/task-execution/task-list/:executionId/logs',
    breadcrumb: [
      { labelKey: 'sidebar.taskList', path: '/scheduling-center/task-execution/task-list' },
      { labelKey: 'taskLog.title' },
    ],
  },
  {
    path: '/scheduling-center/task-execution/task-list/:executionId/recording',
    breadcrumb: [
      { labelKey: 'sidebar.taskList', path: '/scheduling-center/task-execution/task-list' },
      { labelKey: 'recording.title' },
    ],
  },
  {
    path: '/scheduling-center/task-execution/templates',
    breadcrumb: [
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.taskExecution' },
      { labelKey: 'sidebar.taskList', path: '/scheduling-center/task-execution/task-list' },
      { labelKey: 'template.pageTitle' },
    ],
  },
  {
    path: '/scheduling-center/task-execution/auto-execution-policy',
    breadcrumb: [
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.taskExecution' },
      { labelKey: 'sidebar.autoExecutionPolicy' },
    ],
  },
  {
    path: '/scheduling-center/task-execution/work-calendar',
    breadcrumb: [
      { labelKey: 'sidebar.schedulingCenter' },
      { labelKey: 'sidebar.taskExecution' },
      { labelKey: 'sidebar.autoExecutionPolicy', path: '/scheduling-center/task-execution/auto-execution-policy' },
      { labelKey: 'workCalendar.pageTitle' },
    ],
  },

  // ==================== 运营中心 ====================
  {
    path: '/operations-workbench',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.operationsCenter' },
      { labelKey: 'sidebar.operationsWorkbench' },
    ],
  },

  // ==================== 需求中心 ====================
  {
    path: '/requirements-workbench',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.requirementsCenter' },
      { labelKey: 'sidebar.requirementsWorkbench' },
    ],
  },

  // ==================== 运维中心 ====================
  {
    path: '/maintenance-workbench',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'sidebar.maintenanceCenter' },
      { labelKey: 'sidebar.maintenanceWorkbench' },
    ],
  },

  // ==================== 个人中心 ====================
  {
    path: '/personal-center',
    breadcrumb: [
      { labelKey: 'personalCenter.title' },
      { labelKey: 'personalCenter.tabs.personalCredentials' },
    ],
  },
  {
    path: '/personal-center/personal-credentials',
    breadcrumb: [
      { labelKey: 'personalCenter.title' },
      { labelKey: 'personalCenter.tabs.personalCredentials' },
    ],
  },
  {
    path: '/personal-center/settings',
    breadcrumb: [
      { labelKey: 'personalCenter.title' },
      { labelKey: 'personalCenter.tabs.settings' },
    ],
  },

  // ==================== 开发预览 ====================
  {
    path: '/dev-preview/empty-state',
    breadcrumb: [
      { labelKey: 'sidebar.home', path: '/' },
      { labelKey: 'breadcrumb.devPreview' },
      { labelKey: 'breadcrumb.emptyStatePreview' },
    ],
  },
];
