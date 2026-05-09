export type PublishShareStatus = 'UNPUBLISHED' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';

export interface PublishProcessRecord {
  id: string;
  processId: string;
  processName: string;
  version: string;
  description: string;
  department: string;
  releaseId: string;
  publisherName: string;
  publisherDepartment: string;
  publishTime: string;
  shareStatus: PublishShareStatus;
  /** 提交到共享中心的时间戳（用于「审批中」Tab 排序）*/
  submitTime?: number;
  /** 仅在已同步/审批中时存在 */
  assetId?: string;
  /** 共享中心审批备注（拒绝时填写） */
  reviewComment?: string;
  /** 用户填写的发布说明 */
  publishNote?: string;
}
