import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Toast, Typography } from '@douyinfe/semi-ui';
import type { LYQueueMessageResponse } from '@/api/index';

import './index.less';

interface ConsumeConfirmModalProps {
  visible: boolean;
  message: LYQueueMessageResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ConsumeConfirmModal = ({
  visible,
  message,
  onCancel,
  onSuccess,
}: ConsumeConfirmModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const { Text } = Typography;

  const handleConfirm = async () => {
    if (!message) return;

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      Toast.success(t('queueMessage.consumeModal.success'));
      onSuccess();
    } catch (error) {
      Toast.error(t('queueMessage.consumeModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('queueMessage.consumeModal.title')}
      visible={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      confirmLoading={loading}
      className="consume-confirm-modal"
    >
      <div className="consume-confirm-modal-content">
        <Text>{t('queueMessage.consumeModal.confirmMessage')}</Text>
        <div className="consume-confirm-modal-tips">
          <Text type="tertiary">{t('queueMessage.consumeModal.tips')}</Text>
        </div>
      </div>
    </Modal>
  );
};

export default ConsumeConfirmModal;
