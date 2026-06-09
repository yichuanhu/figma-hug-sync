export type AssetType = 'WORKFLOW' | 'KNOWLEDGE';
export type AssetSource = 'NATIVE' | 'DEV_CENTER';
export type AssetStatus = 'PUBLISHED' | 'UNLISTED' | 'ARCHIVED';
export type ReuseState = 'hidden' | 'default' | 'loading' | 'reused';
export type ReuseType = 'DIRECT' | 'ADAPTATION';

export type SortKey = 'reuseCount' | 'createdAt';
export type SourceFilter = 'ALL' | AssetSource;
/** MVP: ALL/WORKFLOW/KNOWLEDGE/MY_REUSED */
export type TabFilter = 'ALL' | 'WORKFLOW' | 'KNOWLEDGE' | 'MY_REUSED';

export interface ParameterDef {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

export interface KnowledgeAttachment {
  name: string;
  size: string;
  url: string;
}

export interface KnowledgeExtension {
  contentHtml: string;
  attachments: KnowledgeAttachment[];
  knowledgeType: 'manual' | 'errorCode' | 'bestPractice' | 'faq';
}

export interface WorkflowExtension {
  yaml: string;
  nodeCount: number;
}

/**
 * 资产历史类型：
 * - RELEASE：上架历史（源自外部已发布版本的不可变快照），适用 WORKFLOW
 * - CHANGE ：变更历史（在共享中心内直接编辑产生的版本），适用 KNOWLEDGE
 */
export type AssetHistoryKind = 'RELEASE' | 'CHANGE';

export interface AssetVersion {
  id: string;
  assetId: string;
  version: string;
  /** 说明：RELEASE 语义=上架说明；CHANGE 语义=变更说明 */
  changeLog: string;
  content: string;
  isLatest: boolean;
  createdBy: string;
  createdAt: string;
  /** WORKFLOW 资产：是否快照引用 */
  isSnapshot?: boolean;
  /** 资产历史类型；缺省时通过 resolveHistoryKind(assetType) 推导 */
  historyKind?: AssetHistoryKind;
}

/**
 * 资产使用行为类型：
 * - REUSE   ：复用（WORKFLOW）
 * - DOWNLOAD：下载（KNOWLEDGE）
 */
export type UsageKind = 'REUSE' | 'DOWNLOAD';

/** 由资产类型推导使用记录语义 */
export const resolveUsageKind = (t: AssetType): UsageKind =>
  (t === 'KNOWLEDGE' ? 'DOWNLOAD' : 'REUSE');

/**
 * 使用记录：流程类资产=复用，知识资产=下载。
 * 历史命名保留 `ReuseRecord` 与 `reuserName/reuserDept/reusedAt` 字段
 * 作为存储层别名，避免大面积重命名；UI 层通过 usageKind 做语义切换。
 */
export interface ReuseRecord {
  id: string;
  assetId: string;
  versionId: string;
  versionNumber: string;
  /** 使用行为类型；缺省时按资产类型推导 */
  usageKind?: UsageKind;
  /** 使用者姓名 */
  reuserName: string;
  /** 使用者部门 */
  reuserDept?: string;
  /** 仅 REUSE 有意义 */
  reuseType?: ReuseType;
  /** 时间（REUSE=复用时间 / DOWNLOAD=下载时间） */
  reusedAt: string;
  /** WORKFLOW 复用时用户输入的流程名称（全局唯一） */
  workflowName?: string;
}

/** 语义别名：UsageRecord 等同 ReuseRecord */
export type UsageRecord = ReuseRecord;

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  source: AssetSource;
  status: AssetStatus;
  description: string;
  creatorName: string;
  departmentName: string;
  reuseCount: number;
  tags: string[];
  currentVersion: string;
  currentVersionId: string;
  createdAt: string;
  updatedAt: string;
  // type-specific extensions
  knowledge?: KnowledgeExtension;
  workflow?: WorkflowExtension;
  versions: AssetVersion[];
  reuseRecords: ReuseRecord[];
  // ===== 展示包装信息（v1.8 新增；为空则回退到 name/description） =====
  displayName?: string;
  displayDesc?: string;
  coverImage?: string;
  categoryTags?: string[];
  /** 概览富文本 HTML */
  overview?: string;
  /** 演示视频 URL */
  videoUrl?: string;
  // ===== 上架者标识 =====
  /** 上架者用户 ID（用于判断 isOwner） */
  publishedBy?: string;
  // ===== DEV_CENTER 资产源链接 =====
  originUrl?: string;
  // ===== WORKFLOW 资产元信息 =====
  resourceDeps?: string[];
  /** 同源逻辑流程标识：流程类资产的版本卡片共享同一 lineageId（KNOWLEDGE 不使用） */
  lineageId?: string;
}
