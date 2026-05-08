/**
 * 共享中心 - 我的共享 / 审批管理 共用 Mock 数据
 * 在 Market 现有 mockData 基础上派生扩展状态字段，避免侵入现有 Asset 类型。
 */
import { allAssets } from '@/pages/Sharing/Market/mockData';
import type { Asset } from '@/pages/Sharing/Market/types';
import type { ShareStatus } from '@/components/sharing/StatusTag';
import type { ApprovalEvent } from '@/components/sharing/ApprovalTimeline';

export type ShareAsset = Asset & {
  shareStatus: ShareStatus;
  isMine: boolean;
  submittedAt: string;
  rejectedReason?: string;
  approvalEvents: ApprovalEvent[];
};

const ME = '当前用户';

const statusByIndex: ShareStatus[] = ['PUBLISHED', 'DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'PUBLISHED'];

let _cache: ShareAsset[] | null = null;

export function getShareAssets(): ShareAsset[] {
  if (_cache) return _cache;
  _cache = allAssets.map((a, idx): ShareAsset => {
    const isMine = idx % 3 === 0; // 约 1/3 是当前用户的
    const shareStatus: ShareStatus = isMine
      ? statusByIndex[idx % statusByIndex.length]
      : 'PUBLISHED';
    const submittedAt = a.updatedAt;
    const events: ApprovalEvent[] = [
      {
        type: 'SUBMITTED',
        actorName: isMine ? ME : a.creatorName,
        at: submittedAt,
        comment: '提交审批',
      },
    ];
    if (shareStatus === 'PUBLISHED') {
      events.push({ type: 'APPROVED', actorName: '王审批', at: a.updatedAt, comment: '内容完整，符合规范' });
    } else if (shareStatus === 'REJECTED') {
      events.push({ type: 'REJECTED', actorName: '王审批', at: a.updatedAt, comment: '描述信息不充分，请补充示例后重新提交' });
    }
    return {
      ...a,
      isMine,
      shareStatus,
      submittedAt,
      rejectedReason: shareStatus === 'REJECTED' ? '描述信息不充分，请补充示例后重新提交' : undefined,
      approvalEvents: events,
    };
  });
  return _cache;
}

export function getMyShared(status?: ShareStatus): ShareAsset[] {
  const all = getShareAssets().filter((a) => a.isMine);
  return status ? all.filter((a) => a.shareStatus === status) : all;
}

export function getPendingApprovals(): ShareAsset[] {
  return getShareAssets()
    .filter((a) => a.shareStatus === 'PENDING_APPROVAL')
    .sort((x, y) => x.submittedAt.localeCompare(y.submittedAt));
}

export function getApprovalHistory(): ShareAsset[] {
  return getShareAssets()
    .filter((a) => a.shareStatus === 'PUBLISHED' || a.shareStatus === 'REJECTED')
    .sort((x, y) => y.submittedAt.localeCompare(x.submittedAt));
}

export function findShareAsset(id: string): ShareAsset | undefined {
  return getShareAssets().find((a) => a.id === id);
}

export function pendingCount(): number {
  return getShareAssets().filter((a) => a.shareStatus === 'PENDING_APPROVAL').length;
}
