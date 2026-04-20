import type { LinkedProcess, LinkedProcessStatus } from '../types';

export interface AggregatedLinkedStatus {
  key: 'FAILED' | 'ONLINE' | 'IN_PROGRESS' | 'PENDING' | 'EMPTY';
  i18nKey: string;
  color: 'red' | 'green' | 'blue' | 'grey';
  total: number;
  online: number;
}

const IN_PROGRESS_SET: LinkedProcessStatus[] = ['DEVELOPING', 'TESTING'];

export const aggregateLinkedStatus = (
  processes?: LinkedProcess[],
): AggregatedLinkedStatus => {
  const list = processes ?? [];
  const total = list.length;
  const online = list.filter((p) => p.status === 'ONLINE').length;

  if (total === 0) {
    return { key: 'EMPTY', i18nKey: 'requirements.linkedProcesses.aggregated.empty', color: 'grey', total, online };
  }
  if (list.some((p) => p.status === 'FAILED')) {
    return { key: 'FAILED', i18nKey: 'requirements.linkedProcesses.aggregated.failed', color: 'red', total, online };
  }
  if (list.every((p) => p.status === 'ONLINE')) {
    return { key: 'ONLINE', i18nKey: 'requirements.linkedProcesses.aggregated.online', color: 'green', total, online };
  }
  if (list.some((p) => IN_PROGRESS_SET.includes(p.status))) {
    return { key: 'IN_PROGRESS', i18nKey: 'requirements.linkedProcesses.aggregated.inProgress', color: 'blue', total, online };
  }
  return { key: 'PENDING', i18nKey: 'requirements.linkedProcesses.aggregated.pending', color: 'grey', total, online };
};

export interface LinkedProcessBuckets {
  online: number;
  developing: number;
  stopped: number;
  pending: number;
  failed: number;
}

export const bucketLinkedProcesses = (processes?: LinkedProcess[]): LinkedProcessBuckets => {
  const buckets: LinkedProcessBuckets = { online: 0, developing: 0, stopped: 0, pending: 0, failed: 0 };
  (processes ?? []).forEach((p) => {
    switch (p.status) {
      case 'ONLINE': buckets.online++; break;
      case 'DEVELOPING':
      case 'TESTING': buckets.developing++; break;
      case 'PENDING': buckets.pending++; break;
      case 'FAILED': buckets.failed++; break;
    }
  });
  return buckets;
};

export const linkedProcessStatusConfig: Record<LinkedProcessStatus, { color: 'grey' | 'orange' | 'cyan' | 'blue' | 'green' | 'red'; i18nKey: string }> = {
  PENDING:    { color: 'grey',   i18nKey: 'requirements.linkedProcesses.status.pending' },
  DEVELOPING: { color: 'blue',   i18nKey: 'requirements.linkedProcesses.status.developing' },
  TESTING:    { color: 'cyan',   i18nKey: 'requirements.linkedProcesses.status.testing' },
  ONLINE:     { color: 'green',  i18nKey: 'requirements.linkedProcesses.status.online' },
  FAILED:     { color: 'red',    i18nKey: 'requirements.linkedProcesses.status.failed' },
};
