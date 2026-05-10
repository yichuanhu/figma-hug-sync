export type AssetType = 'SNIPPET' | 'WORKFLOW' | 'KNOWLEDGE' | 'SKILL';
export type AssetSource = 'NATIVE' | 'DEV_CENTER';
export type AssetStatus = 'PUBLISHED' | 'UNLISTED' | 'ARCHIVED';
export type ReuseState = 'hidden' | 'default' | 'loading' | 'reused';
export type SkillStatus = 'PUBLISHED' | 'DEPRECATED';
export type ReuseType = 'DIRECT' | 'ADAPTATION';
export type SkillCategory = 'document' | 'data' | 'content' | 'retrieval' | 'tool' | 'other';

export type SortKey = 'reuseCount' | 'createdAt';
export type SourceFilter = 'ALL' | AssetSource;
/** MVP: ALL/WORKFLOW/KNOWLEDGE/MY_REUSED；SNIPPET/SKILL 暂不在 Tab 展示 */
export type TabFilter = 'ALL' | 'WORKFLOW' | 'KNOWLEDGE' | 'MY_REUSED';

export interface ParameterDef {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

export interface SkillExtension {
  category: SkillCategory;
  inputParams: ParameterDef[];
  outputParams: ParameterDef[];
  timeoutSec: number;
  retryPolicy: string;
  callExample: string;
  callCount: number;
  successRate: number;
  rating: number;
  skillStatus: SkillStatus;
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

export interface AssetVersion {
  id: string;
  assetId: string;
  version: string;
  changeLog: string;
  content: string;
  isLatest: boolean;
  createdBy: string;
  createdAt: string;
  /** WORKFLOW 资产：是否快照引用 */
  isSnapshot?: boolean;
}

export interface ReuseRecord {
  id: string;
  assetId: string;
  versionId: string;
  versionNumber: string;
  reuserName: string;
  /** 复用人所属部门（供给侧复用明细面板展示） */
  reuserDept?: string;
  reuseType: ReuseType;
  adaptationNote?: string;
  reusedAt: string;
}

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
  skill?: SkillExtension;
  knowledge?: KnowledgeExtension;
  workflow?: WorkflowExtension;
  snippet?: WorkflowExtension;
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
}
