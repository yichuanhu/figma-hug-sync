/**
 * 「我的共享」本地数据 Store（mock）
 *
 * - 在 Sharing/Market 数据基础上派生扩展字段（ownerId / creatorId / originUrl / shareStatus / archivedAt）
 * - 维护可变 mock 数据（创建/编辑/归档/恢复/删除/下架/发版），便于跨页面（编辑→列表）同步
 * - 通过 subscribe 通知订阅者刷新
 */
import { allAssets } from '@/pages/Sharing/Market/mockData';
import type { Asset, AssetVersion, AssetSource, AssetType, KnowledgeExtension, SkillExtension } from '@/pages/Sharing/Market/types';
import type { ShareStatus } from '@/components/sharing/StatusTag';
import type { ApprovalEvent } from '@/components/sharing/ApprovalTimeline';
import { getApprovalLevel, type AssetTypeKey } from '@/pages/SharingCenter/shared/approvalConfig';

export const CURRENT_USER_ID = 'me';
export const CURRENT_USER_NAME = '当前用户';
export const CURRENT_USER_DEPT = '研发中心';

export type ShareAsset = Asset & {
  shareStatus: ShareStatus;
  isMine: boolean;
  ownerId: string;
  creatorId: string;
  originUrl?: string;
  submittedAt: string;
  rejectedReason?: string;
  approvalEvents: ApprovalEvent[];
  archivedAt?: string;
};

const ME = CURRENT_USER_NAME;
const DEV_CENTER_BASE = 'https://dev-center.example.com/processes';

