import type { NavigateFunction } from 'react-router-dom';
import { Toast } from '@douyinfe/semi-ui';
import type { Notification } from '@/pages/NotificationCenter/types';

/**
 * 后端通知服务统一返回平台相对路径（/scheduling/tasks/{id} 等），
 * 前端按 APA Commander 实际路由进行映射跳转。
 * 所有跳转均会携带资源 ID 作为 URL 参数，目标页面读取后自动打开对应详情抽屉。
 */
const TASK_RE = /^\/scheduling\/tasks\/([^/?#]+)/;
const ROBOT_RE = /^\/scheduling\/robots\/([^/?#]+)/;
const TRIGGER_RE = /^\/scheduling\/triggers\/([^/?#]+)/;
const LICENSE_RE = /^\/admin\/licenses\/([^/?#]+)/;
const REQUIREMENT_RE = /^\/requirements\/([^/?#]+)(?:\?(.*))?$/;

export interface ResolvedLink {
  /** 是否可在 APA 内部跳转 */
  internal: boolean;
  /** 内部路由（含 query） */
  path?: string;
  /** 不可跳转时的占位提示 */
  fallbackMessage?: string;
}

/**
 * 解析通知跳转链接。可选传入 notification 用于辅助判断（如触发器类型）。
 */
export const resolveNotificationLink = (
  linkUrl: string,
  notification?: Notification,
): ResolvedLink => {
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
    // 通过 templateId 判断是时间触发器还是队列触发器
    const tplId = notification?.templateId || '';
    const tab = tplId.includes('queue') ? 'queueTrigger' : 'timeTrigger';
    return {
      internal: true,
      path: `/scheduling-center/task-execution/auto-execution-policy?tab=${tab}&triggerId=${encodeURIComponent(
        m[1],
      )}`,
    };
  }
  m = linkUrl.match(LICENSE_RE);
  if (m) {
    return {
      internal: false,
      fallbackMessage: '授权管理属于管理控制台范围，请前往管理后台查看授权详情',
    };
  }
  m = linkUrl.match(REQUIREMENT_RE);
  if (m) {
    const reqNo = m[1];
    if (reqNo === 'list') {
      return { internal: true, path: '/requirements/list' };
    }
    const params = new URLSearchParams(m[2] || '');
    const tab = params.get('tab');
    const qs = new URLSearchParams({ reqNo });
    if (tab) qs.set('tab', tab);
    return { internal: true, path: `/requirements/list?${qs.toString()}` };
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
  const resolved = resolveNotificationLink(notification.linkUrl, notification);
  if (resolved.internal && resolved.path) {
    navigate(resolved.path);
  } else {
    Toast.info(resolved.fallbackMessage || '暂不支持跳转');
  }
};
