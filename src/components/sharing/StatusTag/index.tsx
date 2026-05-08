import { Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle2, FileEdit, XCircle } from 'lucide-react';
import './index.less';

export type ShareStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';

interface Props {
  status: ShareStatus;
  size?: 'small' | 'default';
}

const colorMap: Record<ShareStatus, 'grey' | 'orange' | 'green' | 'red'> = {
  DRAFT: 'grey',
  PENDING_APPROVAL: 'orange',
  PUBLISHED: 'green',
  REJECTED: 'red',
};

const StatusTag = ({ status, size = 'small' }: Props) => {
  const { t } = useTranslation();
  const icon = (() => {
    switch (status) {
      case 'DRAFT': return <FileEdit size={12} strokeWidth={2} />;
      case 'PENDING_APPROVAL': return <Clock size={12} strokeWidth={2} />;
      case 'PUBLISHED': return <CheckCircle2 size={12} strokeWidth={2} />;
      case 'REJECTED': return <XCircle size={12} strokeWidth={2} />;
    }
  })();
  const labelKey = `sharing.common.status.${
    status === 'DRAFT' ? 'draft'
    : status === 'PENDING_APPROVAL' ? 'pending'
    : status === 'PUBLISHED' ? 'published'
    : 'rejected'
  }`;
  return (
    <Tag size={size} type="light" color={colorMap[status]} className="sharing-status-tag" prefixIcon={icon}>
      {t(labelKey)}
    </Tag>
  );
};

export default StatusTag;
