export type AssetType = 'SNIPPET' | 'WORKFLOW' | 'KNOWLEDGE' | 'SKILL';
export type AssetSource = 'NATIVE' | 'DEV_CENTER';
export type AssetStatus = 'PUBLISHED' | 'UNLISTED' | 'ARCHIVED';
export type SkillStatus = 'PUBLISHED' | 'DEPRECATED';
export type ReuseType = 'DIRECT' | 'ADAPTATION';
export type SkillCategory = 'document' | 'data' | 'content' | 'retrieval' | 'tool' | 'other';

export type SortKey = 'reuseCount' | 'createdAt';
export type SourceFilter = 'ALL' | AssetSource;
export type TabFilter = 'ALL' | AssetType;

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
}

export interface ReuseRecord {
  id: string;
  assetId: string;
  versionId: string;
  versionNumber: string;
  reuserName: string;
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
}
