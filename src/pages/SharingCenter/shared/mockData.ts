/**
 * 共享中心 - 我的共享 / 审批管理 共用 Mock 数据
 * 现在统一委托给 MyShared/store 单例（含可变状态）。
 */
import { getAll, getMine, findAsset, type ShareAsset } from '@/pages/SharingCenter/MyShared/store';
import type { ShareStatus } from '@/components/sharing/StatusTag';

export type { ShareAsset };

export function getShareAssets(): ShareAsset[] { return getAll(); }

export function getMyShared(status?: ShareStatus): ShareAsset[] {
  const list = getMine();
  return status ? list.filter((a) => a.shareStatus === status) : list;
}

export function getPendingApprovals(): ShareAsset[] {
  return getAll()
    .filter((a) => a.shareStatus === 'PENDING_APPROVAL')
    .sort((x, y) => x.submittedAt.localeCompare(y.submittedAt));
}

export function getApprovalHistory(): ShareAsset[] {
  return getAll()
    .filter((a) => a.shareStatus === 'PUBLISHED' || a.shareStatus === 'REJECTED')
    .sort((x, y) => y.submittedAt.localeCompare(x.submittedAt));
}

export function findShareAsset(id: string): ShareAsset | undefined { return findAsset(id); }

export function pendingCount(): number {
  return getAll().filter((a) => a.shareStatus === 'PENDING_APPROVAL').length;
}
