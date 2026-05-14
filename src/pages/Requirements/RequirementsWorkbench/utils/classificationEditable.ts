import type { RequirementStatus } from '@/pages/Requirements/RequirementsWorkbench/types';

/**
 * 分类标签可编辑的需求状态：草稿、已驳回、已撤回。
 * 进入待审批及之后任意状态后分类标签均不可修改。
 */
export const CLASSIFICATION_EDITABLE_STATUSES: RequirementStatus[] = [
  'DRAFT',
  'REJECTED',
  'WITHDRAWN',
];

export const isClassificationEditable = (status?: RequirementStatus): boolean => {
  if (!status) return true; // 新建态
  return CLASSIFICATION_EDITABLE_STATUSES.includes(status);
};
