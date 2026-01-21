import { useTranslation } from 'react-i18next';
import { Modal, Typography } from '@douyinfe/semi-ui';
import { IconAlertTriangle } from '@douyinfe/semi-icons';
import './index.less';

const { Text } = Typography;

interface ProcessData {
  id: string;
  name: string;
}

interface ProcessDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  processData: ProcessData | null;
  onConfirm: () => void;
  loading?: boolean;
}

const ProcessDeleteModal = ({ visible, onClose, processData, onConfirm, loading }: ProcessDeleteModalProps) => {
  const { t } = useTranslation();

  if (!processData) return null;

  return (
    <Modal
      title={
        <div className="process-delete-modal-header">
          <IconAlertTriangle className="process-delete-modal-header-icon" />
          <span>{t('development.processDevelopment.deleteModal.title')}</span>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      onOk={onConfirm}
      okText={t('development.processDevelopment.deleteModal.confirmDelete')}
      cancelText={t('common.cancel')}
      okButtonProps={{
        type: 'danger',
        loading,
      }}
      width={420}
      centered
    >
      <div className="process-delete-modal-content">
        <Text className="process-delete-modal-message">
          {t('development.processDevelopment.deleteModal.confirmMessage', { name: processData.name })}
        </Text>
        <Text type="tertiary">{t('development.processDevelopment.deleteModal.deleteWarning')}</Text>
      </div>
    </Modal>
  );
};

export default ProcessDeleteModal;
