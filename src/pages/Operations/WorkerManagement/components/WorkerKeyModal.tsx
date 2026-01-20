import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Typography, Button, Toast } from '@douyinfe/semi-ui';
import { IconCopy } from '@douyinfe/semi-icons';

const { Text } = Typography;

interface WorkerData {
  id: string;
  name: string;
  deviceToken: string;
}

interface WorkerKeyModalProps {
  visible: boolean;
  onClose: () => void;
  workerData: WorkerData | null;
}

const WorkerKeyModal = ({ visible, onClose, workerData }: WorkerKeyModalProps) => {
  const { t } = useTranslation();
  const [copying, setCopying] = useState(false);

  if (!workerData) return null;

  const handleCopy = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(workerData.deviceToken);
      Toast.success(t('worker.keyModal.copySuccess'));
    } catch (err) {
      Toast.error(t('worker.keyModal.copyError'));
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal
      title={t('worker.keyModal.title', { name: workerData.name })}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
    >
      <div style={{ padding: '16px 0' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          {t('worker.keyModal.description')}
        </Text>
        
        <div style={{ 
          backgroundColor: 'var(--semi-color-fill-0)',
          border: '1px solid var(--semi-color-border)',
          borderRadius: 6,
          padding: 16,
          marginBottom: 16,
          wordBreak: 'break-all',
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          {workerData.deviceToken}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            icon={<IconCopy />} 
            theme="solid" 
            type="primary"
            onClick={handleCopy}
            loading={copying}
          >
            {t('common.copy')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WorkerKeyModal;
