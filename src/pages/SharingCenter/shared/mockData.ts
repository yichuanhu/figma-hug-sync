/**
 * 共享中心 - 我的共享 / 审批管理 共用 Mock 数据
 * 现在统一委托给 MyShared/store 单例（含可变状态）。
 */
import { getAll, getMine, findAsset, currentUser, type ShareAsset } from '@/pages/SharingCenter/MyShared/store';
import type { ShareStatus } from '@/components/sharing/StatusTag';

export type { ShareAsset };

export function getShareAssets(): ShareAsset[] { return getAll(); }

export function getMyShared(status?: ShareStatus): ShareAsset[] {
  const list = getMine();
  return status ? list.filter((a) => a.shareStatus === status) : list;
}

// BR-APR-005：本人提交的不进入待审批队列（自跳过抢单模式）
function isSelfSubmitted(a: ShareAsset): boolean {
  return (a.publishedBy ?? a.ownerId) === currentUser.id;
}

// 取最后一条 APPROVED/REJECTED 事件
function lastDecision(a: ShareAsset) {
  for (let i = a.approvalEvents.length - 1; i >= 0; i--) {
    const ev = a.approvalEvents[i];
    if (ev.type === 'APPROVED' || ev.type === 'REJECTED') return ev;
  }
  return undefined;
}

export function getPendingApprovals(): ShareAsset[] {
  return getAll()
    .filter((a) => a.shareStatus === 'PENDING_APPROVAL' && !isSelfSubmitted(a))
    .sort((x, y) => x.submittedAt.localeCompare(y.submittedAt));
}

// BR-APR-002：仅当前用户审批过的记录，按 approvedAt 降序
export function getApprovalHistory(): ShareAsset[] {
  return getAll()
    .filter((a) => {
      if (a.shareStatus !== 'PUBLISHED' && a.shareStatus !== 'REJECTED') return false;
      const ev = lastDecision(a);
      return !!ev && ev.actorName === currentUser.name;
    })
    .sort((x, y) => {
      const ax = lastDecision(x)?.at ?? x.submittedAt;
      const ay = lastDecision(y)?.at ?? y.submittedAt;
      return ay.localeCompare(ax);
    });
}

export function findShareAsset(id: string): ShareAsset | undefined { return findAsset(id); }

export function pendingCount(): number {
  return getAll().filter((a) => a.shareStatus === 'PENDING_APPROVAL' && !isSelfSubmitted(a)).length;
}

export function getLastDecision(a: ShareAsset) { return lastDecision(a); }

