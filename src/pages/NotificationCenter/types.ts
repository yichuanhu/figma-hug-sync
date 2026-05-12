export type NotificationCategory = 'task' | 'robot' | 'trigger' | 'license' | 'requirement';
export type NotificationSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type NotificationTemplateId =
  | 'task.failed'
  | 'task.timeout'
  | 'task.permanent_failed'
  | 'task.queue_overdue'
  | 'task.success'
  | 'task.stopped'
  | 'robot.offline'
  | 'robot.recovered'
  | 'robot.maintenance'
  | 'trigger.time_failed'
  | 'trigger.queue_invalid'
  | 'license.expiring'
  | 'license.expired'
  | 'APA_REQUIREMENT_CHANGED'
  | 'APA_REQUIREMENT_DEV_SCHEME_DOC_UPLOADED';

export interface Notification {
  id: string;
  templateId: NotificationTemplateId;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  description: string;
  /** 后端给定相对路径，由前端 notificationLink.ts 适配为 APA 路由 */
  linkUrl: string;
  /** ISO-8601 */
  createdAt: string;
  read: boolean;
  variables?: Record<string, string>;
}

export type NotificationReadFilter = 'all' | 'unread';
