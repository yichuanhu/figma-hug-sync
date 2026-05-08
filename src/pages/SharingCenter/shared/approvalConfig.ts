/**
 * 审批层级配置（按资产类型）
 *
 * - NONE：免审批，发布后直接 PUBLISHED
 * - SINGLE：1 级审批，进入 PENDING_APPROVAL 队列
 *
 * 默认全部为 SINGLE；存储在 localStorage + 内存单例；提供订阅。
 */
export type AssetTypeKey = 'SNIPPET' | 'WORKFLOW' | 'KNOWLEDGE' | 'SKILL';
export type ApprovalLevel = 'NONE' | 'SINGLE';
export type ApprovalConfig = Record<AssetTypeKey, ApprovalLevel>;

const STORAGE_KEY = 'sharing-center.approval-levels';
export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  SNIPPET: 'SINGLE',
  WORKFLOW: 'SINGLE',
  KNOWLEDGE: 'SINGLE',
  SKILL: 'SINGLE',
};

let cache: ApprovalConfig | null = null;
const listeners = new Set<() => void>();

function load(): ApprovalConfig {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...DEFAULT_APPROVAL_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_APPROVAL_CONFIG };
  } catch {
    cache = { ...DEFAULT_APPROVAL_CONFIG };
  }
  return cache!;
}

export function getApprovalConfig(): ApprovalConfig {
  return { ...load() };
}

export function getApprovalLevel(type: AssetTypeKey): ApprovalLevel {
  return load()[type] ?? 'SINGLE';
}

export function saveApprovalConfig(next: ApprovalConfig) {
  cache = { ...next };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch {}
  listeners.forEach((fn) => fn());
}

export function resetApprovalConfig() {
  saveApprovalConfig({ ...DEFAULT_APPROVAL_CONFIG });
}

export function subscribeApprovalConfig(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
