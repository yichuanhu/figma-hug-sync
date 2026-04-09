import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import './index.less';
import { Clock } from 'lucide-react';

const { Text } = Typography;

const QueueTriggerPlaceholder = () => {
  const { t } = useTranslation();

  return (
    <div className="queue-trigger-placeholder">
      <Clock size={16} strokeWidth={2} className="queue-trigger-placeholder-icon" />
      <div className="queue-trigger-placeholder-title">
        {t('queueTrigger.pageTitle')}
      </div>
      <Text className="queue-trigger-placeholder-description">
        {t('queueTrigger.comingSoon')}
      </Text>
    </div>
  );
};

export default QueueTriggerPlaceholder;
