import { Tag } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { NotificationSeverity } from '@/pages/NotificationCenter/types';

const colorMap: Record<NotificationSeverity, 'red' | 'orange' | 'grey'> = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'grey',
};

interface Props {
  severity: NotificationSeverity;
}

const SeverityTag = ({ severity }: Props) => {
  const { t } = useTranslation();
  return (
    <Tag size="small" color={colorMap[severity]}>
      {t(`notificationCenter.severity.${severity.toLowerCase()}`)}
    </Tag>
  );
};

export default SeverityTag;
