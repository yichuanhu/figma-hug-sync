/**
 * STORY-014 立项后字段编辑性约束
 *
 * - 系统锁定字段：任何状态下都不允许通过用户编辑流程修改
 * - 立项后阶段：除可编辑业务字段（title/description/priority/form_data）外，全部锁定
 */
import type { RequirementStatus } from '../types';

export const POST_PROJECT_STATUSES: RequirementStatus[] = [
  'PENDING_PROJECT',
  'DEVELOPING',
  'LAUNCHED',
  'OFFLINE',
];

export const isPostProjectStatus = (status: RequirementStatus): boolean =>
  POST_PROJECT_STATUSES.includes(status);

/** 立项后系统锁定字段（不可编辑） */
export const SYSTEM_LOCKED_FIELDS = new Set<string>([
  'id',
  'req_no',
  'status',
  'scheme_id',
  'scheme_version',
  'owning_department_id',
  'owning_department_name',
  'owner_id',
  'owner_name',
  'creatorId',
  'createdAt',
  'updatedAt',
]);

/** 立项后允许编辑的业务字段（顶层） */
export const POST_PROJECT_EDITABLE_TOP = new Set<string>([
  'title',
  'description',
  'priority',
  'form_data',
]);

export const isFieldEditableInPostProject = (key: string): boolean =>
  POST_PROJECT_EDITABLE_TOP.has(key);

/** 是否超时（PENDING 且 > 7 天） */
export const isChangeLogOverdue = (publishedAt: string): boolean => {
  const t = new Date(publishedAt).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t > 7 * 24 * 60 * 60 * 1000;
};
