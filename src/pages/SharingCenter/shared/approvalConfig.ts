/**
 * 共享中心 — 审批流配置（按资产类型）
 *
 * 数据结构升级：
 * - 旧：每个资产类型保存 'NONE' | 'SINGLE' 标量
 * - 新：每个资产类型保存 ApprovalFlowConfig（多级审批流，与需求中心同构）
 *   - levels.length === 0 → 等价旧 NONE（免审批，发布后直接 PUBLISHED）
 *   - levels.length >= 1  → 走多级审批流，进入 PENDING_APPROVAL
 *
 * 兼容：保留 getApprovalLevel(type) 以最小代价兼容现有调用方（store.ts 等）。
 * 旧 localStorage 值会在首次读取时一次性迁移为新结构。
 */
import type { ApprovalFlowConfig, ApprovalLevelConfig } from '@/pages/Requirements/RequirementsWorkbench/types';

export type AssetTypeKey = 'WORKFLOW' | 'KNOWLEDGE';
export type ApprovalLevel = 'NONE' | 'SINGLE';
/** @deprecated 旧标量配置类型，保留仅用于类型兼容；新代码请使用 SharingApprovalConfig */
export type ApprovalConfig = Record<AssetTypeKey, ApprovalLevel>;
export type SharingApprovalConfig = Record<AssetTypeKey, ApprovalFlowConfig>;

const STORAGE_KEY = 'sharing-center.approval-flows';
const LEGACY_STORAGE_KEY = 'sharing-center.approval-levels';

/** 默认单级审批流：部门负责人任一通过 */
const buildDefaultSingleLevel = (name: string): ApprovalLevelConfig => ({
  order: 1,
  name,
  approver_type: 'role',
  approver_ids: ['role-dept-head'],
  mode: 'any_one',
});

export const DEFAULT_SHARING_APPROVAL_CONFIG: SharingApprovalConfig = {
  // MVP：默认免审批，提交后直接上架
  WORKFLOW: { levels: [] },
  KNOWLEDGE: { levels: [] },
};

/** @deprecated 旧默认值，保留以兼容历史导入；新代码请使用 DEFAULT_SHARING_APPROVAL_CONFIG */
export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = {
  WORKFLOW: 'SINGLE',
  KNOWLEDGE: 'SINGLE',
};

let cache: SharingApprovalConfig | null = null;
const listeners = new Set<() => void>();

const cloneDefault = (): SharingApprovalConfig => ({
  WORKFLOW: { levels: DEFAULT_SHARING_APPROVAL_CONFIG.WORKFLOW.levels.map((l) => ({ ...l })) },
  KNOWLEDGE: { levels: DEFAULT_SHARING_APPROVAL_CONFIG.KNOWLEDGE.levels.map((l) => ({ ...l })) },
});

/** 旧 'NONE'|'SINGLE' → 新 ApprovalFlowConfig 迁移 */
function migrateLegacy(legacy: ApprovalConfig): SharingApprovalConfig {
  const next = cloneDefault();
  (Object.keys(next) as AssetTypeKey[]).forEach((k) => {
    if (legacy[k] === 'NONE') next[k] = { levels: [] };
    else if (legacy[k] === 'SINGLE') next[k] = { levels: [buildDefaultSingleLevel('部门负责人审批')] };
  });
  return next;
}

function load(): SharingApprovalConfig {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SharingApprovalConfig>;
      cache = { ...cloneDefault(), ...parsed };
      return cache;
    }
    // 尝试迁移旧 key
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = { ...DEFAULT_APPROVAL_CONFIG, ...JSON.parse(legacyRaw) } as ApprovalConfig;
      cache = migrateLegacy(legacy);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch {}
      return cache;
    }
    cache = cloneDefault();
  } catch {
    cache = cloneDefault();
  }
  return cache;
}

export function getSharingApprovalConfig(): SharingApprovalConfig {
  const c = load();
  return {
    WORKFLOW: { levels: c.WORKFLOW.levels.map((l) => ({ ...l })) },
    KNOWLEDGE: { levels: c.KNOWLEDGE.levels.map((l) => ({ ...l })) },
  };
}

export function getApprovalFlow(type: AssetTypeKey): ApprovalFlowConfig {
  return { levels: load()[type].levels.map((l) => ({ ...l })) };
}

/** 兼容旧 API：levels 为空 → NONE，否则 SINGLE（运行时多级推进列为后续 TODO） */
export function getApprovalLevel(type: AssetTypeKey): ApprovalLevel {
  return load()[type].levels.length === 0 ? 'NONE' : 'SINGLE';
}

/** @deprecated 兼容旧 API */
export function getApprovalConfig(): ApprovalConfig {
  const c = load();
  return {
    WORKFLOW: c.WORKFLOW.levels.length === 0 ? 'NONE' : 'SINGLE',
    KNOWLEDGE: c.KNOWLEDGE.levels.length === 0 ? 'NONE' : 'SINGLE',
  };
}

export function saveSharingApprovalConfig(next: SharingApprovalConfig) {
  cache = next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch {}
  listeners.forEach((fn) => fn());
}

export function saveApprovalFlow(type: AssetTypeKey, flow: ApprovalFlowConfig) {
  const next = { ...load(), [type]: { levels: flow.levels.map((l) => ({ ...l })) } };
  saveSharingApprovalConfig(next);
}

/** @deprecated 旧 API；建议改用 saveSharingApprovalConfig / saveApprovalFlow */
export function saveApprovalConfig(legacy: ApprovalConfig) {
  saveSharingApprovalConfig(migrateLegacy(legacy));
}

export function resetApprovalConfig() {
  saveSharingApprovalConfig(cloneDefault());
}

export function subscribeApprovalConfig(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
