/**
 * 流程级工时 Mock 存储（STORY-001-DEFT-PROCESS-EFFORT v4/v5）
 * - estimate / remaining：单值覆盖
 * - actual：派生 = SUM(entries.delta_days)
 * - entries：append-only，纠错通过追加 delta < 0 的 entry
 */
import type { LYProcessEffortEntry } from '@/api';

export const CURRENT_USER_ID = 'user-001';
export const CURRENT_USER_NAME = 'John Smith';

export type EffortErrorCode =
  | 'forbidden'
  | 'invalid_value'           // estimate / remaining 越界
  | 'invalid_delta'           // entry delta 非法
  | 'invalid_date'            // entry work_date 越界
  | 'invalid_note'
  | 'negative_total'          // 写入后 SUM < 0
  | 'remaining_over_limit';   // 负值纠错后 remaining > 9999.99

export class EffortError extends Error {
  constructor(public code: EffortErrorCode, public extra?: Record<string, unknown>) {
    super(code);
  }
}

interface EffortRecord {
  estimate: number | null;
  remaining: number | null;
  entries: LYProcessEffortEntry[];
  updatedBy: string | null;
  updatedAt: string | null;
}

const MAX_VALUE = 9999.99;
const WORK_DATE_WINDOW_DAYS = 90;

const store = new Map<string, EffortRecord>();

const ensure = (processId: string): EffortRecord => {
  if (!store.has(processId)) {
    store.set(processId, { estimate: null, remaining: null, entries: [], updatedBy: null, updatedAt: null });
  }
  return store.get(processId)!;
};

const round2 = (n: number): number => Math.round(n * 100) / 100;
const sumDelta = (entries: LYProcessEffortEntry[]): number =>
  round2(entries.reduce((acc, e) => acc + (e.delta_days || 0), 0));