const statusByIndex: ShareStatus[] = ['PUBLISHED', 'DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'PUBLISHED'];

let assets: ShareAsset[] = [];
let initialized = false;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

const buildEvents = (status: ShareStatus, actorName: string, at: string): ApprovalEvent[] => {
  const events: ApprovalEvent[] = [{ type: 'SUBMITTED', actorName, at, comment: '提交审批' }];
  if (status === 'PUBLISHED') events.push({ type: 'APPROVED', actorName: '王审批', at, comment: '内容完整，符合规范' });
  else if (status === 'REJECTED') events.push({ type: 'REJECTED', actorName: '王审批', at, comment: '描述信息不充分，请补充示例后重新提交' });
  return events;
};

const init = () => {
  if (initialized) return;
  initialized = true;
  // 1) 基于 Market 数据派生
  const derived: ShareAsset[] = allAssets.map((a, idx): ShareAsset => {
    const isMine = idx % 3 === 0;
    const isDevCenter = a.source === 'DEV_CENTER';
    let shareStatus: ShareStatus = isMine ? statusByIndex[idx % statusByIndex.length] : 'PUBLISHED';
    const submittedAt = a.updatedAt;
    const ownerId = isMine ? CURRENT_USER_ID : `user-${idx}`;
    return {
      ...a,
      isMine,
      shareStatus,
      ownerId,
      creatorId: isMine && !isDevCenter ? CURRENT_USER_ID : `user-${idx}`,
      publishedBy: a.publishedBy ?? ownerId,
      originUrl: a.originUrl ?? (isDevCenter ? `${DEV_CENTER_BASE}/${a.id}` : undefined),
      resourceDeps: a.resourceDeps ?? (isDevCenter ? ['队列-A', 'DB-凭据'] : undefined),
      submittedAt,
      rejectedReason: shareStatus === 'REJECTED' ? '描述信息不充分，请补充示例后重新提交' : undefined,
      approvalEvents: buildEvents(shareStatus, isMine ? ME : a.creatorName, submittedAt),
    };
  });

  // 2) 补齐演示资产：归档 / 已下架 / DEV_CENTER 待审批
  const today = '2026-05-08';
  const extras: ShareAsset[] = [
    makeNativeKnowledge('kn-arch-001', 'SAP 操作手册（旧版）', '2025 年版本的 SAP 操作手册，已归档保留参考', 'ARCHIVED', today),
    makeNativeSkill('sk-arch-001', 'PDF 转 Word 技能（旧）', '基于旧引擎的 PDF 转 Word，已被新版替代', 'ARCHIVED', today),
    makeNativeKnowledge('kn-draft-001', '错误码速查（草稿）', '正在整理的错误码速查表草稿', 'DRAFT', today),
    {
      ...derived[0],
      id: 'wf-unlisted-demo',
      name: '已下架演示流程',
      shareStatus: 'UNLISTED',
      isMine: true,
      ownerId: CURRENT_USER_ID,
      source: 'DEV_CENTER',
      originUrl: `${DEV_CENTER_BASE}/wf-unlisted-demo`,
      submittedAt: today,
      approvalEvents: buildEvents('PUBLISHED', ME, today),
    },
  ];

  assets = [...derived, ...extras];
};

// ============ 工厂方法 ============
function blankVersion(assetId: string, version: string, changeLog: string, content: string, when: string): AssetVersion {
  return {
    id: `${assetId}-${version}`,
    assetId,
    version,
    changeLog,
    content,
    isLatest: true,
    createdBy: CURRENT_USER_NAME,
    createdAt: when,
  };
}

export function makeNativeKnowledge(
  id: string,
  name: string,
  description: string,
  status: ShareStatus,
  when: string,
  ext?: Partial<KnowledgeExtension>,
): ShareAsset {
  const knowledge: KnowledgeExtension = {
    contentHtml: ext?.contentHtml ?? `<h2>${name}</h2><p>${description}</p>`,
    attachments: ext?.attachments ?? [],
    knowledgeType: ext?.knowledgeType ?? 'manual',
  };
  return {
    id,
    name,
    type: 'KNOWLEDGE',
    source: 'NATIVE',
    status: 'PUBLISHED',
    description,
    creatorName: CURRENT_USER_NAME,
    departmentName: CURRENT_USER_DEPT,
    reuseCount: 0,
    tags: ['NATIVE'],
    currentVersion: 'v1.0.0',
    currentVersionId: `${id}-v1.0.0`,
    createdAt: when,
    updatedAt: when,
    knowledge,
    versions: [blankVersion(id, 'v1.0.0', '首发版本', knowledge.contentHtml, when)],
    reuseRecords: [],
    isMine: true,
    shareStatus: status,
    ownerId: CURRENT_USER_ID,
    creatorId: CURRENT_USER_ID,
    submittedAt: when,
    archivedAt: status === 'ARCHIVED' ? when : undefined,
    approvalEvents: buildEvents(status === 'ARCHIVED' ? 'PUBLISHED' : status, ME, when),
  };
}

export function makeNativeSkill(
  id: string,
  name: string,
  description: string,
  status: ShareStatus,
  when: string,
  ext?: Partial<SkillExtension>,
): ShareAsset {
  const skill: SkillExtension = {
    category: ext?.category ?? 'tool',
    inputParams: ext?.inputParams ?? [{ name: 'input', type: 'string', required: true, description: '输入参数' }],
    outputParams: ext?.outputParams ?? [{ name: 'output', type: 'string', required: true, description: '输出参数' }],
    timeoutSec: ext?.timeoutSec ?? 30,
    retryPolicy: ext?.retryPolicy ?? 'none',
    callExample: ext?.callExample ?? '{\n  "input": "demo"\n}',
    callCount: 0,
    successRate: 0,
    rating: 0,
    skillStatus: 'PUBLISHED',
  };
  return {
    id,
    name,
    type: 'SKILL',
    source: 'NATIVE',
    status: 'PUBLISHED',
    description,
    creatorName: CURRENT_USER_NAME,
    departmentName: CURRENT_USER_DEPT,
    reuseCount: 0,
    tags: ['NATIVE'],
    currentVersion: 'v1.0.0',
    currentVersionId: `${id}-v1.0.0`,
    createdAt: when,
    updatedAt: when,
    skill,
    versions: [blankVersion(id, 'v1.0.0', '首发版本', JSON.stringify(skill, null, 2), when)],
    reuseRecords: [],
    isMine: true,
    shareStatus: status,
    ownerId: CURRENT_USER_ID,
    creatorId: CURRENT_USER_ID,
    submittedAt: when,
    archivedAt: status === 'ARCHIVED' ? when : undefined,
    approvalEvents: buildEvents(status === 'ARCHIVED' ? 'PUBLISHED' : status, ME, when),
  };
}

// ============ 查询 ============
export function getAll(): ShareAsset[] {
  init();
  return assets;
}

export function getMine(): ShareAsset[] {
  return getAll().filter((a) => a.isMine && a.shareStatus !== 'UNLISTED');
}

export function findAsset(id: string): ShareAsset | undefined {
  return getAll().find((a) => a.id === id);
}

export function getVersions(assetId: string): AssetVersion[] {
  const a = findAsset(assetId);
  return (a?.versions ?? []).slice().sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

// ============ 订阅 ============
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// ============ 变更 ============
const todayStr = () => new Date().toISOString().slice(0, 10);

function patchAsset(id: string, patch: Partial<ShareAsset>) {
  assets = assets.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: todayStr() } : a));
  notify();
}

