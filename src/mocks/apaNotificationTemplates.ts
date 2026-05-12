/**
 * FEAT-022 STORY-001：APA 双通道通知模板注册清单（mock）
 *
 * 范围：15 个模板（task 6 / robot 2 / trigger 1 / license 4 / requirement 2）。
 * 应用户要求剔除 `APA_REQUIREMENT_CHANGE_REJECTED`。
 *
 * 本文件仅以静态数据形式声明 APA 启动时向平台通知服务注册的模板内容；
 * Web 项目无对应 UI，仅供后端对齐 + 文档化使用。
 */

export type ApaNotificationCategory =
  | 'task'
  | 'robot'
  | 'trigger'
  | 'license'
  | 'requirement';

export type ApaNotificationChannel = 'IN_APP' | 'EMAIL';

export interface ApaTemplateLocaleString {
  'zh-CN': string;
  'en-US': string;
}

export interface ApaTemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'datetime';
  description: string;
}

export interface ApaNotificationTemplate {
  templateId: string;
  category: ApaNotificationCategory;
  channels: ApaNotificationChannel[];
  inAppTitle: ApaTemplateLocaleString;
  inAppContent: ApaTemplateLocaleString;
  emailSubject: ApaTemplateLocaleString;
  emailBodyHtml: ApaTemplateLocaleString;
  variables: ApaTemplateVariable[];
}

const wrapEmailHtml = (zh: string, en: string): ApaTemplateLocaleString => {
  const wrap = (body: string) =>
    `<table width="600" cellpadding="0" cellspacing="0" style="font-family:-apple-system,Segoe UI,sans-serif;color:#1f2329;font-size:14px;line-height:1.6;">` +
    `<tr><td style="padding:24px;background:#ffffff;border-radius:8px;border:1px solid #eaecef;">${body}</td></tr></table>`;
  return { 'zh-CN': wrap(zh), 'en-US': wrap(en) };
};

