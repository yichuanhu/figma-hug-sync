// 流程基本信息权限点 Hook（mock 全开，预留 UCI）
// process_basic_info.view / process_basic_info.update
export interface ProcessBasicInfoPermission {
  canView: boolean;
  canUpdate: boolean;
}

export const useProcessBasicInfoPermission = (
  _processId?: string,
): ProcessBasicInfoPermission => {
  return { canView: true, canUpdate: true };
};
