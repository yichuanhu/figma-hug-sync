import { Outlet } from 'react-router-dom';
import ProcessDevelopment from '@/pages/Development/ProcessDevelopment';
import ProcessDetail from '@/pages/Development/ProcessDevelopment/ProcessDetail';
import DevelopmentWorkbench from '@/pages/Development/DevelopmentWorkbench';
import WorkerManagement from '@/pages/Operations/WorkerManagement';
import WorkerCreate from '@/pages/Operations/WorkerManagement/WorkerCreate';
import WorkerEdit from '@/pages/Operations/WorkerManagement/WorkerEdit';
import OperationsWorkbench from '@/pages/Operations/OperationsWorkbench';
import SchedulingWorkbench from '@/pages/Scheduling/SchedulingWorkbench';
import RequirementsWorkbench from '@/pages/Requirements/RequirementsWorkbench';
import MaintenanceWorkbench from '@/pages/Maintenance/MaintenanceWorkbench';

// 路由元数据类型
export interface RouteMeta {
  title: string;
}

// 扩展路由对象类型
export interface AppRouteObject {
  path?: string;
  element?: React.ReactNode;
  meta?: RouteMeta;
  children?: AppRouteObject[];
}

// 路由配置（支持多级嵌套结构）
const routes: AppRouteObject[] = [
  // 首页 - 默认跳转到开发中心的自动化流程
  {
    path: '/',
    element: <ProcessDevelopment />,
    meta: { title: '首页' },
  },
  // 开发中心
  {
    path: '/dev',
    meta: { title: '开发中心' },
    element: <Outlet />,
    children: [
      {
        path: 'workbench',
        element: <DevelopmentWorkbench />,
        meta: { title: '工作台' },
      },
      {
        path: 'task-mgmt',
        meta: { title: '开发任务管理' },
        element: <Outlet />,
        children: [
          {
            path: 'process-development',
            element: <ProcessDevelopment />,
            meta: { title: '自动化流程' },
          },
          {
            path: 'process-detail/:id',
            element: <ProcessDetail />,
            meta: { title: '流程详情' },
          },
        ],
      },
    ],
  },
  // 运营中心
  {
    path: '/ops',
    meta: { title: '运营中心' },
    element: <Outlet />,
    children: [
      {
        path: 'workbench',
        element: <OperationsWorkbench />,
        meta: { title: '工作台' },
      },
      {
        path: 'asset-mgmt',
        meta: { title: '能力资产管理' },
        element: <Outlet />,
        children: [
          {
            path: 'worker-management',
            element: <WorkerManagement />,
            meta: { title: '流程机器人管理' },
          },
          {
            path: 'worker-management/create',
            element: <WorkerCreate />,
            meta: { title: '创建机器人' },
          },
          {
            path: 'worker-management/edit/:id',
            element: <WorkerEdit />,
            meta: { title: '编辑机器人' },
          },
        ],
      },
    ],
  },
  // 调度中心
  {
    path: '/scheduling',
    meta: { title: '调度中心' },
    element: <Outlet />,
    children: [
      {
        path: 'workbench',
        element: <SchedulingWorkbench />,
        meta: { title: '工作台' },
      },
    ],
  },
  // 需求中心
  {
    path: '/requirements',
    meta: { title: '需求中心' },
    element: <Outlet />,
    children: [
      {
        path: 'workbench',
        element: <RequirementsWorkbench />,
        meta: { title: '工作台' },
      },
    ],
  },
  // 运维中心
  {
    path: '/maintenance',
    meta: { title: '运维中心' },
    element: <Outlet />,
    children: [
      {
        path: 'workbench',
        element: <MaintenanceWorkbench />,
        meta: { title: '工作台' },
      },
    ],
  },
];

export default routes;