export function archiveAsset(id: string) { patchAsset(id, { shareStatus: 'ARCHIVED', archivedAt: todayStr() }); }
export function recoverAsset(id: string) { patchAsset(id, { shareStatus: 'PUBLISHED', archivedAt: undefined }); }
export function unlistAsset(id: string) { patchAsset(id, { shareStatus: 'UNLISTED' }); }
export function deleteAsset(id: string) {
  assets = assets.filter((a) => a.id !== id);
  notify();
}

export function updateMeta(id: string, meta: { name?: string; description?: string; tags?: string[] }) {
  patchAsset(id, meta);
}

export function updateNativeContent(id: string, payload: { knowledge?: Partial<KnowledgeExtension>; skill?: Partial<SkillExtension> }) {
  const a = findAsset(id);
  if (!a) return;
  patchAsset(id, {
    knowledge: payload.knowledge ? { ...(a.knowledge as KnowledgeExtension), ...payload.knowledge } : a.knowledge,
    skill: payload.skill ? { ...(a.skill as SkillExtension), ...payload.skill } : a.skill,
  });
}

export function addAsset(a: ShareAsset) {
  init();
  assets = [a, ...assets];
  notify();
}

// ============ 版本 ============
export type BumpType = 'patch' | 'minor' | 'major';

export function bumpVersion(current: string, bump: BumpType): string {
  const m = current.replace(/^v/, '').split('.').map(Number);
  const [maj, min, pat] = [m[0] || 0, m[1] || 0, m[2] || 0];
  if (bump === 'major') return `v${maj + 1}.0.0`;
  if (bump === 'minor') return `v${maj}.${min + 1}.0`;
  return `v${maj}.${min}.${pat + 1}`;
}

export function publishNewVersion(id: string, params: { bump?: BumpType; changeLog: string }) {
  const a = findAsset(id);
  if (!a) return;
  const isFirst = a.shareStatus === 'DRAFT';
  const newVersion = isFirst ? 'v1.0.0' : bumpVersion(a.currentVersion, params.bump ?? 'patch');
  const when = todayStr();
  const newVer: AssetVersion = {
    id: `${id}-${newVersion}`,
    assetId: id,
    version: newVersion,
    changeLog: params.changeLog,
    content: a.knowledge?.contentHtml ?? (a.skill ? JSON.stringify(a.skill, null, 2) : ''),
    isLatest: true,
    createdBy: CURRENT_USER_NAME,
    createdAt: when,
  };
  const versions = a.versions.map((v) => ({ ...v, isLatest: false }));
  versions.unshift(newVer);
  const requireApproval = getApprovalLevel(a.type as AssetTypeKey) === 'SINGLE';
  const nextStatus: ShareStatus = isFirst
    ? (requireApproval ? 'PENDING_APPROVAL' : 'PUBLISHED')
    : 'PUBLISHED';
  const events: ApprovalEvent[] = [
    { type: 'SUBMITTED', actorName: ME, at: when, comment: '提交审批' },
  ];
  if (nextStatus === 'PUBLISHED' && isFirst) {
    events.push({ type: 'APPROVED', actorName: '系统', at: when, comment: '免审批，自动通过' });
  }
  patchAsset(id, {
    currentVersion: newVersion,
    currentVersionId: newVer.id,
    versions,
    shareStatus: nextStatus,
    submittedAt: when,
    approvalEvents: isFirst ? events : buildEvents(nextStatus, ME, when),
  });
}

