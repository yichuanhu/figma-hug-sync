/**
 * FEAT-022 STORY-001 派发占位：上传等业务事件触发 APA 通知时调用本方法。
 * 当前 mock 行为：将通知写入通知中心 store 并返回。不发真邮件。
 */
import { mockNotifications } from '@/pages/NotificationCenter/mockData';
import { getApaTemplate } from './apaNotificationTemplates';
import type { Notification, NotificationTemplateId } from '@/pages/NotificationCenter/types';

export interface DispatchInput {
  templateId: string;
  recipients: string[];
  requestId: string;
  variables: Record<string, string>;
}

const renderTemplate = (tpl: string, vars: Record<string, string>): string =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);

const REQUIREMENT_LINK = (reqId: string) =>
  `/requirements/list?openDrawer=${reqId}&tab=devScheme`;

export const dispatchApaNotification = (input: DispatchInput): void => {
  const tpl = getApaTemplate(input.templateId);
  if (!tpl) {
    console.warn('[APA Dispatch] template not found:', input.templateId);
    return;
  }
  // 仅注入到通知中心样例（IN_APP 通道），EMAIL 通道为契约占位。
  const note: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    templateId: input.templateId as NotificationTemplateId,
    category: tpl.category,
    severity: 'LOW',
    title: renderTemplate(tpl.inAppTitle['zh-CN'], input.variables),
    description: renderTemplate(tpl.inAppContent['zh-CN'], input.variables),
    linkUrl: input.variables.requirementId
      ? REQUIREMENT_LINK(input.variables.requirementId)
      : '/notifications',
    createdAt: new Date().toISOString(),
    read: false,
    variables: input.variables,
  };
  mockNotifications.unshift(note);
};
