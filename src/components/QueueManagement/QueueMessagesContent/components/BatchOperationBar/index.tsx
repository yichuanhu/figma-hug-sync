import { useTranslation } from 'react-i18next';
import { Button, Space, Typography } from '@douyinfe/semi-ui';
import { RefreshCw, Trash2, X } from 'lucide-react';

import './index.less';

interface BatchOperationBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchRequeue: () => void;
  onBatchDelete: () => void;
}

const BatchOperationBar = ({
  selectedCount,
  onClearSelection,
  onBatchRequeue,
  onBatchDelete,
}: BatchOperationBarProps) => {
  const { t } = useTranslation();
  const { Text } = Typography;

  return (
    <div className="batch-operation-bar">
      <Space>
        <Text>{t('queueMessage.batch.selected', { count: selectedCount })}</Text>
        <Button
          icon={<X size={14} strokeWidth={2} />}
          size="small"
          theme="borderless"
          onClick={onClearSelection}
        >
          {t('queueMessage.batch.clearSelection')}
        </Button>
      </Space>
      <Space>
        <Button
          icon={<RefreshCw size={16} strokeWidth={2} />}
          onClick={onBatchRequeue}
        >
          {t('queueMessage.batch.requeue')}
        </Button>
        <Button
          icon={<Trash2 size={16} strokeWidth={2} />}
          type="danger"
          onClick={onBatchDelete}
        >
          {t('queueMessage.batch.delete')}
        </Button>
      </Space>
    </div>
  );
};

export default BatchOperationBar;
