/**
 * 流程列表「审批中」提示数据 Hook
 *
 * - context='development'：仅订阅发布审批，PENDING_APPROVAL 视为「发布审批中」
 * - context='scheduling'：仅订阅下线审批，PENDING_APPROVAL / APPROVED / EXECUTION_FAILED
 *   分别对应「下线审批中 / 下线执行中 / 下线失败」
 *
 * 不依赖 process_publish_approval.view / process_offline_approval.view，
 * mock 阶段对申请人 / 流程负责人 / 同部门视为可见（近似为「全可见」）。
 */
import { useEffect, useState } from 'react';
import {
  fetchProcessVersions,
  subscribeProcessVersionChange,
} from '@/mocks/processVersionApproval';
import {
  fetchOfflineApprovals,
  subscribeOfflineRequestChange,
} from '@/mocks/processOfflineApproval';

export type ApprovalHintKind = 'publish' | 'offline';

export interface ApprovalHint {
  kind: ApprovalHintKind;
  /** publish: 'PENDING_APPROVAL' | offline: 'PENDING_APPROVAL' | 'APPROVED' | 'EXECUTION_FAILED' */
  status: string;
  /** 入口对应的业务对象 ID：发布是 versionId，下线是 requestId */
  targetId: string;
  currentLevel?: number;
  totalLevels?: number;
}

const buildPublishHints = async (): Promise<Map<string, ApprovalHint>> => {
  const list = await fetchProcessVersions();
  const map = new Map<string, ApprovalHint>();
  list.forEach((v) => {
    if (v.status !== 'PENDING_APPROVAL') return;
    // 同一流程若有多个待审批版本，保留最新一条（list 已按时间倒序）
    if (map.has(v.process_id)) return;
    map.set(v.process_id, {
      kind: 'publish',
      status: v.status,
      targetId: v.id,
      currentLevel: v.current_level,
      totalLevels: v.total_levels,
    });
  });
  return map;
};

const buildOfflineHints = async (): Promise<Map<string, ApprovalHint>> => {
  const list = await fetchOfflineApprovals();
  const map = new Map<string, ApprovalHint>();
  list.forEach((r) => {
    if (r.status !== 'PENDING_APPROVAL' && r.status !== 'APPROVED' && r.status !== 'EXECUTION_FAILED') return;
    if (map.has(r.process_id)) return;
    map.set(r.process_id, {
      kind: 'offline',
      status: r.status,
      targetId: r.id,
      currentLevel: r.current_level,
      totalLevels: r.total_levels,
    });
  });
  return map;
};

export const useProcessApprovalHints = (context: 'development' | 'scheduling') => {
  const [hints, setHints] = useState<Map<string, ApprovalHint>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const map = context === 'development' ? await buildPublishHints() : await buildOfflineHints();
      if (!cancelled) setHints(map);
    };
    refresh();
    const unsub = context === 'development'
      ? subscribeProcessVersionChange(refresh)
      : subscribeOfflineRequestChange(refresh);
    return () => { cancelled = true; unsub(); };
  }, [context]);

  return hints;
};
