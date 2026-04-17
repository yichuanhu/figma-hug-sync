export type MiddlewareSource = 'apa_managed' | 'uci_builtin';
export type HealthStatus = 'healthy' | 'unhealthy';

export interface MiddlewareItem {
  id: string;
  name: string;
  source: MiddlewareSource;
  endpoint: string;
  status: HealthStatus;
  responseTime: number;
  lastCheck: string;
  errorMessage?: string;
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export interface DualMetricPoint {
  timestamp: string;
  a: number;
  b: number;
}
