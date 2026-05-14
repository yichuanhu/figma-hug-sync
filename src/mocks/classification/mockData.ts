import type { ClassificationKey } from './types';

/**
 * FEAT-003 中适用于 requirement 的分类键（Mock）
 * 实际由 FEAT-003 管理员维护
 */
export const MOCK_CLASSIFICATION_KEYS: ClassificationKey[] = [
  {
    id: 'cls-key-scenario',
    name: '场景',
    description: '需求所处的业务场景阶段',
    status: 'ACTIVE',
    applicableBusinessObjectTypes: ['requirement'],
    order: 1,
    values: [
      { id: 'cls-val-scenario-integration', name: '集成', status: 'ACTIVE', order: 1 },
      { id: 'cls-val-scenario-pilot', name: '试点', status: 'ACTIVE', order: 2 },
      { id: 'cls-val-scenario-promotion', name: '推广', status: 'ACTIVE', order: 3 },
      { id: 'cls-val-scenario-ops', name: '运维', status: 'ACTIVE', order: 4 },
    ],
  },
  {
    id: 'cls-key-reusability',
    name: '重复度',
    description: '需求的复用程度',
    status: 'ACTIVE',
    applicableBusinessObjectTypes: ['requirement'],
    order: 2,
    values: [
      { id: 'cls-val-reuse-once', name: '一次性', status: 'ACTIVE', order: 1 },
      { id: 'cls-val-reuse-reusable', name: '可复用', status: 'ACTIVE', order: 2 },
      { id: 'cls-val-reuse-component', name: '通用组件', status: 'ACTIVE', order: 3 },
    ],
  },
  {
    id: 'cls-key-operation',
    name: '操作类型',
    description: '需求涉及的主要业务操作类型',
    status: 'ACTIVE',
    applicableBusinessObjectTypes: ['requirement'],
    order: 3,
    values: [
      { id: 'cls-val-op-input', name: '录入类', status: 'ACTIVE', order: 1 },
      { id: 'cls-val-op-query', name: '查询类', status: 'ACTIVE', order: 2 },
      { id: 'cls-val-op-approval', name: '审批类', status: 'ACTIVE', order: 3 },
      { id: 'cls-val-op-notification', name: '通知类', status: 'ACTIVE', order: 4 },
    ],
  },
];
