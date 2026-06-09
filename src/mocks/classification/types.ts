/**
 * FEAT-003 数据分类共享服务 — 前端 Mock 类型定义
 * 参考 STORY-017-RC-CLASSIFICATION-INTEGRATION v9（2026-06-09）
 *
 * 数据结构：分类维度（category）→ 一级枚举值（item）→ 二级枚举值（item）
 * - 维度（category）不可选，仅作字段标题
 * - 一级、二级枚举值均可被选择（changeOnSelect）
 */

export type ClassificationStatus = 'ACTIVE' | 'INACTIVE';

/** 业务对象类型 */
export type BusinessObjectType = 'requirement' | 'process' | 'task';

/** 分类枚举值节点（可嵌套 children） */
export interface ClassificationItem {
  id: string;
  category_id: string;
  parent_id: string;
  name: string;
  description?: string;
  index?: number;
  path: string;
  node_type: 'item';
  selectable: boolean;
  children: ClassificationItem[];
}

/** 分类维度（key/category）节点 */
export interface ClassificationKey {
  id: string;
  name: string;
  description?: string;
  status: ClassificationStatus;
  node_type: 'category';
  selectable: false;
  /** 后端字段（不含前缀） */
  field: string;
  /** Requirement 上持久化字段名 */
  persist_field: string;
  applicableBusinessObjectTypes: BusinessObjectType[];
  children: ClassificationItem[];
  order?: number;
}

/** 单次分类分配 payload（每维度可多选枚举值） */
export interface ClassificationAssignmentItem {
  classificationKeyId: string;
  /** 选中的枚举值 ID 列表（可跨层级，一级/二级均可） */
  itemIds: string[];
  /** 名称路径快照列表，每个元素为一条完整路径 */
  paths?: string[][];
}

/** 实体上的已分配分类（查询返回，多值结构） */
export interface EntityClassification {
  classificationKeyId: string;
  keyName: string;
  /** 已选枚举值列表（按选中顺序） */
  selectedItems: Array<{
    id: string;
    name: string;
    /** 完整路径（根→自身），用于回填与链路展示 */
    path: Array<{ id: string; name: string }>;
  }>;
}


/** Mock 服务运行模式（用于演示 ready/empty/error） */
export type ClassificationMockMode = 'ready' | 'empty' | 'error';
