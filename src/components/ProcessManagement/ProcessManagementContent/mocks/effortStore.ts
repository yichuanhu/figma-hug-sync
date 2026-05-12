/**
 * 流程级工时 Mock 存储（STORY-001-DEFT-PROCESS-EFFORT）
 * 内存级 Map：processId -> entries[]，预估值单独存放
 * 实际值由 entries 求和派生
 */
import type { LYProcessEffortEntry } from '@/api';

// 当前用户（与 SharingCenter 保持一致）
export const CURRENT_USER_ID = 'user-001';
export const CURRENT_USER_NAME = 'John Smith';

export type EffortErrorCode =
  | 'forbidden'         // ERR-01 非创建者
  | 'invalid_estimate'  // ERR-03/04
  | 'invalid_delta'     // ERR-05/06
  | 'invalid_date'      // ERR-07/08
  | 'invalid_note'      // ERR-09
  | 'not_found';

export class EffortError extends Error {
  constructor(public code: EffortErrorCode, message?: string) {
    super(message || code);
  }
}

interface EffortRecord {
  estimate: number | null;
  entries: LYProcessEffortEntry[];
  updatedBy: string | null;
  updatedAt: string | null;
}

const store = new Map<string, EffortRecord>();

const ensure = (processId: string): EffortRecord => {
  if (!store.has(processId)) {
    store.set(processId, { estimate: null, entries: [], updatedBy: null, updatedAt: null });
  }
  return store.get(processId)!;
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

const sum = (entries: LYProcessEffortEntry[]): number =>
  round1(entries.reduce((acc, e) => acc + (e.delta_days || 0), 0));

const id = () => `effort-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// 预置一些 mock 数据：前几个流程有预估和登记记录
export const seedEffort = (processId: string, opts: { estimate?: number; entries?: Omit<LYProcessEffortEntry, 'id' | 'process_id'>[] }) => {
  const rec = ensure(processId);
  if (opts.estimate !== undefined) rec.estimate = opts.estimate;
  if (opts.entries) {
    rec.entries = opts.entries.map((e) => ({ ...e, id: id(), process_id: processId }));
  }
  rec.updatedBy = CURRENT_USER_ID;
  rec.updatedAt = new Date().toISOString();
};

export interface EffortSnapshot {
  estimate: number | null;
  actual: number | null;
  entries: LYProcessEffortEntry[];
  updated_by: string | null;
  updated_at: string | null;
}

export const getEffort = (processId: string): EffortSnapshot => {
  const rec = ensure(processId);
  return {
    estimate: rec.estimate,
    actual: rec.entries.length === 0 ? null : sum(rec.entries),
    entries: [...rec.entries].sort((a, b) => b.work_date.localeCompare(a.work_date) || b.created_at.localeCompare(a.created_at)),
    updated_by: rec.updatedBy,
    updated_at: rec.updatedAt,
  };
};

const isCreator = (creatorId: string) => creatorId === CURRENT_USER_ID;

export const putEstimate = (
  processId: string,
  creatorId: string,
  estimate: number | null,
): EffortSnapshot => {
  if (!isCreator(creatorId)) throw new EffortError('forbidden');
  if (estimate !== null) {
    if (typeof estimate !== 'number' || Number.isNaN(estimate)) throw new EffortError('invalid_estimate');
    if (estimate < 0 || estimate > 9999) throw new EffortError('invalid_estimate');
    if (Math.round(estimate * 10) !== estimate * 10) throw new EffortError('invalid_estimate');
  }
  const rec = ensure(processId);
  rec.estimate = estimate;
  rec.updatedBy = CURRENT_USER_ID;
  rec.updatedAt = new Date().toISOString();
  return getEffort(processId);
};

export interface PostEntryInput {
  delta_days: number;
  work_date: string; // YYYY-MM-DD
  note?: string;
}

export const postEntry = (
  processId: string,
  creatorId: string,
  input: PostEntryInput,
): EffortSnapshot => {
  if (!isCreator(creatorId)) throw new EffortError('forbidden');
  // 校验 delta
  if (typeof input.delta_days !== 'number' || Number.isNaN(input.delta_days)) throw new EffortError('invalid_delta');
  if (input.delta_days === 0) throw new EffortError('invalid_delta');
  if (input.delta_days < -999 || input.delta_days > 999) throw new EffortError('invalid_delta');
  if (Math.round(input.delta_days * 10) !== input.delta_days * 10) throw new EffortError('invalid_delta');
  // 校验日期
  if (!input.work_date || !/^\d{4}-\d{2}-\d{2}$/.test(input.work_date)) throw new EffortError('invalid_date');
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const wd = new Date(input.work_date + 'T00:00:00');
  if (Number.isNaN(wd.getTime())) throw new EffortError('invalid_date');
  if (wd.getTime() > today.getTime()) throw new EffortError('invalid_date');
  // 校验 note
  if (input.note && input.note.length > 200) throw new EffortError('invalid_note');

  const rec = ensure(processId);
  const entry: LYProcessEffortEntry = {
    id: id(),
    process_id: processId,
    delta_days: round1(input.delta_days),
    work_date: input.work_date,
    note: input.note?.trim() || null,
    created_by: CURRENT_USER_ID,
    created_by_name: CURRENT_USER_NAME,
    created_at: new Date().toISOString(),
  };
  rec.entries.push(entry);
  rec.updatedBy = CURRENT_USER_ID;
  rec.updatedAt = new Date().toISOString();
  return getEffort(processId);
};

// 初始化少量预置数据
seedEffort('process-1', {
  estimate: 5,
  entries: [
    { delta_days: 1, work_date: '2025-05-06', note: '需求拆解与方案设计', created_by: CURRENT_USER_ID, created_by_name: CURRENT_USER_NAME, created_at: '2025-05-06T18:30:00.000Z' },
    { delta_days: 1.5, work_date: '2025-05-07', note: '核心节点开发', created_by: CURRENT_USER_ID, created_by_name: CURRENT_USER_NAME, created_at: '2025-05-07T18:30:00.000Z' },
    { delta_days: 2, work_date: '2025-05-08', note: '联调与测试', created_by: CURRENT_USER_ID, created_by_name: CURRENT_USER_NAME, created_at: '2025-05-08T18:30:00.000Z' },
    { delta_days: 1, work_date: '2025-05-09', note: '问题修复', created_by: CURRENT_USER_ID, created_by_name: CURRENT_USER_NAME, created_at: '2025-05-09T18:30:00.000Z' },
  ],
});
seedEffort('process-6', { estimate: 3 });
