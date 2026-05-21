/**
 * STORY-010 自定义业务指标 — 前端 Mock Service
 *
 * 对应 API：
 * - GET    /api/operations/metrics
 * - POST   /api/operations/metrics
 * - PUT    /api/operations/metrics/{id}
 * - DELETE /api/operations/metrics/{id}
 * - GET    /api/operations/metrics/{id}/records
 *
 * 通过 window.__setMetricsMode('error'|'ready') 可切换 mock 模式
 */
import { buildInitialData } from './mockData';
import {
  CustomMetric,
  CustomMetricWithSnapshot,
  MetricRecord,
  MetricServiceError,
  MetricSnapshot,
  MetricsMockMode,
  MetricType,
} from './types';

const MODE_STORAGE_KEY = 'metricsMockMode';

const readPersistedMode = (): MetricsMockMode => {
  if (typeof window === 'undefined') return 'ready';
  const v = window.localStorage.getItem(MODE_STORAGE_KEY);
  return v === 'error' || v === 'slow' || v === 'ready' ? v : 'ready';
};

let MOCK_MODE: MetricsMockMode = readPersistedMode();

const { metrics: METRICS, snapshots: SNAPSHOTS, records: RECORDS } = buildInitialData();

const listeners = new Set<(mode: MetricsMockMode) => void>();

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const latency = () => {
  if (MOCK_MODE === 'slow') return sleep(1800 + Math.random() * 800);
  return sleep(280 + Math.random() * 200);
};
const guard = () => {
  if (MOCK_MODE === 'error') throw new MetricServiceError('NETWORK', '网络异常');
};

export const getMetricsMockMode = (): MetricsMockMode => MOCK_MODE;

export const subscribeMetricsMockMode = (fn: (m: MetricsMockMode) => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const setMetricsMockMode = (mode: MetricsMockMode) => {
  MOCK_MODE = mode;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }
  listeners.forEach((fn) => fn(mode));
  // eslint-disable-next-line no-console
  console.info(`[metrics mock] mode = ${mode}`);
};

if (typeof window !== 'undefined') {
  (window as unknown as { __setMetricsMode?: typeof setMetricsMockMode }).__setMetricsMode =
    setMetricsMockMode;
}

const enrich = (m: CustomMetric): CustomMetricWithSnapshot => {
  const snap = SNAPSHOTS.get(m.id);
  return {
    ...m,
    currentValue: snap?.currentValue ?? null,
    lastUpdatedAt: snap?.lastUpdatedAt ?? null,
  };
};

const CODE_REGEX = /^[A-Z][A-Z0-9_]*$/;

export interface ListMetricsParams {
  visible?: boolean;
  keyword?: string;
}

export const listMetrics = async (
  params: ListMetricsParams = {},
): Promise<CustomMetricWithSnapshot[]> => {
  await latency();
  guard();
  let data = [...METRICS];
  if (params.visible !== undefined) {
    data = data.filter((m) => m.visible === params.visible);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    data = data.filter(
      (m) =>
        m.code.toLowerCase().includes(kw) || m.displayName.toLowerCase().includes(kw),
    );
  }
  return data.map(enrich);
};

export const getMetricSnapshot = (metricId: string): MetricSnapshot | undefined =>
  SNAPSHOTS.get(metricId);

export interface CreateMetricInput {
  code: string;
  displayName: string;
  metricType: MetricType;
  stepValue?: number;
  valueType?: 'DECIMAL' | 'STRING';
  unit?: string;
  description?: string;
  visible: boolean;
}

export const createMetric = async (
  input: CreateMetricInput,
): Promise<CustomMetricWithSnapshot> => {
  await latency();
  guard();
  if (!CODE_REGEX.test(input.code) || input.code.length < 2 || input.code.length > 30) {
    throw new MetricServiceError('DUPLICATE_CODE', '指标代码格式不合法');
  }
  if (METRICS.some((m) => m.code === input.code)) {
    throw new MetricServiceError('DUPLICATE_CODE', '指标代码已存在');
  }
  if (METRICS.some((m) => m.displayName === input.displayName)) {
    throw new MetricServiceError('DUPLICATE_NAME', '展示名称已存在');
  }
  const now = new Date().toISOString();
  const stepValue =
    input.metricType === 'COUNTER'
      ? Math.max(1, Math.floor(input.stepValue ?? 1))
      : undefined;
  const valueType =
    input.metricType === 'LATEST' ? input.valueType ?? 'DECIMAL' : undefined;
  const newMetric: CustomMetric = {
    id: `metric-${Date.now()}`,
    code: input.code,
    displayName: input.displayName,
    metricType: input.metricType,
    stepValue,
    valueType,
    unit: input.unit,
    description: input.description,
    visible: input.visible,
    createdAt: now,
    updatedAt: now,
    hasRecords: false,
  };
  METRICS.unshift(newMetric);
  SNAPSHOTS.set(newMetric.id, {
    metricId: newMetric.id,
    currentValue:
      newMetric.metricType === 'LATEST' && valueType === 'STRING' ? '' : 0,
    lastUpdatedAt: now,
    version: 0,
  });
  RECORDS.set(newMetric.id, []);
  return enrich(newMetric);
};

