// 流程资料权限点 Hook（mock 全开，预留接入 UCI）
export interface ProcessDocumentPermission {
  canView: boolean;
  canUpload: boolean;
  canDownload: boolean;
  canDelete: boolean;
}

export const useProcessDocumentPermission = (
  _processId?: string,
): ProcessDocumentPermission => {
  return {
    canView: true,
    canUpload: true,
    canDownload: true,
    canDelete: true,
  };
};
