import { useState, useCallback, type ReactNode } from 'react';
import CollaboratorPanel from '@/components/CollaboratorManager/CollaboratorPanel';
import type { CollaboratorAssetType } from '@/api/index';

interface UseCollaboratorActionReturn {
  collaboratorVisible: boolean;
  collaboratorAssetId: string;
  openCollaborator: (assetId: string) => void;
  closeCollaborator: () => void;
  setCollaboratorVisible: (visible: boolean) => void;
  renderCollaboratorPanel: (
    assetType: CollaboratorAssetType,
    context: 'development' | 'scheduling',
    canManage?: boolean
  ) => ReactNode;
}

/**
 * 协作者操作 Hook
 * 封装协作者弹窗状态管理 + CollaboratorPanel 渲染逻辑
 */
export const useCollaboratorAction = (): UseCollaboratorActionReturn => {
  const [collaboratorVisible, setCollaboratorVisible] = useState(false);
  const [collaboratorAssetId, setCollaboratorAssetId] = useState('');

  const openCollaborator = useCallback((assetId: string) => {
    setCollaboratorAssetId(assetId);
    setCollaboratorVisible(true);
  }, []);

  const closeCollaborator = useCallback(() => {
    setCollaboratorVisible(false);
  }, []);

  const renderCollaboratorPanel = useCallback(
    (
      assetType: CollaboratorAssetType,
      context: 'development' | 'scheduling',
      canManage = true
    ): ReactNode => (
      <CollaboratorPanel
        visible={collaboratorVisible}
        onVisibleChange={setCollaboratorVisible}
        assetType={assetType}
        assetId={collaboratorAssetId}
        context={context}
        canManage={canManage}
      />
    ),
    [collaboratorVisible, collaboratorAssetId]
  );

  return {
    collaboratorVisible,
    collaboratorAssetId,
    openCollaborator,
    closeCollaborator,
    setCollaboratorVisible,
    renderCollaboratorPanel,
  };
};
