import { useCallback, useMemo } from 'react';
import type { CollaboratorAssetType, CollaboratorRole, CollaboratorAddItem } from '@/api/index';
import {
  addCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
  getCascadeCount,
  hasCascadeRules,
} from '@/components/CollaboratorManager/mockData';

/**
 * 协作者级联操作 Hook
 * 处理添加/移除/变更时自动级联到依赖资产
 */
export const useCollaboratorCascade = (
  assetType: CollaboratorAssetType,
  assetId: string
) => {
  const cascadeCount = useMemo(
    () => getCascadeCount(assetType, assetId),
    [assetType, assetId]
  );

  const canCascade = useMemo(
    () => hasCascadeRules(assetType),
    [assetType]
  );

  const cascadeAdd = useCallback(
    (items: CollaboratorAddItem[]) => {
      return addCollaborators(assetType, assetId, items);
    },
    [assetType, assetId]
  );

  const cascadeRemove = useCallback(
    (collaboratorId: string) => {
      return removeCollaborator(assetType, assetId, collaboratorId);
    },
    [assetType, assetId]
  );

  const cascadeUpdateRole = useCallback(
    (collaboratorId: string, newRole: CollaboratorRole) => {
      return updateCollaboratorRole(assetType, assetId, collaboratorId, newRole);
    },
    [assetType, assetId]
  );

  return {
    cascadeCount,
    canCascade,
    cascadeAdd,
    cascadeRemove,
    cascadeUpdateRole,
  };
};
