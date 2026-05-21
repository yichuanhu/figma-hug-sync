import type { CustomMetric, MetricRecord, MetricSnapshot } from './types';

/** 预置指标 */
export const SEED_METRICS: CustomMetric[] = [
  {
    id: 'metric-order-count',
    code: 'ORDER_COUNT',
    displayName: '处理订单数',
    metricType: 'COUNTER',
    stepValue: 1,
    unit: '笔',
    description: '统计处理完成的订单数',
    visible: true,
    createdAt: '2026-04-01T08:00:00Z',
    updatedAt: '2026-05-19T10:30:00Z',
    hasRecords: true,
  },
  {
    id: 'metric-invoice-amt',
    code: 'INVOICE_AMT',
    displayName: '发票金额',
    metricType: 'ACCUMULATOR',
    unit: '元',
    description: '本期开具发票累计金额',
    visible: true,
    createdAt: '2026-04-02T08:00:00Z',
    updatedAt: '2026-05-19T09:50:00Z',
    hasRecords: true,
  },
  {
    id: 'metric-refund-count',
    code: 'REFUND_COUNT',
    displayName: '退款单数',
    metricType: 'COUNTER',
    stepValue: 1,
    unit: '笔',
    description: '统计退款处理完成的单数',
    visible: true,
    createdAt: '2026-04-08T08:00:00Z',
    updatedAt: '2026-05-19T08:20:00Z',
    hasRecords: true,
  },
  {
    id: 'metric-cost-saved',
    code: 'COST_SAVED',
    displayName: '节约成本',
    metricType: 'ACCUMULATOR',
    unit: '元',
    description: '流程自动化节约成本',
    visible: true,
    createdAt: '2026-04-10T08:00:00Z',
    updatedAt: '2026-05-19T11:10:00Z',
    hasRecords: true,
  },
  {
    id: 'metric-curr-status',
    code: 'CURR_STATUS',
    displayName: '当前批次状态',
    metricType: 'LATEST',
    valueType: 'STRING',
    unit: '',
    description: '最新批次处理状态',
    visible: true,
    createdAt: '2026-04-15T08:00:00Z',
    updatedAt: '2026-05-19T11:30:00Z',
    hasRecords: true,
  },
  {
    id: 'metric-last-batch',
    code: 'LAST_BATCH',
    displayName: '最近批次编号',
    metricType: 'LATEST',
    valueType: 'STRING',
    unit: '',
    description: '最近一次发起的批次编号',
    visible: false,
    createdAt: '2026-04-20T08:00:00Z',
    updatedAt: '2026-05-19T07:00:00Z',
    hasRecords: true,
  },
  {
    id: 'metric-last-duration',
    code: 'LAST_DURATION',
    displayName: '最近批次耗时',
    metricType: 'LATEST',
    valueType: 'DECIMAL',
    unit: '分钟',
    description: '最近一次批次处理总耗时',
    visible: true,
    createdAt: '2026-04-22T08:00:00Z',
    updatedAt: '2026-05-19T11:00:00Z',
    hasRecords: true,
  },
];

/** 流程名称池（与 flowId 一一对应循环取用） */
const FLOW_POOL = [
  { id: 'flow-001', name: '订单处理自动化流程' },
  { id: 'flow-002', name: '发票开具流程' },
  { id: 'flow-003', name: '退款审批流程' },
  { id: 'flow-004', name: '成本核算流程' },
  { id: 'flow-005', name: '批次调度流程' },
  { id: 'flow-006', name: '数据同步流程' },
];

const pickFlow = (seed: number) => FLOW_POOL[seed % FLOW_POOL.length];

/** 简单确定性随机 */
const rand = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const isoDayOffset = (offset: number, hour = 10) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};

let TASK_SEQ = 1;
const nextTaskId = () => `task-${String(TASK_SEQ++).padStart(4, '0')}`;

/** 为 numeric 指标生成 30 天累计/计数历史；LATEST 指标生成最近 8 条状态变化 */
const buildRecordsAndSnapshot = (
  metric: CustomMetric,
): { records: MetricRecord[]; snapshot: MetricSnapshot } => {
  const records: MetricRecord[] = [];
  if (metric.metricType === 'COUNTER' || metric.metricType === 'ACCUMULATOR') {
    let running = 0;
    let counter = 0;
    for (let i = 0; i < 30; i++) {
      const dailyTimes = Math.max(1, Math.floor(rand(metric.id.length + i) * 5) + 1);
      for (let j = 0; j < dailyTimes; j++) {
        const delta =
          metric.metricType === 'COUNTER'
            ? metric.stepValue ?? 1
            : Math.round(rand(i * 31 + j) * 800 + 100);
        running += delta;
        const flow = pickFlow(counter++);
        records.push({
          id: `${metric.id}-rec-${i}-${j}`,
          metricId: metric.id,
          flowId: flow.id,
          flowName: flow.name,
          taskId: nextTaskId(),
          delta,
          value: running,
          operator: 'UPDATE',
          timestamp: isoDayOffset(i - 29, 9 + j),
        });
      }
    }
    return {
      records,
      snapshot: {
        metricId: metric.id,
        currentValue: running,
        lastUpdatedAt: records[records.length - 1]?.timestamp ?? metric.updatedAt,
        version: records.length,
      },
    };
  }

  // LATEST：取最近 8 次值
  const stringStates = ['待开始', '处理中', '已完成', '部分失败', '已重试', '已完成'];
  for (let i = 0; i < 8; i++) {
    const value =
      metric.valueType === 'DECIMAL'
        ? Math.round((rand(i + metric.id.length) * 80 + 10) * 100) / 100
        : stringStates[i % stringStates.length];
    const flow = pickFlow(i);
    records.push({
      id: `${metric.id}-rec-${i}`,
      metricId: metric.id,
      flowId: flow.id,
      flowName: flow.name,
      taskId: nextTaskId(),
      delta: 0,
      value,
      operator: 'UPDATE',
      timestamp: isoDayOffset(i - 7, 10),
    });
  }
  const last = records[records.length - 1];
  return {
    records,
    snapshot: {
      metricId: metric.id,
      currentValue: last.value,
      lastUpdatedAt: last.timestamp,
      version: records.length,
    },
  };
};

/** 启动时填充内存数据 */
export const buildInitialData = () => {
  const metrics = [...SEED_METRICS];
  const snapshots = new Map<string, MetricSnapshot>();
  const records = new Map<string, MetricRecord[]>();
  metrics.forEach((m) => {
    const { records: recs, snapshot } = buildRecordsAndSnapshot(m);
    snapshots.set(m.id, snapshot);
    records.set(m.id, recs);
  });
  return { metrics, snapshots, records };
};
