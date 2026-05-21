/**
 * STORY-010 自定义业务指标 — 前端 Mock 类型定义
 */

export type MetricType = 'COUNTER' | 'ACCUMULATOR' | 'LATEST';

export type MetricValueType = 'DECIMAL' | 'STRING';

export type MetricOperator = 'UPDATE' | 'SET' | 'INCREMENT' | 'ACCUMULATE' | 'LATEST';

/** 指标配置（CustomMetric） */
export interface CustomMetric {
  id: string;
  code: string;
  displayName: string;
  metricType: MetricType;
  /** 仅 COUNTER 使用，默认 1，正整数 */
  stepValue?: number;
  /** 仅 LATEST 使用，COUNTER/ACCUMULATOR 固定 DECIMAL */
  valueType?: MetricValueType;
  unit?: string;
  description?: string;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  /** 是否已产生历史记录（影响 type/unit/stepValue/valueType 是否可改、是否可删） */
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
  /** 触发更新的流程 ID */
  flowId: string;
  /** 触发更新的流程名称（冗余展示用） */
  flowName: string;
  /** 触发更新的任务 ID */
  taskId: string;
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
