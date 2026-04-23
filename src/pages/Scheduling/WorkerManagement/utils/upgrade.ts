import type { LYWorkerResponse } from '@/api';
import { getEnabledVersion } from '@/mocks/clientVersionData';

/** 设备升级状态 */
export type UpgradeStatus = 'NONE' | 'QUEUED' | 'UPGRADING' | 'FAILED';

/** 扩展 Worker 字段（设备维度共享，同 machine_code 同步） */
export interface WorkerWithUpgrade extends LYWorkerResponse {
  upgrade_status?: UpgradeStatus;
  upgrade_target_version?: string | null;
  upgrade_failed_reason?: string | null;
}

/** 语义化版本对比：a < b 返回 -1，相等 0，a > b 返回 1 */
export const compareVersion = (a: string, b: string): number => {
  const norm = (v: string) => v.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const aa = norm(a);
  const bb = norm(b);
  const len = Math.max(aa.length, bb.length);
  for (let i = 0; i < len; i++) {
    const av = aa[i] ?? 0;
    const bv = bb[i] ?? 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
};

/** 判断当前 worker 是否有可用升级 */
export const isUpgradeAvailable = (worker: LYWorkerResponse): boolean => {
  const target = getEnabledVersion(worker.desktop_type);
  if (!target || !worker.client_version) return false;
  return compareVersion(worker.client_version, target.version) < 0;
};

/** 按 machine_code 聚合，同设备所有机器人归为一组 */
export const groupWorkersByDevice = (
  workers: WorkerWithUpgrade[]
): Map<string, WorkerWithUpgrade[]> => {
  const map = new Map<string, WorkerWithUpgrade[]>();
  workers.forEach((w) => {
    const key = w.machine_code || w.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(w);
  });
  return map;
};

/** 给定整张 worker 列表与勾选项，按设备聚合（同设备只出现一次，并附上该设备下全部机器人） */
export const aggregateSelectedDevices = (
  allWorkers: WorkerWithUpgrade[],
  selectedIds: string[]
): { machineCode: string; workers: WorkerWithUpgrade[] }[] => {
  const selectedSet = new Set(selectedIds);
  const seen = new Set<string>();
  const result: { machineCode: string; workers: WorkerWithUpgrade[] }[] = [];
  allWorkers.forEach((w) => {
    if (!selectedSet.has(w.id)) return;
    const key = w.machine_code || w.id;
    if (seen.has(key)) return;
    seen.add(key);
    const peers = allWorkers.filter((x) => (x.machine_code || x.id) === key);
    result.push({ machineCode: key, workers: peers });
  });
  return result;
};

/** 设备是否空闲（所有机器人均为 IDLE 才视为空闲，OFFLINE / FAULT 需先恢复在线） */
export const isDeviceIdle = (workers: WorkerWithUpgrade[]): boolean => {
  return workers.length > 0 && workers.every((w) => w.status === 'IDLE');
};

/** 阻塞升级的机器人（BUSY / MAINTENANCE / OFFLINE / FAULT 均需等待恢复在线空闲） */
export const getDeviceBlockingWorkers = (workers: WorkerWithUpgrade[]): WorkerWithUpgrade[] => {
  return workers.filter(
    (w) => w.status === 'BUSY' || w.status === 'MAINTENANCE' || w.status === 'OFFLINE' || w.status === 'FAULT'
  );
};

/** 设备是否完全离线（无可立即升级的在线机器人） */
export const isDeviceAllOffline = (workers: WorkerWithUpgrade[]): boolean => {
  return workers.length > 0 && workers.every((w) => w.status === 'OFFLINE' || w.status === 'FAULT');
};
