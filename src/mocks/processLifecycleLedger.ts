// 流程生命周期台账 Mock 数据与服务（STORY-003-PG-LIFECYCLE-LEDGER）

export type LifecycleField =
  | 'development_completed_at'
  | 'deployed_at'
  | 'offline_at';

export type MilestoneSource =
  | 'auto_publish_submit'
  | 'auto_publish_success'
  | 'auto_offline_success'
  | 'manual_adjust';

export interface ManualNote {
  actor_id: string;
  actor_name: string;
  at: string;
  reason: string;
  backfill?: boolean;
}

export interface LifecycleMilestone {
  effective_at: string | null;
  original_event_at: string | null;
  source: MilestoneSource;
  manual_note?: ManualNote;
}

export interface ProcessLifecycleLedger {
  process_id: string;
  development_completed_at: LifecycleMilestone;
  deployed_at: LifecycleMilestone;
  offline_at: LifecycleMilestone;
}

export interface LifecycleAdjustment {
  id: string;
  process_id: string;
  field: LifecycleField;
  previous_effective_at: string | null;
  new_effective_at: string;
  original_event_at: string | null;
  reason: string;
  backfill: boolean;
  actor_id: string;
  actor_name: string;
  at: string;
}

const ledgerStore = new Map<string, ProcessLifecycleLedger>();
const adjustmentsStore = new Map<string, LifecycleAdjustment[]>();
const listeners = new Map<string, Set<() => void>>();

const audit = (action: string, payload: Record<string, unknown>) => {
  // eslint-disable-next-line no-console
  console.info(`[AUDIT][lifecycle] ${action}`, payload);
};

const notify = (processId: string) => {
  listeners.get(processId)?.forEach((fn) => fn());
};

export const subscribeLifecycleLedger = (processId: string, fn: () => void) => {
  if (!listeners.has(processId)) listeners.set(processId, new Set());
  listeners.get(processId)!.add(fn);
  return () => listeners.get(processId)?.delete(fn);
};

const emptyMilestone = (): LifecycleMilestone => ({
  effective_at: null,
  original_event_at: null,
  source: 'auto_publish_submit',
});

const seedFor = (processId: string): ProcessLifecycleLedger => ({
  process_id: processId,
  development_completed_at: {
    effective_at: '2026-05-15T10:23:00',
    original_event_at: '2026-05-15T10:23:00',
    source: 'auto_publish_submit',
  },
  deployed_at: {
    effective_at: '2026-05-20T09:00:00',
    original_event_at: '2026-05-18T14:30:00',
    source: 'manual_adjust',
    manual_note: {
      actor_id: 'user-001',
      actor_name: 'John Smith',
      at: '2026-05-19T11:20:00',
      reason: '生产环境真实上线时间晚于平台记录，按运维报告修正。',
    },
  },
  offline_at: emptyMilestone(),
});

const seedAdjustmentsFor = (processId: string): LifecycleAdjustment[] => [
  {
    id: `adj-${processId}-1`,
    process_id: processId,
    field: 'deployed_at',
    previous_effective_at: '2026-05-18T14:30:00',
    new_effective_at: '2026-05-20T09:00:00',
    original_event_at: '2026-05-18T14:30:00',
    reason: '生产环境真实上线时间晚于平台记录，按运维报告修正。',
    backfill: false,
    actor_id: 'user-001',
    actor_name: 'John Smith',
    at: '2026-05-19T11:20:00',
  },
];

const ensureSeeded = (processId: string): ProcessLifecycleLedger => {
  if (!ledgerStore.has(processId)) {
    ledgerStore.set(processId, seedFor(processId));
    adjustmentsStore.set(processId, seedAdjustmentsFor(processId));
  }
  return ledgerStore.get(processId)!;
};

export const getProcessLifecycleLedger = (processId: string): ProcessLifecycleLedger => {
  return ensureSeeded(processId);
};

export const getLifecycleAdjustments = (processId: string): LifecycleAdjustment[] => {
  ensureSeeded(processId);
  const list = adjustmentsStore.get(processId) || [];
  return [...list].sort((a, b) => (a.at < b.at ? 1 : -1));
};

export interface AdjustPayload {
  new_effective_at: string;
  reason: string;
  backfill?: boolean;
  actor_id?: string;
  actor_name?: string;
}

export const adjustLifecycleMilestone = (
  processId: string,
  field: LifecycleField,
  payload: AdjustPayload,
): void => {
  if (!payload.reason || !payload.reason.trim()) {
    throw new Error('reason_required');
  }
  const ledger = ensureSeeded(processId);
  const prev = ledger[field];
  const actorId = payload.actor_id || 'user-001';
  const actorName = payload.actor_name || 'John Smith';
  const at = new Date().toISOString();

  const next: LifecycleMilestone = {
    effective_at: payload.new_effective_at,
    original_event_at: prev.original_event_at, // R-02 保留原始事件值
    source: 'manual_adjust',
    manual_note: {
      actor_id: actorId,
      actor_name: actorName,
      at,
      reason: payload.reason.trim(),
      backfill: !!payload.backfill,
    },
  };
  ledger[field] = next;

  const adjustments = adjustmentsStore.get(processId) || [];
  adjustments.push({
    id: `adj-${processId}-${adjustments.length + 1}`,
    process_id: processId,
    field,
    previous_effective_at: prev.effective_at,
    new_effective_at: payload.new_effective_at,
    original_event_at: prev.original_event_at,
    reason: payload.reason.trim(),
    backfill: !!payload.backfill,
    actor_id: actorId,
    actor_name: actorName,
    at,
  });
  adjustmentsStore.set(processId, adjustments);

  audit('adjust', { processId, field, payload, prev: prev.effective_at, next: next.effective_at });
  notify(processId);
};

export const FIELD_LABEL: Record<LifecycleField, string> = {
  development_completed_at: '开发完成时间',
  deployed_at: '部署上线时间',
  offline_at: '流程下线时间',
};

export const SOURCE_LABEL: Record<MilestoneSource, string> = {
  auto_publish_submit: '自动记录（发布申请提交）',
  auto_publish_success: '自动记录（发布成功）',
  auto_offline_success: '自动记录（停用成功）',
  manual_adjust: '手工修正',
};
