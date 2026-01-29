import { useTranslation } from 'react-i18next';
import { Modal, Typography } from '@douyinfe/semi-ui';
import type { LYQueueMessageResponse } from '@/api/index';

import './index.less';

interface ConsumeMessageModalProps {
  visible: boolean;
  message: LYQueueMessageResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ConsumeMessageModal = ({
  visible,
  message,
  onCancel,
  onSuccess,
}: ConsumeMessageModalProps) => {
  const { t } = useTranslation();
  const { Text } = Typography;

  const handleConfirm = async () => {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));
    onSuccess();
  };

  return (
    <Modal
      title={t('queueMessage.consumeModal.title')}
      visible={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      className="consume-message-modal"
    >
      <div className="consume-message-modal-content">
        <Text>{t('queueMessage.consumeModal.confirmMessage')}</Text>
        {message && (
          <div className="consume-message-modal-info">
            <Text type="tertiary">{t('queueMessage.table.messageNumber')}: </Text>
            <Text strong>{message.message_number}</Text>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConsumeMessageModal;
