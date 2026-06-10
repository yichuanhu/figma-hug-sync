import { useTranslation } from 'react-i18next';
import StatusDot, { type StatusDotColor } from '@/components/StatusDot';

export type ShareStatus = 'DRAFT' | 'PENDING_PUBLISH' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED' | 'UNLISTED';

interface Props {
  status: ShareStatus;
  size?: 'small' | 'default';
}

const colorMap: Record<ShareStatus, StatusDotColor> = {
  DRAFT: 'grey',
  PENDING_PUBLISH: 'blue',
  PENDING_APPROVAL: 'orange',
  PUBLISHED: 'green',
  REJECTED: 'red',
  ARCHIVED: 'amber',
  UNLISTED: 'light-blue',
};

const StatusTag = ({ status }: Props) => {
  const { t } = useTranslation();
  const labelKey = `sharing.common.status.${
    status === 'DRAFT' ? 'draft'
    : status === 'PENDING_PUBLISH' ? 'pendingPublish'
    : status === 'PENDING_APPROVAL' ? 'pending'
    : status === 'PUBLISHED' ? 'published'
    : status === 'REJECTED' ? 'rejected'
    : status === 'ARCHIVED' ? 'archived'
    : 'unlisted'
  }`;
  return <StatusDot color={colorMap[status]} label={t(labelKey)} />;
};

export default StatusTag;
