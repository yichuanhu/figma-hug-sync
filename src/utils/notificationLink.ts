import type { NavigateFunction } from 'react-router-dom';
import { Toast } from '@douyinfe/semi-ui';
import type { Notification } from '@/pages/NotificationCenter/types';

/**
 * 后端通知服务统一返回平台相对路径（/scheduling/tasks/{id} 等），
 * 前端按 APA Commander 实际路由进行映射跳转。
 */
const TASK_RE = /^\/scheduling\/tasks\/([^/?#]+)/;
const ROBOT_RE = /^\/scheduling\/robots\/([^/?#]+)/;
const TRIGGER_RE = /^\/scheduling\/triggers\/([^/?#]+)/;
const LICENSE_RE = /^\/admin\/licenses\/([^/?#]+)/;

export interface ResolvedLink {
  /** 是否可在 APA 内部跳转 */
  internal: boolean;
  /** 内部路由（含 query） */
  path?: string;
  /** 不可跳转时的占位提示 */
  fallbackMessage?: string;
}

export const resolveNotificationLink = (linkUrl: string): ResolvedLink => {
  if (!linkUrl) return { internal: false, fallbackMessage: '该通知暂无可跳转的详情页' };

  let m = linkUrl.match(TASK_RE);
  if (m) {
    return {
      internal: true,
      path: `/scheduling-center/task-execution/task-list?taskId=${encodeURIComponent(m[1])}`,
    };
  }
  m = linkUrl.match(ROBOT_RE);
  if (m) {
    return {
      internal: true,
      path: `/scheduling-center/resource-monitoring/worker-management?workerId=${encodeURIComponent(m[1])}`,
    };
  }
  m = linkUrl.match(TRIGGER_RE);
  if (m) {
    return {
      internal: false,
      fallbackMessage: '触发器详情页正在开发中，敬请期待',
    };
  }
  m = linkUrl.match(LICENSE_RE);
  if (m) {
    return {
      internal: false,
      fallbackMessage: '授权详情属于管理后台范围，请前往管理控制台查看',
    };
  }
  return { internal: false, fallbackMessage: '未识别的通知链接' };
};

/**
 * 统一处理：标记已读 -> 跳转或 toast。
 */
export const openNotification = (
  notification: Notification,
  navigate: NavigateFunction,
  onMarkRead?: (id: string) => void,
) => {
  if (!notification.read) onMarkRead?.(notification.id);
  const resolved = resolveNotificationLink(notification.linkUrl);
  if (resolved.internal && resolved.path) {
    navigate(resolved.path);
  } else {
    Toast.info(resolved.fallbackMessage || '暂不支持跳转');
  }
};
