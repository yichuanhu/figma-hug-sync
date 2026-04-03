import { useState, useEffect, useMemo } from 'react';
import type { CollaboratorRole, CollaboratorAssetType, CollaboratorSourceType } from '@/api/index';
import { COLLABORATOR_ROLE_PRIORITY } from '@/api/index';

interface CollaboratorPermission {
  role: CollaboratorRole | null;
  /** MAX 计算后的最终角色 */
  finalRole: CollaboratorRole | null;
  /** 权限来源明细 */
  sourceDetails: { sourceType: CollaboratorSourceType; role: CollaboratorRole }[];
  canManage: boolean;
  canEdit: boolean;
  canUse: boolean;
  canView: boolean;
  loading: boolean;
}

/**
 * 协作者权限判断 Hook
 * 计算 final_role = MAX(直接, 部门, 层级继承, 依赖继承)
 * 当前使用 Mock 数据，后续接入真实 API
 */
export const useCollaboratorPermission = (
  _assetType: CollaboratorAssetType,
  _assetId: string | undefined
): CollaboratorPermission => {
  const [loading, setLoading] = useState(true);

  // Mock: 当前用户的多源权限
  const [sourceDetails] = useState<{ sourceType: CollaboratorSourceType; role: CollaboratorRole }[]>([
    { sourceType: 'DIRECT', role: 'MANAGER' },
  ]);

  useEffect(() => {
    if (!_assetId) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, [_assetId]);

  // 计算 MAX(所有来源权限)
  const safeSourceDetails = Array.isArray(sourceDetails) ? sourceDetails : [];

  const finalRole = useMemo(() => {
    if (safeSourceDetails.length === 0) return null;
    return safeSourceDetails.reduce<CollaboratorRole>((max, current) =>
      COLLABORATOR_ROLE_PRIORITY[current.role] > COLLABORATOR_ROLE_PRIORITY[max]
        ? current.role
        : max
    , safeSourceDetails[0].role);
  }, [safeSourceDetails]);

  const directRole = sourceDetails.find((s) => s.sourceType === 'DIRECT')?.role || null;
  const priority = finalRole ? COLLABORATOR_ROLE_PRIORITY[finalRole] : 0;

  return {
    role: directRole,
    finalRole,
    sourceDetails,
    canManage: priority >= COLLABORATOR_ROLE_PRIORITY.MANAGER,
    canEdit: priority >= COLLABORATOR_ROLE_PRIORITY.MAINTAINER,
    canUse: priority >= COLLABORATOR_ROLE_PRIORITY.USER,
    canView: priority >= COLLABORATOR_ROLE_PRIORITY.OBSERVER,
    loading,
  };
};
