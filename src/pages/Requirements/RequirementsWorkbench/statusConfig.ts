import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import type { RequirementStatus } from './types';

/**
 * 9 状态展示配置（颜色 / i18n key / 可执行操作）
 */
export interface StatusConfigItem {
  color: TagColor;
  i18nKey: string;
  /** 当前状态可执行的操作 */
  actions: Array<'edit' | 'delete' | 'submit' | 'approve' | 'assess' | 'withdraw' | 'offline' | 'view'>;
}

export const statusConfigV2: Record<RequirementStatus, StatusConfigItem> = {
  DRAFT:              { color: 'grey',   i18nKey: 'requirements.status.draft',             actions: ['view', 'edit', 'delete', 'submit'] },
  PENDING_APPROVAL:   { color: 'orange', i18nKey: 'requirements.status.pendingApproval',   actions: ['view', 'approve', 'withdraw'] },
  PENDING_ASSESSMENT: { color: 'purple', i18nKey: 'requirements.status.pendingAssessment', actions: ['view', 'assess', 'withdraw'] },
  PENDING_PROJECT:    { color: 'cyan',   i18nKey: 'requirements.status.pendingProject',    actions: ['view'] },
  DEVELOPING:         { color: 'blue',   i18nKey: 'requirements.status.developing',        actions: ['view'] },
  LAUNCHED:           { color: 'green',  i18nKey: 'requirements.status.launched',          actions: ['view', 'offline'] },
  OFFLINE:            { color: 'grey',   i18nKey: 'requirements.status.offline',           actions: ['view'] },
  REJECTED:           { color: 'red',    i18nKey: 'requirements.status.rejected',          actions: ['view', 'delete'] },
  WITHDRAWN:          { color: 'grey',   i18nKey: 'requirements.status.withdrawn',         actions: ['view', 'edit', 'delete', 'submit'] },
};

/** 旧状态 → 新状态映射（用于读取历史 mock 数据） */
export const legacyStatusMap: Record<string, RequirementStatus> = {
  PENDING:    'PENDING_APPROVAL',
  APPROVED:   'PENDING_ASSESSMENT',
  ASSESSING:  'PENDING_ASSESSMENT',
  DEVELOPING: 'DEVELOPING',
  DEVELOPED:  'DEVELOPING',
  RUNNING:    'LAUNCHED',
  STOPPED:    'OFFLINE',
  ARCHIVED:   'OFFLINE',
};

/** 9 状态选项（供 Select / FilterPopover 使用） */
export const statusOptionsV2: Array<{ value: RequirementStatus; i18nKey: string }> = [
  { value: 'DRAFT',              i18nKey: 'requirements.status.draft' },
  { value: 'PENDING_APPROVAL',   i18nKey: 'requirements.status.pendingApproval' },
  { value: 'PENDING_ASSESSMENT', i18nKey: 'requirements.status.pendingAssessment' },
  { value: 'PENDING_PROJECT',    i18nKey: 'requirements.status.pendingProject' },
  { value: 'DEVELOPING',         i18nKey: 'requirements.status.developing' },
  { value: 'LAUNCHED',           i18nKey: 'requirements.status.launched' },
  { value: 'OFFLINE',            i18nKey: 'requirements.status.offline' },
  { value: 'REJECTED',           i18nKey: 'requirements.status.rejected' },
  { value: 'WITHDRAWN',          i18nKey: 'requirements.status.withdrawn' },
];

export const canEdit = (status: RequirementStatus): boolean =>
  statusConfigV2[status]?.actions.includes('edit') ?? false;

export const canDelete = (status: RequirementStatus): boolean =>
  statusConfigV2[status]?.actions.includes('delete') ?? false;

export const canSubmit = (status: RequirementStatus): boolean =>
  statusConfigV2[status]?.actions.includes('submit') ?? false;
