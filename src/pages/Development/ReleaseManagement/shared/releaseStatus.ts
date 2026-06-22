/**
 * 发布单业务状态展示规则（统一入口）
 *
 * | publish_status     | audit_status | failure_code                       | 文案     | 颜色 |
 * |--------------------|--------------|------------------------------------|----------|------|
 * | PENDING_APPROVAL   | PENDING      | -                                  | 待审批   | blue |
 * | SUCCESS            | APPROVED/-   | -                                  | 已发布   | green|
 * | REJECTED           | REJECTED     | -                                  | 已拒绝   | red  |
 * | FAILED             | APPROVED     | PROCESS_ARCHIVED_BEFORE_PUBLISH    | 已失效   | grey |
 * | FAILED             | *            | 其他                                | 发布失败 | red  |
 */
import type { LYReleaseResponse } from '@/api';

export type ReleaseStatusColor = 'blue' | 'green' | 'red' | 'grey';

export interface ReleaseStatusDisplay {
  color: ReleaseStatusColor;
  text: string;
  /** 文字说明，用于卡片/工具提示 */
  detail?: string;
}

export const getReleaseStatusDisplay = (
  release: Pick<LYReleaseResponse, 'publish_status' | 'audit_status' | 'failure_code' | 'failure_reason' | 'reject_reason' | 'error_message'>,
): ReleaseStatusDisplay => {
  switch (release.publish_status) {
    case 'PENDING_APPROVAL':
      return { color: 'blue', text: '待审批' };
    case 'SUCCESS':
      return { color: 'green', text: '已发布' };
    case 'REJECTED':
      return { color: 'red', text: '已拒绝', detail: release.reject_reason || undefined };
    case 'FAILED':
      if (release.failure_code === 'PROCESS_ARCHIVED_BEFORE_PUBLISH') {
        return { color: 'grey', text: '已失效', detail: '审批已通过，发布申请已失效 / 流程已归档' };
      }
      return { color: 'red', text: '发布失败', detail: release.failure_reason || release.error_message || undefined };
    default:
      return { color: 'grey', text: '-' };
  }
};

/** 审批状态展示（用于审批列表副 Tag） */
export const getAuditStatusDisplay = (audit?: LYReleaseResponse['audit_status']): ReleaseStatusDisplay | null => {
  if (!audit) return null;
  switch (audit) {
    case 'PENDING':
      return { color: 'blue', text: '审批中' };
    case 'APPROVED':
      return { color: 'green', text: '审批通过' };
    case 'REJECTED':
      return { color: 'red', text: '审批拒绝' };
    default:
      return null;
  }
};

/** 流程跳转分流：依据发布单状态选择目标 */
export const getProcessRouteForRelease = (
  release: Pick<LYReleaseResponse, 'publish_status' | 'failure_code'>,
  processId: string,
): { href: string | null; disabledReason?: string } => {
  if (release.publish_status === 'FAILED' && release.failure_code === 'PROCESS_ARCHIVED_BEFORE_PUBLISH') {
    return { href: null, disabledReason: '发布申请已失效 / 流程已归档' };
  }
  if (release.publish_status === 'SUCCESS') {
    return { href: `/scheduling-center/automation-process?processId=${processId}` };
  }
  return { href: `/dev-center/automation-process?processId=${processId}` };
};
