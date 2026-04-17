import dayjs from 'dayjs';
import type { MiddlewareItem, MetricPoint, DualMetricPoint } from './types';

export const initialMiddlewares: MiddlewareItem[] = [
  {
    id: 'mysql-global',
    name: 'MySQL (Global)',
    source: 'apa_managed',
    endpoint: '127.0.0.1:3306/apa_global',
    status: 'healthy',
    responseTime: 12,
    lastCheck: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'mysql-default',
    name: 'MySQL (Default)',
    source: 'apa_managed',
    endpoint: '127.0.0.1:3306/apa_default',
    status: 'healthy',
    responseTime: 18,
    lastCheck: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'redis',
    name: 'Redis',
    source: 'uci_builtin',
    endpoint: '127.0.0.1:6379',
    status: 'healthy',
    responseTime: 5,
    lastCheck: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    id: 'file-storage',
    name: 'File Storage',
    source: 'apa_managed',
    endpoint: '/data/apa/files',
    status: 'unhealthy',
    responseTime: 0,
    lastCheck: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    errorMessage: 'Permission denied',
  },
];

const pointsForRange = (range: string): number => {
  switch (range) {
    case '5min': return 30;
    case '15min': return 45;
    case '1hour': return 60;
    case '6hour': return 72;
    case '24hour': return 96;
    default: return 60;
  }
};

const intervalSecForRange = (range: string): number => {
  switch (range) {
    case '5min': return 10;
    case '15min': return 20;
    case '1hour': return 60;
    case '6hour': return 300;
    case '24hour': return 900;
    default: return 60;
  }
};

export const generateMockSingleMetric = (range: string, base: number, swing: number): MetricPoint[] => {
  const n = pointsForRange(range);
  const interval = intervalSecForRange(range);
  const now = dayjs();
  return Array.from({ length: n }, (_, i) => ({
    timestamp: now.subtract((n - i) * interval, 'second').format('HH:mm:ss'),
    value: Math.max(0, Math.min(100, base + (Math.random() - 0.5) * swing)),
  }));
};

export const generateMockDualMetric = (range: string, baseA: number, baseB: number, swing: number): DualMetricPoint[] => {
  const n = pointsForRange(range);
  const interval = intervalSecForRange(range);
  const now = dayjs();
  return Array.from({ length: n }, (_, i) => ({
    timestamp: now.subtract((n - i) * interval, 'second').format('HH:mm:ss'),
    a: Math.max(0, baseA + (Math.random() - 0.5) * swing),
    b: Math.max(0, baseB + (Math.random() - 0.5) * swing),
  }));
};
