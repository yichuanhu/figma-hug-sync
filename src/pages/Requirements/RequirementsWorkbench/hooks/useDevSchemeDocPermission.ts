import { useEffect, useState } from 'react';
import {
  checkDevSchemeDocCanManage,
  MOCK_CURRENT_USER_ID,
} from '../mockData';

export interface DevSchemeDocPermission {
  loading: boolean;
  canManage: boolean;
  isPostProject: boolean;
  hasWorkspace: boolean;
  isWorkspaceMember: boolean;
  /** UI 提示原因 i18n key（disable Tooltip 用） */
  disabledReasonKey: string | null;
}

export const useDevSchemeDocPermission = (
  requirementId: string,
  refreshKey?: number,
): DevSchemeDocPermission => {
  const [state, setState] = useState<DevSchemeDocPermission>({
    loading: true,
    canManage: false,
    isPostProject: false,
    hasWorkspace: false,
    isWorkspaceMember: false,
    disabledReasonKey: null,
  });

  useEffect(() => {
    let alive = true;
    checkDevSchemeDocCanManage(requirementId, MOCK_CURRENT_USER_ID).then((r) => {
      if (!alive) return;
      const canManage = r.isPostProject && r.hasWorkspace && r.isMember;
      let disabledReasonKey: string | null = null;
      if (!r.isPostProject) disabledReasonKey = 'requirements.devScheme.disable.notPostProject';
      else if (!r.hasWorkspace) disabledReasonKey = 'requirements.devScheme.disable.noWorkspace';
      else if (!r.isMember) disabledReasonKey = 'requirements.devScheme.disable.notMember';
      setState({
        loading: false,
        canManage,
        isPostProject: r.isPostProject,
        hasWorkspace: r.hasWorkspace,
        isWorkspaceMember: r.isMember,
        disabledReasonKey,
      });
    });
    return () => {
      alive = false;
    };
  }, [requirementId, refreshKey]);

  return state;
};
