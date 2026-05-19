/**
 * STORY-010 自定义业务指标 — 前端 Mock 类型定义
 */

export type MetricType = 'COUNTER' | 'ACCUMULATOR' | 'LATEST';

export type MetricOperator = 'SET' | 'INCREMENT' | 'ACCUMULATE' | 'LATEST';

/** 指标配置（CustomMetric） */
export interface CustomMetric {
  id: string;
  code: string;
  displayName: string;
  metricType: MetricType;
  unit?: string;
  description?: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  /** 是否已产生历史记录（影响 type/unit 是否可改、是否可删） */
  hasRecords: boolean;
}

/** 指标当前聚合值（MetricSnapshot） */
export interface MetricSnapshot {
  metricId: string;
  currentValue: number | string;
  lastUpdatedAt: string;
  version: number;
}

/** 指标历史更新明细（MetricRecord） */
export interface MetricRecord {
  id: string;
  metricId: string;
  executionId: string;
  delta: number;
  value: number | string;
  operator: MetricOperator;
  timestamp: string;
}

/** Mock 运行模式（用于演示 ready/error） */
export type MetricsMockMode = 'ready' | 'slow' | 'error';

/** 服务端错误码 */
export type MetricServiceErrorCode =
  | 'DUPLICATE_CODE'
  | 'DUPLICATE_NAME'
  | 'TYPE_UNIT_LOCKED'
  | 'HAS_RECORDS'
  | 'NOT_FOUND'
  | 'NETWORK';

export class MetricServiceError extends Error {
  code: MetricServiceErrorCode;
  constructor(code: MetricServiceErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

/** 指标聚合视图（列表用） */
export interface CustomMetricWithSnapshot extends CustomMetric {
  currentValue: number | string | null;
  lastUpdatedAt: string | null;
}
