/**
 * FEAT-003 数据分类共享服务 — 前端 Mock 类型定义
 * 参考 STORY-017-RC-CLASSIFICATION-INTEGRATION
 */

export type ClassificationStatus = 'ACTIVE' | 'INACTIVE';

/** 业务对象类型 */
export type BusinessObjectType = 'requirement' | 'process' | 'task';

/** 分类值 */
export interface ClassificationValue {
  id: string;
  name: string;
  status: ClassificationStatus;
  /** 排序 */
  order?: number;
}

/** 分类键 */
export interface ClassificationKey {
  id: string;
  name: string;
  description?: string;
  status: ClassificationStatus;
  applicableBusinessObjectTypes: BusinessObjectType[];
  values: ClassificationValue[];
  order?: number;
}

/** 单次分类分配 payload */
export interface ClassificationAssignmentItem {
  classificationKeyId: string;
  valueIds: string[];
}

/** 实体上的已分配分类（查询返回） */
export interface EntityClassification {
  classificationKeyId: string;
  keyName: string;
  values: Array<{ id: string; name: string }>;
}

/** Mock 服务运行模式（用于演示 ready/empty/error） */
export type ClassificationMockMode = 'ready' | 'empty' | 'error';
