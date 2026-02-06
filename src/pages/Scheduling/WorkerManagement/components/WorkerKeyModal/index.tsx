import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Typography, Button, Toast } from '@douyinfe/semi-ui';
import { IconCopyStroked } from '@douyinfe/semi-icons';
import type { LYWorkerResponse } from '@/api';
import './index.less';

const { Text } = Typography;

interface WorkerKeyModalProps {
  visible: boolean;
  onClose: () => void;
  workerData: LYWorkerResponse | null;
}

const WorkerKeyModal = ({ visible, onClose, workerData }: WorkerKeyModalProps) => {
  const { t } = useTranslation();
  const [copying, setCopying] = useState(false);

  if (!workerData) return null;

  const handleCopy = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(workerData.device_token);
      Toast.success(t('worker.keyModal.copySuccess'));
    } catch {
      Toast.error(t('worker.keyModal.copyError'));
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal title={t('worker.keyModal.title', { name: workerData.name })} visible={visible} onCancel={onClose} footer={null} width={480} centered>
      <div className="worker-key-modal-content">
        <Text type="secondary" className="worker-key-modal-description">
          {t('worker.keyModal.description')}
        </Text>

        <div className="worker-key-modal-token">{workerData.device_token}</div>

        <div className="worker-key-modal-footer">
          <Button icon={<IconCopyStroked />} theme="solid" type="primary" onClick={handleCopy} loading={copying}>
            {t('common.copy')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WorkerKeyModal;
