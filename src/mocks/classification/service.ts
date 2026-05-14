/**
 * FEAT-003 数据分类共享服务 — 前端 Mock 实现
 *
 * 对应 API：
 * - GET  /api/classifications/for-entity/{entityType}
 * - GET  /api/entities/{entityType}/{entityId}/classifications
 * - POST /api/entities/classifications/assign
 *
 * 通过 setClassificationMockMode 可在控制台切换 ready / empty / error，便于演示
 * AC-ERR-01（FEAT-003 不可用）与 AC-ERR-02（无适用分类键）。
 */
import { MOCK_CLASSIFICATION_KEYS } from './mockData';
import type {
  BusinessObjectType,
  ClassificationAssignmentItem,
  ClassificationKey,
  ClassificationMockMode,
  EntityClassification,
} from './types';

let MOCK_MODE: ClassificationMockMode = 'ready';

/** 实体已分配分类的内存存储 */
const ENTITY_ASSIGNMENTS = new Map<string, ClassificationAssignmentItem[]>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const buildKey = (entityType: BusinessObjectType, entityId: string) => `${entityType}::${entityId}`;

/** 切换 mock 模式（仅供调试/演示） */
export const setClassificationMockMode = (mode: ClassificationMockMode) => {
  MOCK_MODE = mode;
  // eslint-disable-next-line no-console
  console.info(`[classification mock] mode = ${mode}`);
};

/** 当前 mock 模式 */
export const getClassificationMockMode = (): ClassificationMockMode => MOCK_MODE;

/** 暴露到 window 便于在浏览器调试时切换 */
if (typeof window !== 'undefined') {
  (window as unknown as { __setClassificationMode?: typeof setClassificationMockMode }).__setClassificationMode =
    setClassificationMockMode;
}

/**
 * 获取适用于某实体类型的所有 ACTIVE 分类键
 * 对应 GET /api/classifications/for-entity/{entityType}
 */
export const fetchClassificationsForEntity = async (
  entityType: BusinessObjectType,
): Promise<ClassificationKey[]> => {
  await sleep(280);
  if (MOCK_MODE === 'error') {
    throw new Error('FEAT-003 service unavailable');
  }
  if (MOCK_MODE === 'empty') {
    return [];
  }
  return MOCK_CLASSIFICATION_KEYS
    .filter(
      (k) => k.status === 'ACTIVE' && k.applicableBusinessObjectTypes.includes(entityType),
    )
    .map((k) => ({
      ...k,
      values: k.values.filter((v) => v.status === 'ACTIVE'),
    }));
};

/**
 * 查询某实体已分配的分类
 * 对应 GET /api/entities/{entityType}/{entityId}/classifications
 */
export const fetchEntityClassifications = async (
  entityType: BusinessObjectType,
  entityId: string,
): Promise<EntityClassification[]> => {
  await sleep(200);
  if (MOCK_MODE === 'error') {
    throw new Error('FEAT-003 service unavailable');
  }
  const stored = ENTITY_ASSIGNMENTS.get(buildKey(entityType, entityId)) ?? [];
  const keys = MOCK_CLASSIFICATION_KEYS;
  return stored
    .map((item) => {
      const key = keys.find((k) => k.id === item.classificationKeyId);
      if (!key) return null;
      const values = item.valueIds
        .map((vid) => key.values.find((v) => v.id === vid))
        .filter((v): v is NonNullable<typeof v> => !!v)
        .map((v) => ({ id: v.id, name: v.name }));
      return {
        classificationKeyId: key.id,
        keyName: key.name,
        values,
      } as EntityClassification;
    })
    .filter((x): x is EntityClassification => !!x);
};

/**
 * 分配/覆盖某实体的分类
 * 对应 POST /api/entities/classifications/assign
 * 幂等覆盖语义
 */
export const assignEntityClassifications = async (
  entityType: BusinessObjectType,
  entityId: string,
  classifications: ClassificationAssignmentItem[],
): Promise<{ success: true }> => {
  await sleep(220);
  if (MOCK_MODE === 'error') {
    throw new Error('FEAT-003 assign API failed');
  }
  // 过滤掉空的 valueIds
  const cleaned = classifications.filter((c) => c.valueIds && c.valueIds.length > 0);
  ENTITY_ASSIGNMENTS.set(buildKey(entityType, entityId), cleaned);
  return { success: true };
};

/** 删除实体分类（用于创建失败回滚） */
export const removeEntityClassifications = (
  entityType: BusinessObjectType,
  entityId: string,
) => {
  ENTITY_ASSIGNMENTS.delete(buildKey(entityType, entityId));
};