// ============ 审批操作 ============
const NOW_USER = CURRENT_USER_NAME;

export function approveAsset(id: string, comment = '审核通过'): { ok: boolean; reason?: 'NOT_PENDING' | 'NOT_FOUND' } {
  const a = findAsset(id);
  if (!a) return { ok: false, reason: 'NOT_FOUND' };
  if (a.shareStatus !== 'PENDING_APPROVAL') return { ok: false, reason: 'NOT_PENDING' };
  const when = todayStr();
  patchAsset(id, {
    shareStatus: 'PUBLISHED',
    approvalEvents: [...a.approvalEvents, { type: 'APPROVED', actorName: NOW_USER, at: when, comment }],
  });
  return { ok: true };
}

export function rejectAsset(id: string, reason: string): { ok: boolean; reason?: 'NOT_PENDING' | 'NOT_FOUND' } {
  const a = findAsset(id);
  if (!a) return { ok: false, reason: 'NOT_FOUND' };
  if (a.shareStatus !== 'PENDING_APPROVAL') return { ok: false, reason: 'NOT_PENDING' };
  const when = todayStr();
  patchAsset(id, {
    shareStatus: 'REJECTED',
    rejectedReason: reason,
    approvalEvents: [...a.approvalEvents, { type: 'REJECTED', actorName: NOW_USER, at: when, comment: reason }],
  });
  return { ok: true };
}

export function batchApprove(ids: string[]): { approved: number; skipped: number } {
  let approved = 0;
  let skipped = 0;
  const when = todayStr();
  ids.forEach((id) => {
    const a = assets.find((x) => x.id === id);
    if (!a || a.shareStatus !== 'PENDING_APPROVAL') { skipped += 1; return; }
    assets = assets.map((x) => x.id === id ? {
      ...x,
      shareStatus: 'PUBLISHED' as ShareStatus,
      updatedAt: when,
      approvalEvents: [...x.approvalEvents, { type: 'APPROVED' as const, actorName: NOW_USER, at: when, comment: '批量通过' }],
    } : x);
    approved += 1;
  });
  if (approved > 0) notify();
  return { approved, skipped };
}

export function buildAssetId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

// ============ 流程发布到共享中心 ============
const DEV_CENTER_PROCESS_URL = 'https://dev-center.example.com/processes';

/**
 * 将开发中心已发布的流程发布到共享中心。
 * 同 processId 已存在 PENDING/PUBLISHED 时，作为新版本资产新增。
 */
export function publishWorkflowToShare(sourceAsset: Asset, note: string): string {
  init();
  const when = todayStr();
  const newId = buildAssetId('wf-shared');
  const versionId = `${newId}-${sourceAsset.currentVersion}`;
  const newVersion: AssetVersion = {
    id: versionId,
    assetId: newId,
    version: sourceAsset.currentVersion,
    changeLog: note || '发布到共享中心',
    content: sourceAsset.workflow?.yaml ?? '',
    isLatest: true,
    createdBy: CURRENT_USER_NAME,
    createdAt: when,
  };
  const asset: ShareAsset = {
    ...sourceAsset,
    id: newId,
    currentVersionId: versionId,
    creatorName: CURRENT_USER_NAME,
    departmentName: sourceAsset.departmentName,
    createdAt: when,
    updatedAt: when,
    reuseCount: 0,
    versions: [newVersion],
    reuseRecords: [],
    workflow: sourceAsset.workflow ? { ...sourceAsset.workflow } : undefined,
    isMine: true,
    shareStatus: 'PENDING_APPROVAL',
    ownerId: CURRENT_USER_ID,
    creatorId: CURRENT_USER_ID,
    originUrl: `${DEV_CENTER_PROCESS_URL}/${sourceAsset.id}`,
    submittedAt: when,
    rejectedReason: undefined,
    archivedAt: undefined,
    approvalEvents: [
      { type: 'SUBMITTED', actorName: CURRENT_USER_NAME, at: when, comment: note || '提交审批' },
    ],
  };
  addAsset(asset);
  return newId;
}

