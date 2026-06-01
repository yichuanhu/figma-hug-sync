import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import type { RequirementStatus } from './types';

/**
 * 9 状态展示配置（颜色 / i18n key / 可执行操作）
 *
 * 操作矩阵（来源：用户提供的状态×操作表 + STORY-003 v7 + STORY-014 v2）：
 *
 * | 状态        | 编辑       | 删除 | 创建流程 | 提交 | 撤回 | 重新提交 | 取消 | 下线 | 重新上线 |
 * | DRAFT       | 全部字段   | ✓    |          | ✓    |      |          |      |      |          |
 * | PENDING_APR |            |      |          |      | ✓    |          |      |      |          |
 * | PENDING_ASM |            |      |          |      | ✓    |          |      |      |          |
 * | PENDING_PRJ | 业务字段   |      | ✓        |      |      |          | ✓    |      |          |
 * | DEVELOPING  | 业务字段   |      | ✓        |      |      |          |      |      |          |
 * | LAUNCHED    |            |      |          |      |      |          |      | ✓    |          |
 * | OFFLINE     |            |      |          |      |      |          |      |      | ✓        |
 * | REJECTED    | 全部字段   | ✓    |          |      |      | ✓        |      |      |          |
 * | WITHDRAWN   | 全部字段   | ✓    |          |      |      | ✓        |      |      |          |
 *
 * 备注：v2 已去除"双步编辑/发布变更"，所有编辑直接保存并自动记录变更日志。
 * 审批/评估的"通过/拒绝"是审批人/评估人在详情抽屉内执行，不出现在列表行操作里。
 */
export type RowAction =
  | 'edit'          // 编辑
  | 'delete'        // 删除（仅 DRAFT / REJECTED / WITHDRAWN）
  | 'submit'        // 提交（仅 DRAFT，提交人）
  | 'withdraw'      // 撤回（PENDING_APPROVAL / PENDING_ASSESSMENT，提交人）
  | 'resubmit'      // 重新提交（REJECTED / WITHDRAWN，提交人）
  | 'createProcess' // 创建流程（PENDING_PROJECT / DEVELOPING）
  | 'cancel'        // 取消（仅 PENDING_PROJECT，将需求置为 WITHDRAWN）
  | 'offline'       // 人工下线（LAUNCHED）
  | 'relaunch';     // 重新上线（OFFLINE）

export interface StatusConfigItem {
  color: TagColor;
  i18nKey: string;
  /** 编辑范围；undefined 表示完全不可编辑 */
  editScope?: 'ALL' | 'BUSINESS_ONLY';
  actions: RowAction[];
}

export const statusConfigV2: Record<RequirementStatus, StatusConfigItem> = {
  DRAFT:              { color: 'grey',   i18nKey: 'requirements.status.draft',             editScope: 'ALL',           actions: ['edit', 'delete', 'submit'] },
  PENDING_APPROVAL:   { color: 'orange', i18nKey: 'requirements.status.pendingApproval',                              actions: ['withdraw'] },
  PENDING_ASSESSMENT: { color: 'purple', i18nKey: 'requirements.status.pendingAssessment',                            actions: ['withdraw'] },
  PENDING_PROJECT:    { color: 'cyan',   i18nKey: 'requirements.status.pendingProject',    editScope: 'BUSINESS_ONLY', actions: ['edit', 'createProcess', 'cancel'] },
  DEVELOPING:         { color: 'blue',   i18nKey: 'requirements.status.developing',        editScope: 'BUSINESS_ONLY', actions: ['edit', 'createProcess'] },
  LAUNCHED:           { color: 'green',  i18nKey: 'requirements.status.launched',                                     actions: ['offline'] },
  OFFLINE:            { color: 'grey',   i18nKey: 'requirements.status.offline',                                      actions: ['relaunch'] },
  REJECTED:           { color: 'red',    i18nKey: 'requirements.status.rejected',          editScope: 'ALL',           actions: ['edit', 'resubmit', 'delete'] },
  WITHDRAWN:          { color: 'grey',   i18nKey: 'requirements.status.withdrawn',         editScope: 'ALL',           actions: ['edit', 'resubmit', 'delete'] },
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
  !!statusConfigV2[status]?.editScope;

export const isBusinessOnlyEdit = (status: RequirementStatus): boolean =>
  statusConfigV2[status]?.editScope === 'BUSINESS_ONLY';

export const canDelete = (status: RequirementStatus): boolean =>
  statusConfigV2[status]?.actions.includes('delete') ?? false;

export const canSubmit = (status: RequirementStatus): boolean =>
  statusConfigV2[status]?.actions.includes('submit') ?? false;

export const statusActions = (status: RequirementStatus): RowAction[] =>
  statusConfigV2[status]?.actions ?? [];
