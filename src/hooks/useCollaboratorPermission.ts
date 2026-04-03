import { useState, useEffect } from 'react';
import type { CollaboratorRole, CollaboratorAssetType } from '@/api/index';
import { COLLABORATOR_ROLE_PRIORITY } from '@/api/index';

interface CollaboratorPermission {
  role: CollaboratorRole | null;
  canManage: boolean;
  canEdit: boolean;
  canUse: boolean;
  canView: boolean;
  loading: boolean;
}

/**
 * 协作者权限判断 Hook
 * 当前使用 Mock 数据，后续接入真实 API
 */
export const useCollaboratorPermission = (
  _assetType: CollaboratorAssetType,
  _assetId: string | undefined
): CollaboratorPermission => {
  const [loading, setLoading] = useState(true);
  // Mock: 当前用户为 MANAGER
  const [role] = useState<CollaboratorRole>('MANAGER');

  useEffect(() => {
    if (!_assetId) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, [_assetId]);

  const priority = role ? COLLABORATOR_ROLE_PRIORITY[role] : 0;

  return {
    role,
    canManage: priority >= COLLABORATOR_ROLE_PRIORITY.MANAGER,
    canEdit: priority >= COLLABORATOR_ROLE_PRIORITY.MAINTAINER,
    canUse: priority >= COLLABORATOR_ROLE_PRIORITY.USER,
    canView: priority >= COLLABORATOR_ROLE_PRIORITY.OBSERVER,
    loading,
  };
};