/** 资产市场可见数据：基础 mock + store 中已 PUBLISHED 的新增资产（按 id 去重）。缓存以满足 useSyncExternalStore 的稳定快照要求。 */
let marketAssetsCache: Asset[] | null = null;
let marketAssetsCacheVersion = -1;
let storeVersion = 0;
const bumpStoreVersion = () => { storeVersion += 1; marketAssetsCache = null; };
listeners.add(bumpStoreVersion);

export function getMarketAssets(): Asset[] {
  init();
  if (marketAssetsCache && marketAssetsCacheVersion === storeVersion) return marketAssetsCache;
  const baseIds = new Set(allAssets.map((a) => a.id));
  // 同 id 时以 store 的 PUBLISHED 资产覆盖（含 reuseRecords 等动态字段）
  const overrideMap = new Map<string, Asset>();
  for (const a of assets) {
    if (a.shareStatus === 'PUBLISHED' && baseIds.has(a.id)) overrideMap.set(a.id, a);
  }
  const merged = allAssets.map((a) => overrideMap.get(a.id) ?? a);
  const extras = assets.filter((a) => a.shareStatus === 'PUBLISHED' && !baseIds.has(a.id));
  marketAssetsCache = [...merged, ...extras];
  marketAssetsCacheVersion = storeVersion;
  return marketAssetsCache;
}

export function findMarketAsset(id: string): Asset | undefined {
  return getMarketAssets().find((a) => a.id === id);
}

// ============ v1.8 资产市场扩展：当前用户 / 复用 / 我已复用 / 编辑展示信息 ============

export const currentUser = { id: CURRENT_USER_ID, name: CURRENT_USER_NAME };

export function isOwner(assetId: string): boolean {
  const a = findAsset(assetId);
  if (!a) return false;
  return (a.publishedBy ?? a.ownerId) === currentUser.id;
}

export function hasReused(assetId: string): boolean {
  const a = findAsset(assetId);
  if (!a) return false;
  return a.reuseRecords.some((r) => r.reuserName === currentUser.name);
}

/** 获取当前用户对该资产的复用时间（最近一次） */
export function getReusedAt(assetId: string): string | undefined {
  const a = findAsset(assetId);
  return a?.reuseRecords.find((r) => r.reuserName === currentUser.name)?.reusedAt;
}

/** 创建复用记录（幂等：已复用则原样返回） */
export function addReuseRecord(assetId: string): { ok: true; reusedAt: string } | { ok: false; reason: 'NOT_FOUND' | 'OWNER' } {
  const a = findAsset(assetId);
  if (!a) return { ok: false, reason: 'NOT_FOUND' };
  if (isOwner(assetId)) return { ok: false, reason: 'OWNER' };
  const existing = a.reuseRecords.find((r) => r.reuserName === currentUser.name);
  if (existing) return { ok: true, reusedAt: existing.reusedAt };
  const when = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const record = {
    id: `${assetId}-r-${Date.now().toString(36)}`,
    assetId,
    versionId: a.currentVersionId,
    versionNumber: a.currentVersion,
    reuserName: currentUser.name,
    reuseType: 'DIRECT' as const,
    reusedAt: when,
  };
  patchAsset(assetId, {
    reuseRecords: [record, ...a.reuseRecords],
    reuseCount: a.reuseCount + 1,
  } as Partial<ShareAsset>);
  return { ok: true, reusedAt: when };
}

/** 获取当前用户已复用的资产（按复用时间倒序） */
export function getMyReusedAssets(): Array<Asset & { myReusedAt: string }> {
  return getMarketAssets()
    .filter((a) => a.status === 'PUBLISHED' && a.reuseRecords.some((r) => r.reuserName === currentUser.name))
    .map((a) => ({
      ...a,
      myReusedAt: a.reuseRecords.find((r) => r.reuserName === currentUser.name)!.reusedAt,
    }))
    .sort((x, y) => y.myReusedAt.localeCompare(x.myReusedAt));
}

export interface DisplayInfoPatch {
  displayName?: string;
  displayDesc?: string;
  coverImage?: string;
  categoryTags?: string[];
  overview?: string;
  videoUrl?: string;
}

export function updateDisplayInfo(assetId: string, patch: DisplayInfoPatch): boolean {
  const a = findAsset(assetId);
  if (!a) return false;
  patchAsset(assetId, patch as Partial<ShareAsset>);
  return true;
}