export interface UpdateMetricInput {
  displayName?: string;
  metricType?: MetricType;
  stepValue?: number;
  valueType?: 'DECIMAL' | 'STRING';
  unit?: string;
  description?: string;
  visible?: boolean;
}

export const updateMetric = async (
  id: string,
  patch: UpdateMetricInput,
): Promise<CustomMetricWithSnapshot> => {
  await latency();
  guard();
  const idx = METRICS.findIndex((m) => m.id === id);
  if (idx < 0) throw new MetricServiceError('NOT_FOUND', '指标不存在');
  const target = METRICS[idx];

  if (
    patch.displayName &&
    patch.displayName !== target.displayName &&
    METRICS.some((m) => m.id !== id && m.displayName === patch.displayName)
  ) {
    throw new MetricServiceError('DUPLICATE_NAME', '展示名称已存在');
  }

  if (target.hasRecords) {
    if (patch.metricType && patch.metricType !== target.metricType) {
      throw new MetricServiceError('TYPE_UNIT_LOCKED', '已有更新明细记录，type 不可变更');
    }
    if (patch.unit !== undefined && patch.unit !== target.unit) {
      throw new MetricServiceError('TYPE_UNIT_LOCKED', '已有更新明细记录，unit 不可变更');
    }
    if (patch.valueType && patch.valueType !== target.valueType) {
      throw new MetricServiceError('TYPE_UNIT_LOCKED', '已有更新明细记录，值类型不可变更');
    }
    if (patch.stepValue !== undefined && patch.stepValue !== target.stepValue) {
      throw new MetricServiceError('TYPE_UNIT_LOCKED', '已有更新明细记录，步进值不可变更');
    }
  }

  const finalType = patch.metricType ?? target.metricType;
  const updated: CustomMetric = {
    ...target,
    displayName: patch.displayName ?? target.displayName,
    metricType: finalType,
    stepValue:
      finalType === 'COUNTER'
        ? Math.max(1, Math.floor(patch.stepValue ?? target.stepValue ?? 1))
        : undefined,
    valueType:
      finalType === 'LATEST'
        ? patch.valueType ?? target.valueType ?? 'DECIMAL'
        : undefined,
    unit: patch.unit ?? target.unit,
    description: patch.description ?? target.description,
    visible: patch.visible ?? target.visible,
    updatedAt: new Date().toISOString(),
  };
  METRICS[idx] = updated;
  return enrich(updated);
};

export const deleteMetric = async (id: string): Promise<void> => {
  await latency();
  guard();
  const idx = METRICS.findIndex((m) => m.id === id);
  if (idx < 0) throw new MetricServiceError('NOT_FOUND', '指标不存在');
  if (METRICS[idx].hasRecords) {
    throw new MetricServiceError('HAS_RECORDS', '已有更新明细，不可删除');
  }
  METRICS.splice(idx, 1);
  SNAPSHOTS.delete(id);
  RECORDS.delete(id);
};

export interface ListRecordsParams {
  page?: number;
  pageSize?: number;
}

export interface ListRecordsResult {
  records: MetricRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export const listMetricRecords = async (
  metricId: string,
  params: ListRecordsParams = {},
): Promise<ListRecordsResult> => {
  await latency();
  guard();
  const all = (RECORDS.get(metricId) ?? []).slice().reverse(); // 最新在前
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  return {
    records: all.slice(start, start + pageSize),
    total: all.length,
    page,
    pageSize,
  };
};

/** 获取某指标全量记录（按天聚合趋势用） */
export const getAllRecords = (metricId: string): MetricRecord[] =>
  (RECORDS.get(metricId) ?? []).slice();
