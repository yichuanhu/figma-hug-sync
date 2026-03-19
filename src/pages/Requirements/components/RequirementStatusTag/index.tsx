import { Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { ApprovalStatus, DevelopmentStatus, OperationStatus, RequirementPriority } from '@/api';

type StatusType = 'approval' | 'development' | 'operation' | 'priority';

interface RequirementStatusTagProps {
  type: StatusType;
  value: string;
}

const statusColorMap: Record<string, Record<string, { color: string; i18nKey: string }>> = {
  approval: {
    DRAFT: { color: 'grey', i18nKey: 'requirement.approvalStatus.DRAFT' },
    BUSINESS_PENDING: { color: 'orange', i18nKey: 'requirement.approvalStatus.BUSINESS_PENDING' },
    BUSINESS_APPROVED: { color: 'blue', i18nKey: 'requirement.approvalStatus.BUSINESS_APPROVED' },
    BUSINESS_REJECTED: { color: 'red', i18nKey: 'requirement.approvalStatus.BUSINESS_REJECTED' },
    TECH_PENDING: { color: 'orange', i18nKey: 'requirement.approvalStatus.TECH_PENDING' },
    TECH_APPROVED: { color: 'green', i18nKey: 'requirement.approvalStatus.TECH_APPROVED' },
    TECH_REJECTED: { color: 'red', i18nKey: 'requirement.approvalStatus.TECH_REJECTED' },
  },
  development: {
    NOT_STARTED: { color: 'grey', i18nKey: 'requirement.devStatus.NOT_STARTED' },
    ASSESSING: { color: 'blue', i18nKey: 'requirement.devStatus.ASSESSING' },
    IN_DEVELOPMENT: { color: 'cyan', i18nKey: 'requirement.devStatus.IN_DEVELOPMENT' },
    DEVELOPED: { color: 'green', i18nKey: 'requirement.devStatus.DEVELOPED' },
  },
  operation: {
    NOT_LIVE: { color: 'grey', i18nKey: 'requirement.opStatus.NOT_LIVE' },
    RUNNING: { color: 'green', i18nKey: 'requirement.opStatus.RUNNING' },
    SUSPENDED: { color: 'orange', i18nKey: 'requirement.opStatus.SUSPENDED' },
    ARCHIVED: { color: 'grey', i18nKey: 'requirement.opStatus.ARCHIVED' },
  },
  priority: {
    HIGH: { color: 'red', i18nKey: 'requirement.priority.HIGH' },
    MEDIUM: { color: 'orange', i18nKey: 'requirement.priority.MEDIUM' },
    LOW: { color: 'grey', i18nKey: 'requirement.priority.LOW' },
  },
};

const RequirementStatusTag = ({ type, value }: RequirementStatusTagProps) => {
  const { t } = useTranslation();
  const config = statusColorMap[type]?.[value];
  if (!config) return <span>-</span>;
  return <Tag color={config.color as any}>{t(config.i18nKey)}</Tag>;
};

export default RequirementStatusTag;
