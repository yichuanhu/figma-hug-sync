/**
 * STORY-014 立项后字段编辑性约束
 *
 * - 系统锁定字段：任何状态下都不允许通过用户编辑流程修改
 * - 立项后阶段：除可编辑业务字段（title/description/priority/form_data）外，全部锁定
 */
import type { RequirementItem, RequirementStatus, ChangeType, ChangedFieldDiff } from '../types';

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

/**
 * 视为「DEV_IMPACT」（影响开发）的字段集合：
 * - priority：优先级变化通常会影响开发排期
 * - form_data 中的关键开发输入项：流程操作步骤 / 涉及系统 / 业务背景 / 操作类型 等
 */
const DEV_IMPACT_TOP = new Set<string>(['priority']);
const DEV_IMPACT_FORM_KEYS = new Set<string>([
  'operation_steps',
  'related_systems',
  'involved_systems',
  'business_context',
  'operation_type',
  'requirement_description',
]);

const isEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const sa = [...a].map(String).sort();
    const sb = [...b].map(String).sort();
    return sa.every((v, i) => v === sb[i]);
  }
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
};

/** 计算原始 vs 草稿/提交值之间的字段差异（仅顶层 + form_data 浅比较） */
export const computeFieldDiffs = (
  base: RequirementItem,
  patch: Partial<Pick<RequirementItem, 'title' | 'description' | 'priority' | 'form_data'>>,
): ChangedFieldDiff[] => {
  const diffs: ChangedFieldDiff[] = [];
  (['title', 'description', 'priority'] as const).forEach((k) => {
    if (patch[k] !== undefined && !isEqual(base[k], patch[k])) {
      diffs.push({ key: k, before: base[k], after: patch[k] });
    }
  });
  const baseForm = (base.form_data ?? {}) as Record<string, unknown>;
  const nextForm = (patch.form_data ?? {}) as Record<string, unknown>;
  if (patch.form_data !== undefined) {
    const keys = new Set([...Object.keys(baseForm), ...Object.keys(nextForm)]);
    keys.forEach((k) => {
      if (!isEqual(baseForm[k], nextForm[k])) {
        diffs.push({ key: `form.${k}`, before: baseForm[k], after: nextForm[k] });
      }
    });
  }
  return diffs;
};

/** 根据 diffs 推导变更类型 */
export const classifyChangeType = (diffs: ChangedFieldDiff[]): ChangeType => {
  if (diffs.length === 0) return 'CONTENT';
  for (const d of diffs) {
    if (DEV_IMPACT_TOP.has(d.key)) return 'DEV_IMPACT';
    if (d.key.startsWith('form.')) {
      const key = d.key.slice(5);
      if (DEV_IMPACT_FORM_KEYS.has(key)) return 'DEV_IMPACT';
    }
  }
  return 'CONTENT';
};

/** 是否超时（PENDING 且 > 7 天） */
export const isChangeLogOverdue = (publishedAt: string): boolean => {
  const t = new Date(publishedAt).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t > 7 * 24 * 60 * 60 * 1000;
};