const id = () => `effort-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const isValidDecimal2 = (n: number): boolean =>
  Number.isFinite(n) && Math.round(n * 100) === n * 100;

const isWithinWorkDateWindow = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const wd = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(wd.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (wd.getTime() > today.getTime()) return false;
  const min = new Date();
  min.setDate(min.getDate() - WORK_DATE_WINDOW_DAYS);
  min.setHours(0, 0, 0, 0);
  return wd.getTime() >= min.getTime();
};

export const seedEffort = (
  processId: string,
  opts: { estimate?: number; remaining?: number; entries?: Omit<LYProcessEffortEntry, 'id' | 'process_id'>[] },
) => {
  const rec = ensure(processId);
  if (opts.estimate !== undefined) rec.estimate = opts.estimate;
  if (opts.remaining !== undefined) rec.remaining = opts.remaining;
  if (opts.entries) {
    rec.entries = opts.entries.map((e) => ({ ...e, id: id(), process_id: processId }));
  }
  rec.updatedBy = CURRENT_USER_ID;
  rec.updatedAt = new Date().toISOString();
};

export interface EffortSnapshot {
  estimate: number | null;
  actual: number | null;
  remaining: number | null;
  progress_rate: number | null;     // [0, 1]
  variance_days: number | null;     // actual - estimate
  is_overrun: boolean;
  entries: LYProcessEffortEntry[];
  updated_by: string | null;
  updated_at: string | null;
}

export const getEffort = (processId: string): EffortSnapshot => {
  const rec = ensure(processId);
  const actual = rec.entries.length === 0 ? null : sumDelta(rec.entries);
  const actualNum = actual ?? 0;
  const remainingNum = rec.remaining ?? 0;
  const denom = actualNum + remainingNum;
  const progress_rate = denom > 0 ? round2(actualNum / denom * 100) / 100 : null;
  const variance_days = rec.estimate !== null && actual !== null ? round2(actual - rec.estimate) : null;
  const is_overrun = rec.estimate !== null && actual !== null && actual > rec.estimate;
  return {
    estimate: rec.estimate,
    actual,
    remaining: rec.remaining,
    progress_rate,
    variance_days,
    is_overrun,
    entries: [...rec.entries].sort(
      (a, b) => b.work_date.localeCompare(a.work_date) || b.created_at.localeCompare(a.created_at),
    ),
    updated_by: rec.updatedBy,
    updated_at: rec.updatedAt,
  };
};

// 真实权限层接入前，mock 默认放行；保留 forbidden 错误码供未来使用
const isCreator = (_creatorId: string) => true;

const validateEstimate = (v: number) => {
  if (!isValidDecimal2(v)) throw new EffortError('invalid_value');
  if (v <= 0 || v > MAX_VALUE) throw new EffortError('invalid_value');
};

const validateRemaining = (v: number) => {
  if (!isValidDecimal2(v)) throw new EffortError('invalid_value');
  if (v < 0 || v > MAX_VALUE) throw new EffortError('invalid_value');
};

/**
 * 合并保存 estimate / remaining。
 * - undefined / null 表示不更新该字段
 * - 若 remaining 未显式传入且当前为空，但 estimate 被设置 → 用 estimate 初始化 remaining
 */
export const putEffort = (
  processId: string,
  creatorId: string,
  patch: { estimate?: number | null; remaining?: number | null },
): EffortSnapshot => {
  if (!isCreator(creatorId)) throw new EffortError('forbidden');
  const rec = ensure(processId);

  if (patch.estimate !== undefined && patch.estimate !== null) {
    validateEstimate(patch.estimate);
    rec.estimate = round2(patch.estimate);
    if (rec.remaining === null && (patch.remaining === undefined || patch.remaining === null)) {
      rec.remaining = round2(patch.estimate);
    }
  }
  if (patch.remaining !== undefined && patch.remaining !== null) {
    validateRemaining(patch.remaining);
    rec.remaining = round2(patch.remaining);
  }
  rec.updatedBy = CURRENT_USER_ID;
  rec.updatedAt = new Date().toISOString();
  return getEffort(processId);
};

export interface PostEntryInput {
  delta_days: number;
  work_date: string;
  note?: string;
}

export const postEntry = (
  processId: string,
  creatorId: string,
  input: PostEntryInput,
): EffortSnapshot => {
  if (!isCreator(creatorId)) throw new EffortError('forbidden');

  // delta 校验
  if (typeof input.delta_days !== 'number' || Number.isNaN(input.delta_days)) {
    throw new EffortError('invalid_delta');
  }
  if (input.delta_days === 0) throw new EffortError('invalid_delta');
  if (Math.abs(input.delta_days) > MAX_VALUE) throw new EffortError('invalid_delta');
  if (!isValidDecimal2(input.delta_days)) throw new EffortError('invalid_delta');

  // work_date 校验
  if (!isWithinWorkDateWindow(input.work_date)) throw new EffortError('invalid_date');

  // note 校验
  if (input.note && input.note.length > 200) throw new EffortError('invalid_note');

  const rec = ensure(processId);

  // 累计非负校验
  const currentActual = sumDelta(rec.entries);
  const newActual = round2(currentActual + input.delta_days);
  if (newActual < 0) {
    throw new EffortError('negative_total', { current: currentActual, delta: input.delta_days });
  }

  // remaining 自动调整：扣减；若上限超限则回滚
  let nextRemaining = rec.remaining;
  if (rec.remaining !== null) {
    const candidate = round2(rec.remaining - input.delta_days);
    if (candidate > MAX_VALUE) {
      throw new EffortError('remaining_over_limit');
    }
    nextRemaining = candidate < 0 ? 0 : candidate;
  }

  // 通过：写入 entry + 更新 remaining
  const entry: LYProcessEffortEntry = {
    id: id(),
    process_id: processId,
    delta_days: round2(input.delta_days),
    work_date: input.work_date,
    note: input.note?.trim() || null,
    created_by: CURRENT_USER_ID,
    created_by_name: CURRENT_USER_NAME,
    created_at: new Date().toISOString(),
  };
  rec.entries.push(entry);
  rec.remaining = nextRemaining;
  rec.updatedBy = CURRENT_USER_ID;
  rec.updatedAt = new Date().toISOString();
  return getEffort(processId);
};

// 预置 mock 数据
seedEffort('process-1', {
  estimate: 5,
  remaining: 0.5,
  entries: [
    { delta_days: 1, work_date: '2026-05-06', note: '需求拆解与方案设计', created_by: CURRENT_USER_ID, created_by_name: CURRENT_USER_NAME, created_at: '2026-05-06T18:30:00.000Z' },
    { delta_days: 1.5, work_date: '2026-05-07', note: '核心节点开发', created_by: CURRENT_USER_ID, created_by_name: CURRENT_USER_NAME, created_at: '2026-05-07T18:30:00.000Z' },
    { delta_days: 2, work_date: '2026-05-08', note: '联调与测试', created_by: CURRENT_USER_ID, created_by_name: CURRENT_USER_NAME, created_at: '2026-05-08T18:30:00.000Z' },
    { delta_days: 1, work_date: '2026-05-09', note: '问题修复', created_by: CURRENT_USER_ID, created_by_name: CURRENT_USER_NAME, created_at: '2026-05-09T18:30:00.000Z' },
  ],
});
seedEffort('process-6', { estimate: 3, remaining: 3 });