export const APA_NOTIFICATION_TEMPLATES: ApaNotificationTemplate[] = [
  // ===== task (6) =====
  {
    templateId: 'APA_TASK_FAILED',
    category: 'task',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': '任务执行失败', 'en-US': 'Task Failed' },
    inAppContent: {
      'zh-CN': '任务 {{taskName}} 在 {{processName}} 中执行失败',
      'en-US': 'Task {{taskName}} failed in {{processName}}',
    },
    emailSubject: {
      'zh-CN': '[APA 告警] 任务执行失败：{{taskName}}',
      'en-US': '[APA Alert] Task Failed: {{taskName}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>您的任务 <b>{{taskName}}</b> 执行失败。</p><p>流程：{{processName}}</p><p><a href="{{deepLink}}">查看详情</a></p>`,
      `<p>Your task <b>{{taskName}}</b> failed.</p><p>Process: {{processName}}</p><p><a href="{{deepLink}}">View details</a></p>`,
    ),
    variables: [
      { name: 'taskName', type: 'string', description: '任务名称' },
      { name: 'taskId', type: 'string', description: '任务 ID' },
      { name: 'processName', type: 'string', description: '流程名称' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_TASK_TIMEOUT',
    category: 'task',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': '任务执行超时', 'en-US': 'Task Timeout' },
    inAppContent: {
      'zh-CN': '任务 {{taskName}} 执行超过预设时长 {{timeoutDuration}}',
      'en-US': 'Task {{taskName}} exceeded timeout {{timeoutDuration}}',
    },
    emailSubject: {
      'zh-CN': '[APA 告警] 任务执行超时：{{taskName}}',
      'en-US': '[APA Alert] Task Timeout: {{taskName}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>任务 <b>{{taskName}}</b> 执行超时（{{timeoutDuration}}）。</p><p><a href="{{deepLink}}">查看详情</a></p>`,
      `<p>Task <b>{{taskName}}</b> timed out ({{timeoutDuration}}).</p><p><a href="{{deepLink}}">View details</a></p>`,
    ),
    variables: [
      { name: 'taskName', type: 'string', description: '任务名称' },
      { name: 'taskId', type: 'string', description: '任务 ID' },
      { name: 'timeoutDuration', type: 'string', description: '超时时长' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_TASK_PERMANENT_FAILED',
    category: 'task',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': '任务永久失败', 'en-US': 'Task Permanently Failed' },
    inAppContent: {
      'zh-CN': '任务 {{taskName}} 重试用尽，原因：{{failureReason}}',
      'en-US': 'Task {{taskName}} exhausted retries: {{failureReason}}',
    },
    emailSubject: {
      'zh-CN': '[APA 告警] 任务永久失败：{{taskName}}',
      'en-US': '[APA Alert] Task Permanently Failed: {{taskName}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>任务 <b>{{taskName}}</b> 已永久失败。</p><p>原因：{{failureReason}}</p><p><a href="{{deepLink}}">查看详情</a></p>`,
      `<p>Task <b>{{taskName}}</b> permanently failed.</p><p>Reason: {{failureReason}}</p><p><a href="{{deepLink}}">View details</a></p>`,
    ),
    variables: [
      { name: 'taskName', type: 'string', description: '任务名称' },
      { name: 'taskId', type: 'string', description: '任务 ID' },
      { name: 'failureReason', type: 'string', description: '失败原因' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_QUEUE_OVERDUE',
    category: 'task',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': '队列消息逾期', 'en-US': 'Queue Overdue' },
    inAppContent: {
      'zh-CN': '队列 {{queueName}} 中有 {{overdueCount}} 条消息逾期',
      'en-US': 'Queue {{queueName}} has {{overdueCount}} overdue messages',
    },
    emailSubject: {
      'zh-CN': '[APA 告警] 队列消息逾期：{{queueName}}',
      'en-US': '[APA Alert] Queue Overdue: {{queueName}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>队列 <b>{{queueName}}</b> 中有 <b>{{overdueCount}}</b> 条消息逾期。</p><p><a href="{{deepLink}}">查看详情</a></p>`,
      `<p>Queue <b>{{queueName}}</b> has <b>{{overdueCount}}</b> overdue messages.</p><p><a href="{{deepLink}}">View details</a></p>`,
    ),
    variables: [
      { name: 'queueName', type: 'string', description: '队列名称' },
      { name: 'queueId', type: 'string', description: '队列 ID' },
      { name: 'overdueCount', type: 'number', description: '逾期数量' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_TASK_SUCCESS',
    category: 'task',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': '任务执行成功', 'en-US': 'Task Succeeded' },
    inAppContent: {
      'zh-CN': '任务 {{taskName}} 执行成功，耗时 {{duration}}',
      'en-US': 'Task {{taskName}} succeeded in {{duration}}',
    },
    emailSubject: {
      'zh-CN': '[APA 通知] 任务执行成功：{{taskName}}',
      'en-US': '[APA Notice] Task Succeeded: {{taskName}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>任务 <b>{{taskName}}</b> 执行成功（{{duration}}）。</p><p><a href="{{deepLink}}">查看详情</a></p>`,
      `<p>Task <b>{{taskName}}</b> succeeded ({{duration}}).</p><p><a href="{{deepLink}}">View details</a></p>`,
    ),
    variables: [
      { name: 'taskName', type: 'string', description: '任务名称' },
      { name: 'taskId', type: 'string', description: '任务 ID' },
      { name: 'duration', type: 'string', description: '执行耗时' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_TASK_STOPPED',
    category: 'task',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': '任务已手动停止', 'en-US': 'Task Manually Stopped' },
    inAppContent: {
      'zh-CN': '任务 {{taskName}} 被 {{stoppedBy}} 手动停止',
      'en-US': 'Task {{taskName}} stopped by {{stoppedBy}}',
    },
    emailSubject: {
      'zh-CN': '[APA 通知] 任务已手动停止：{{taskName}}',
      'en-US': '[APA Notice] Task Stopped: {{taskName}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>任务 <b>{{taskName}}</b> 被 {{stoppedBy}} 手动停止。</p><p><a href="{{deepLink}}">查看详情</a></p>`,
      `<p>Task <b>{{taskName}}</b> was stopped by {{stoppedBy}}.</p><p><a href="{{deepLink}}">View details</a></p>`,
    ),
    variables: [
      { name: 'taskName', type: 'string', description: '任务名称' },
      { name: 'taskId', type: 'string', description: '任务 ID' },
      { name: 'stoppedBy', type: 'string', description: '停止操作人' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  // ===== robot (2) =====
  {
    templateId: 'APA_ROBOT_OFFLINE',
    category: 'robot',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': '机器人已离线', 'en-US': 'Robot Offline' },
    inAppContent: {
      'zh-CN': '机器人 {{robotName}} 自 {{offlineTime}} 起离线',
      'en-US': 'Robot {{robotName}} has been offline since {{offlineTime}}',
    },
    emailSubject: {
      'zh-CN': '[APA 告警] 机器人已离线：{{robotName}}',
      'en-US': '[APA Alert] Robot Offline: {{robotName}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>机器人 <b>{{robotName}}</b> 已离线（{{offlineTime}}）。</p><p><a href="{{deepLink}}">查看详情</a></p>`,
      `<p>Robot <b>{{robotName}}</b> is offline since {{offlineTime}}.</p><p><a href="{{deepLink}}">View details</a></p>`,
    ),
    variables: [
      { name: 'robotName', type: 'string', description: '机器人名称' },
      { name: 'robotId', type: 'string', description: '机器人 ID' },
      { name: 'offlineTime', type: 'datetime', description: '离线时间' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_ROBOT_MAINTENANCE',
    category: 'robot',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': '机器人进入维护模式', 'en-US': 'Robot Maintenance Mode' },
    inAppContent: {
      'zh-CN': '机器人 {{robotName}} 已进入维护模式',
      'en-US': 'Robot {{robotName}} entered maintenance mode',
    },
    emailSubject: {
      'zh-CN': '[APA 通知] 机器人进入维护模式：{{robotName}}',
      'en-US': '[APA Notice] Robot Maintenance: {{robotName}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>机器人 <b>{{robotName}}</b> 已进入维护模式。</p><p><a href="{{deepLink}}">查看详情</a></p>`,
      `<p>Robot <b>{{robotName}}</b> entered maintenance mode.</p><p><a href="{{deepLink}}">View details</a></p>`,
    ),
    variables: [
      { name: 'robotName', type: 'string', description: '机器人名称' },
      { name: 'robotId', type: 'string', description: '机器人 ID' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  // ===== trigger (1) =====
  {
    templateId: 'APA_TRIGGER_FAILED',
    category: 'trigger',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': '触发器执行失败', 'en-US': 'Trigger Failed' },
    inAppContent: {
      'zh-CN': '触发器 {{triggerName}} 执行失败：{{failureReason}}',
      'en-US': 'Trigger {{triggerName}} failed: {{failureReason}}',
    },
    emailSubject: {
      'zh-CN': '[APA 告警] 触发器执行失败：{{triggerName}}',
      'en-US': '[APA Alert] Trigger Failed: {{triggerName}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>触发器 <b>{{triggerName}}</b> 执行失败。</p><p>原因：{{failureReason}}</p><p><a href="{{deepLink}}">查看详情</a></p>`,
      `<p>Trigger <b>{{triggerName}}</b> failed.</p><p>Reason: {{failureReason}}</p><p><a href="{{deepLink}}">View details</a></p>`,
    ),
    variables: [
      { name: 'triggerName', type: 'string', description: '触发器名称' },
      { name: 'triggerId', type: 'string', description: '触发器 ID' },
      { name: 'failureReason', type: 'string', description: '失败原因' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  // ===== license (4) =====
  {
    templateId: 'APA_LICENSE_EXPIRING_30D',
    category: 'license',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': 'License 即将到期（30 天）', 'en-US': 'License Expiring in 30 Days' },
    inAppContent: {
      'zh-CN': '产品 {{productName}} 的 License 将于 {{expiryDate}} 到期',
      'en-US': 'License for {{productName}} expires on {{expiryDate}}',
    },
    emailSubject: {
      'zh-CN': '[APA 告警] License 将于 30 天后到期',
      'en-US': '[APA Alert] License Expiring in 30 Days',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>产品 <b>{{productName}}</b> 的 License 将于 <b>{{expiryDate}}</b> 到期。</p><p><a href="{{deepLink}}">立即续订</a></p>`,
      `<p>License for <b>{{productName}}</b> expires on <b>{{expiryDate}}</b>.</p><p><a href="{{deepLink}}">Renew now</a></p>`,
    ),
    variables: [
      { name: 'expiryDate', type: 'datetime', description: '到期日期' },
      { name: 'productName', type: 'string', description: '产品名' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_LICENSE_EXPIRING_7D',
    category: 'license',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': 'License 即将到期（7 天）', 'en-US': 'License Expiring in 7 Days' },
    inAppContent: {
      'zh-CN': '产品 {{productName}} 的 License 将于 {{expiryDate}} 到期',
      'en-US': 'License for {{productName}} expires on {{expiryDate}}',
    },
    emailSubject: {
      'zh-CN': '[APA 紧急告警] License 将于 7 天后到期',
      'en-US': '[APA Urgent] License Expiring in 7 Days',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p style="color:#d4380d">紧急：产品 <b>{{productName}}</b> License 将于 <b>{{expiryDate}}</b> 到期。</p><p><a href="{{deepLink}}">立即续订</a></p>`,
      `<p style="color:#d4380d">Urgent: License for <b>{{productName}}</b> expires on <b>{{expiryDate}}</b>.</p><p><a href="{{deepLink}}">Renew now</a></p>`,
    ),
    variables: [
      { name: 'expiryDate', type: 'datetime', description: '到期日期' },
      { name: 'productName', type: 'string', description: '产品名' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_LICENSE_EXPIRING_1D',
    category: 'license',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': 'License 明日到期', 'en-US': 'License Expires Tomorrow' },
    inAppContent: {
      'zh-CN': '产品 {{productName}} 的 License 将于明日 {{expiryDate}} 到期',
      'en-US': 'License for {{productName}} expires tomorrow ({{expiryDate}})',
    },
    emailSubject: {
      'zh-CN': '[APA 紧急告警] License 将于明日到期',
      'en-US': '[APA Urgent] License Expires Tomorrow',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p style="color:#d4380d">紧急：产品 <b>{{productName}}</b> License 将于明日 <b>{{expiryDate}}</b> 到期。</p><p><a href="{{deepLink}}">立即续订</a></p>`,
      `<p style="color:#d4380d">Urgent: License for <b>{{productName}}</b> expires tomorrow ({{expiryDate}}).</p><p><a href="{{deepLink}}">Renew now</a></p>`,
    ),
    variables: [
      { name: 'expiryDate', type: 'datetime', description: '到期日期' },
      { name: 'productName', type: 'string', description: '产品名' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_LICENSE_EXPIRED',
    category: 'license',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: { 'zh-CN': 'License 已到期', 'en-US': 'License Expired' },
    inAppContent: {
      'zh-CN': '产品 {{productName}} 的 License 已于 {{expiryDate}} 到期，服务中断',
      'en-US': 'License for {{productName}} expired on {{expiryDate}}; service interrupted',
    },
    emailSubject: {
      'zh-CN': '[APA 紧急告警] License 已到期，服务中断',
      'en-US': '[APA Urgent] License Expired — Service Interrupted',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p style="color:#cf1322">产品 <b>{{productName}}</b> License 已于 <b>{{expiryDate}}</b> 到期，服务中断。</p><p><a href="{{deepLink}}">立即续订</a></p>`,
      `<p style="color:#cf1322">License for <b>{{productName}}</b> expired on <b>{{expiryDate}}</b>; service interrupted.</p><p><a href="{{deepLink}}">Renew now</a></p>`,
    ),
    variables: [
      { name: 'expiryDate', type: 'datetime', description: '到期日期' },
      { name: 'productName', type: 'string', description: '产品名' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  // ===== requirement (2) — 已剔除 APA_REQUIREMENT_CHANGE_REJECTED =====
  {
    templateId: 'APA_REQUIREMENT_DEV_IMPACT_CHANGE',
    category: 'requirement',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: {
      'zh-CN': '需求"{{requirementTitle}}"发布了影响开发的变更',
      'en-US': 'Requirement "{{requirementTitle}}" published a dev-impact change',
    },
    inAppContent: {
      'zh-CN': '{{publisherName}} 于 {{publishedAt}} 发布变更：{{changedFieldsSummary}}',
      'en-US': '{{publisherName}} published at {{publishedAt}}: {{changedFieldsSummary}}',
    },
    emailSubject: {
      'zh-CN': '[APA 通知] 需求变更影响开发：{{requirementTitle}}',
      'en-US': '[APA Notice] Dev-impact change: {{requirementTitle}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>需求 <b>{{requirementTitle}}</b> 发布了影响开发的变更。</p><p>变更说明：{{changeReason}}</p><p>变更字段：{{changedFieldsSummary}}</p><p><a href="{{deepLink}}">查看变更详情</a></p>`,
      `<p>Requirement <b>{{requirementTitle}}</b> published a dev-impact change.</p><p>Reason: {{changeReason}}</p><p>Fields: {{changedFieldsSummary}}</p><p><a href="{{deepLink}}">View change</a></p>`,
    ),
    variables: [
      { name: 'requirementTitle', type: 'string', description: '需求标题' },
      { name: 'requirementId', type: 'string', description: '需求 ID' },
      { name: 'changeReason', type: 'string', description: '变更说明' },
      { name: 'changedFieldsSummary', type: 'string', description: '字段摘要' },
      { name: 'publisherName', type: 'string', description: '发布人' },
      { name: 'publishedAt', type: 'datetime', description: '发布时间' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
  {
    templateId: 'APA_REQUIREMENT_DEV_SCHEME_DOC_UPLOADED',
    category: 'requirement',
    channels: ['IN_APP', 'EMAIL'],
    inAppTitle: {
      'zh-CN': '需求"{{requirementTitle}}"的开发方案已更新',
      'en-US': 'Dev scheme updated for "{{requirementTitle}}"',
    },
    inAppContent: {
      'zh-CN': '{{uploaderName}} 于 {{uploadedAt}} 上传了 v{{docVersion}}：{{fileName}}',
      'en-US': '{{uploaderName}} uploaded v{{docVersion}} ({{fileName}}) at {{uploadedAt}}',
    },
    emailSubject: {
      'zh-CN': '[APA 通知] 开发方案已上传：{{requirementTitle}}',
      'en-US': '[APA Notice] Dev scheme uploaded: {{requirementTitle}}',
    },
    emailBodyHtml: wrapEmailHtml(
      `<p>需求 <b>{{requirementTitle}}</b> 的开发方案已更新到 <b>v{{docVersion}}</b>。</p>` +
        `<ul><li>文件：{{fileName}}</li><li>上传人：{{uploaderName}}</li><li>上传时间：{{uploadedAt}}</li></ul>` +
        `<p><a href="{{deepLink}}">打开方案文档</a></p>`,
      `<p>Dev scheme for <b>{{requirementTitle}}</b> was updated to <b>v{{docVersion}}</b>.</p>` +
        `<ul><li>File: {{fileName}}</li><li>Uploader: {{uploaderName}}</li><li>Uploaded at: {{uploadedAt}}</li></ul>` +
        `<p><a href="{{deepLink}}">Open scheme document</a></p>`,
    ),
    variables: [
      { name: 'requirementTitle', type: 'string', description: '需求标题' },
      { name: 'requirementId', type: 'string', description: '需求 ID' },
      { name: 'docVersion', type: 'number', description: '版本号' },
      { name: 'fileName', type: 'string', description: '文件名' },
      { name: 'uploaderName', type: 'string', description: '上传人' },
      { name: 'uploadedAt', type: 'datetime', description: '上传时间' },
      { name: 'deepLink', type: 'string', description: '深链' },
    ],
  },
];

/** 模拟 APA 启动时调用平台 register 接口的返回 */
export const registerAllApaTemplates = async (): Promise<{
  registeredCount: number;
  updatedCount: number;
  failedCount: number;
}> => {
  await new Promise((r) => setTimeout(r, 200));
  return { registeredCount: 0, updatedCount: APA_NOTIFICATION_TEMPLATES.length, failedCount: 0 };
};

export const getApaTemplate = (templateId: string): ApaNotificationTemplate | undefined =>
  APA_NOTIFICATION_TEMPLATES.find((t) => t.templateId === templateId);
