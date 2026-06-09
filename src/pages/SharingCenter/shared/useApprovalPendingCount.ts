import { useEffect, useState } from 'react';
import { pendingCount } from '@/pages/SharingCenter/shared/mockData';
import { subscribe } from '@/pages/SharingCenter/MyShared/store';

/** 订阅 store 的待审批数量变化 */
export function useApprovalPendingCount(): number {
  const [count, setCount] = useState<number>(() => {
    try { return pendingCount(); } catch { return 0; }
  });
  useEffect(() => subscribe(() => setCount(pendingCount())), []);
  return count;
}
